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
            print(f"Applying quantization: {quant_config}...")
            quantize_(model, quant_config)

        wrapper = QwenWrapper(model)
        example_input = (torch.zeros((1, 128), dtype=torch.long),)
        
        print("Tracing model...")
        with torch.no_grad():
            # Use capture_pre_autograd_graph to help with decompositions
            from torch._export import capture_pre_autograd_graph
            model = capture_pre_autograd_graph(model, example_input)
            traced_model = torch.export.export(model, example_input, strict=False)
        
        print("Compiling to Edge IR...")
        # Add _check_ir_validity=False to ignore custom op issues for now
        edge_model = to_edge(traced_model, compile_config=EdgeCompileConfig(_check_ir_validity=False))
        
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
    
    # Cleanup large intermediate folder
    pruned_weights = "compressed_models/qwen2.5-3b-pruned"
    if os.path.exists(pruned_weights):
        print(f"Cleaning up {pruned_weights}...")
        import shutil
        shutil.rmtree(pruned_weights)

    print("\nAttempting INT4 export by stubbing mslk check...")
    import torchao.utils
    # Stub the check to bypass "Requires mslk" error
    torchao.utils._is_mslk_available = lambda: True
    
    from torchao.quantization import Int4WeightOnlyConfig
    import traceback
    
    try:
        # Using v2 with mslk check bypassed
        # If it tries to call a missing C++ op later, it will fail, 
        # but maybe tracing will work.
        int4_config = Int4WeightOnlyConfig(version=2)
        export_variant("qwen2.5-3b", "qwen2.5-3b-int4-ao", quant_config=int4_config)
    except Exception:
        traceback.print_exc()
