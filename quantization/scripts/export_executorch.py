import torch
import torch.export
import os
import warnings
import gc
from transformers import AutoModelForCausalLM
from torchao.quantization import quantize_, Int8WeightOnlyConfig
from executorch.exir import EdgeCompileConfig, to_edge
from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner

warnings.filterwarnings('ignore')

class QwenWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
        
    def forward(self, input_ids):
        # Constrain the sequence length to be strictly positive (min=2) to satisfy symbolic guards (e.g. RoPE/SDPA)
        torch._check(input_ids.shape[1] >= 2)
        # We enforce use_cache=False to avoid tracing complex KV-cache structures,
        # which are not supported by the basic XNNPACK partitioner out of the box.
        return self.model(input_ids, use_cache=False).logits

class EosProvider(torch.nn.Module):
    def forward(self):
        # Qwen2.5 EOS token ID is 151645.
        # Returning as a standard PyTorch scalar integer to ensure C++ runtime compatibility.
        return torch.tensor(151645, dtype=torch.long)

def export_variant(model_path, output_name, quant_config=None):
    print(f"\n>>> Exporting {output_name} to ExecuTorch .pte ...")
    device = "cpu"
    
    try:
        print("Loading HuggingFace model in FP32 precision...")
        model = AutoModelForCausalLM.from_pretrained(
            model_path, 
            torch_dtype=torch.float32,  # FORCE FP32 to avoid BFloat16 CPU execution crashes!
            attn_implementation="eager",  # FORCE eager attention to bypass SDPA symbolic guards
            low_cpu_mem_usage=True,
            trust_remote_code=True
        ).to(device)
        model.eval()

        if quant_config:
            print(f"Applying torchao quantization: {quant_config}...")
            quantize_(model, quant_config)

        wrapper = QwenWrapper(model)
        eos_provider = EosProvider()
        
        # We trace with a dynamic sequence length to avoid static shape constraints
        # that trigger runtime crashes when user inputs prompts of different lengths.
        example_input = (torch.zeros((1, 32), dtype=torch.long),)
        
        # Define dynamic shape for input_ids: batch size is fixed at 1, sequence length is dynamic
        seq_len = torch.export.Dim("seq_len", min=2, max=512)
        dynamic_shapes = {"input_ids": {1: seq_len}}
        
        print("Tracing model with dynamic shapes (batch=1, seq_len=2..512)...")
        with torch.no_grad():
            traced_forward = torch.export.export(
                wrapper, 
                example_input, 
                dynamic_shapes=dynamic_shapes,
                strict=False
            )
            # Export get_eos_ids as a separate static method
            traced_eos = torch.export.export(eos_provider, (), strict=False)
        
        print("Compiling to Edge IR...")
        edge_model = to_edge({
            "forward": traced_forward,
            "get_eos_ids": traced_eos
        }, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
        print("Lowering subgraphs to XNNPACK delegate...")
        edge_model = edge_model.to_backend(XnnpackPartitioner())
        
        print("Finalizing .pte binary buffer...")
        et_program = edge_model.to_executorch()
        
        output_path = f"compressed_models/{output_name}.pte"
        with open(output_path, "wb") as f:
            f.write(et_program.buffer)
        print(f"SUCCESS: Aligned and saved {output_path}")
        
    except Exception as e:
        print(f"FAILED to export {output_name}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'model' in locals():
            del model
        gc.collect()

if __name__ == "__main__":
    os.makedirs("compressed_models", exist_ok=True)
    base_model = "qwen2.5-3b"
    export_variant(base_model, "qwen2.5-3b-int8-ao", quant_config=Int8WeightOnlyConfig())
