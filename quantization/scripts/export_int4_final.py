import torch
import torch.export
import os
import warnings
import gc
from transformers import AutoModelForCausalLM
from torchao.quantization import quantize_, IntxWeightOnlyConfig
from torchao.quantization.granularity import PerAxis
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
        return self.model(input_ids, use_cache=False).logits

def export_variant(model_path, output_name, quant_config=None):
    print(f"\n>>> Exporting {output_name} to ExecuTorch .pte ...")
    device = "cpu"
    
    try:
        print("Loading HuggingFace model in FP32 precision...")
        model = AutoModelForCausalLM.from_pretrained(
            model_path, 
            torch_dtype=torch.float32,  # Force FP32 to avoid BFloat16 edge crashes
            attn_implementation="eager",  # Force eager attention to bypass SDPA symbolic guards
            low_cpu_mem_usage=True,
            trust_remote_code=True
        ).to(device)
        model.eval()

        if quant_config:
            print(f"Applying quantization: {quant_config}...")
            quantize_(model, quant_config)

        wrapper = QwenWrapper(model)
        
        # Dummy example input for tracing structure
        example_input = (torch.zeros((1, 128), dtype=torch.long),)
        
        # Setup dynamic sequence length dimension (2 to 512 tokens)
        seq_len = torch.export.Dim("seq_len", min=2, max=512)
        dynamic_shapes = {"input_ids": {1: seq_len}}
        
        print("Tracing model with dynamic shapes (batch=1, seq_len=2..512)...")
        with torch.no_grad():
            traced_model = torch.export.export(
                wrapper, 
                example_input, 
                dynamic_shapes=dynamic_shapes,
                strict=False
            )
        
        print("Compiling to Edge IR...")
        edge_model = to_edge(traced_model, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
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
    
    print("\nAttempting INT4 export using Intx (logical 4-bit) with PerAxis(0)...")
    int4_config = IntxWeightOnlyConfig(
        weight_dtype=torch.int4,
        granularity=PerAxis(axis=0)
    )
    
    export_variant(base_model, "qwen2.5-3b-int4-ao", quant_config=int4_config)
