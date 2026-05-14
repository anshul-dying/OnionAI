import torch
import os
import warnings
import gc
from transformers import AutoModelForCausalLM
from torchao.quantization import quantize_, Int4WeightOnlyConfig
from executorch.exir import EdgeCompileConfig, to_edge
from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner

warnings.filterwarnings('ignore')

class QwenWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
    def forward(self, input_ids):
        return self.model(input_ids, use_cache=False).logits

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
            # Use use_mslk=False to bypass mslk requirement if possible
            # or try default plain quantization
            quantize_(model, quant_config)

        wrapper = QwenWrapper(model)
        example_input = (torch.zeros((1, 128), dtype=torch.long),)
        
        print("Tracing model (this may take ~5-10 mins and ~10GB RAM)...")
        with torch.no_grad():
            traced_model = torch.export.export(wrapper, example_input, strict=False)
        
        print("Compiling to Edge IR...")
        edge_model = to_edge(traced_model, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
        print("Lowering to XNNPACK...")
        edge_model = edge_model.to_backend(XnnpackPartitioner())
        
        print("Finalizing .pte buffer...")
        et_program = edge_model.to_executorch()
        
        output_path = f"compressed_models/{output_name}.pte"
        buffer_data = et_program.buffer
        
        with open(output_path, "wb") as f:
            f.write(buffer_data)
        print(f"SUCCESS: Saved {output_path}")
        
    except Exception as e:
        print(f"FAILED to export {output_name}: {e}")
        if "mslk" in str(e):
            print("\nSUGGESTION: Try installing mobile-schema-layer-kit:")
            print("pip install mobile-schema-layer-kit")
    finally:
        if 'model' in locals():
            del model
        gc.collect()

if __name__ == "__main__":
    os.makedirs("compressed_models", exist_ok=True)
    base_model = "qwen2.5-3b"
    pruned_weights = "compressed_models/qwen2.5-3b-pruned"
    
    from torchao.quantization import IntxWeightOnlyConfig
    # Attempt 4-bit using the generic Intx config which might use basic kernels
    # Mapping to 4-bit (16 levels)
    # Note: torch.int4 might not be a first-class dtype in all torch versions, 
    # but torchao often uses it as a logical type.
    
    # Use int4 for 4-bit quantization
    int4_config = IntxWeightOnlyConfig(weight_dtype=torch.int4)

    # 1. Export INT4 .pte
    export_variant(base_model, "qwen2.5-3b-int4-ao", quant_config=int4_config)

    # 2. Export Hybrid (Pruned + INT4) .pte
    if os.path.exists(pruned_weights):
        export_variant(pruned_weights, "qwen2.5-3b-hybrid-ao", quant_config=int4_config)
    else:
        print(f"Error: {pruned_weights} not found. Run compress_model.py first.")
