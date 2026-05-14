import torch
import os
import warnings
import gc
from transformers import AutoModelForCausalLM
from torchao.quantization import quantize_, Int8WeightOnlyConfig, Int4WeightOnlyConfig
from executorch.exir import EdgeCompileConfig, to_edge
from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner

warnings.filterwarnings('ignore')

class QwenWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
    def forward(self, input_ids):
        # use_cache=False is required for tracing
        return self.model(input_ids, use_cache=False).logits

def export_variant(model_path, output_name, quant_config=None):
    print(f"\n>>> Exporting {output_name} to ExecuTorch .pte ...")
    device = "cpu"
    
    try:
        # Load in BF16 for tracer compatibility
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
        # 128 tokens context for tracing
        example_input = (torch.zeros((1, 128), dtype=torch.long),)
        
        print("Tracing model (this may take ~5-10 mins and ~10GB RAM)...")
        with torch.no_grad():
            # Using strict=False for Qwen2.5 
            traced_model = torch.export.export(wrapper, example_input, strict=False)
        
        print("Compiling to Edge IR...")
        edge_model = to_edge(traced_model, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
        print("Lowering to XNNPACK...")
        edge_model = edge_model.to_backend(XnnpackPartitioner())
        
        print("Finalizing .pte buffer...")
        et_program = edge_model.to_executorch()
        
        output_path = f"compressed_models/{output_name}.pte"
        # Accessing .buffer property
        buffer_data = et_program.buffer
        
        with open(output_path, "wb") as f:
            f.write(buffer_data)
        print(f"SUCCESS: Saved {output_path}")
        
    except Exception as e:
        print(f"FAILED to export {output_name}: {e}")
    finally:
        if 'model' in locals():
            del model
        gc.collect()

if __name__ == "__main__":
    os.makedirs("compressed_models", exist_ok=True)
    base_model = "qwen2.5-3b"
    pruned_weights = "compressed_models/qwen2.5-3b-pruned"
    
    # We only export compressed .pte variants as requested.
    # Base model .safetensors is used directly for evaluation.

    # 1. Export Pruned .pte (from saved pruned weights)
    if os.path.exists(pruned_weights):
        export_variant(pruned_weights, "qwen2.5-3b-pruned")
    else:
        print(f"Skipping Pruned export: {pruned_weights} not found. Run compress_model.py first.")

    # 2. Export INT8 .pte (using torchao)
    export_variant(base_model, "qwen2.5-3b-int8-ao", quant_config=Int8WeightOnlyConfig())

    # 3. Export INT4 .pte (using torchao)
    export_variant(base_model, "qwen2.5-3b-int4-ao", quant_config=Int4WeightOnlyConfig())

    # 4. Export Hybrid (Pruned + INT4) .pte
    if os.path.exists(pruned_weights):
        export_variant(pruned_weights, "qwen2.5-3b-hybrid-ao", quant_config=Int4WeightOnlyConfig())
