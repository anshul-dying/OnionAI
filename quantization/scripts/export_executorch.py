import torch
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
        return self.model(input_ids, use_cache=False).logits

class EosProvider(torch.nn.Module):
    def forward(self):
        # Qwen2.5 EOS token ID is 151645.
        # Returning as an unboxed integer (scalar) because react-native-executorch
        # calls toScalar() in C++, which fails if given a tensor.
        return 151645

def export_variant(model_path, output_name, quant_config=None):
    print(f"\n>>> Exporting {output_name} to ExecuTorch .pte ...")
    device = "cpu"
    
    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_path, 
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        ).to(device)
        model.eval()

        if quant_config:
            print(f"Applying torchao quantization: {quant_config}...")
            quantize_(model, quant_config)

        wrapper = QwenWrapper(model)
        eos_provider = EosProvider()
        
        # Reduced sequence length (32) for faster testing on mobile
        example_input = (torch.zeros((1, 32), dtype=torch.long),)
        
        print("Tracing model...")
        with torch.no_grad():
            traced_forward = torch.export.export(wrapper, example_input, strict=False)
            # Export get_eos_ids as a separate method
            traced_eos = torch.export.export(eos_provider, (), strict=False)
        
        print("Compiling to Edge IR...")
        edge_model = to_edge({
            "forward": traced_forward,
            "get_eos_ids": traced_eos
        }, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
        print("Lowering to XNNPACK...")
        edge_model = edge_model.to_backend(XnnpackPartitioner())
        
        print("Finalizing .pte buffer...")
        et_program = edge_model.to_executorch()
        
        output_path = f"compressed_models/{output_name}.pte"
        with open(output_path, "wb") as f:
            f.write(et_program.buffer)
        print(f"SUCCESS: Saved {output_path}")
        
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
