import torch
import torch.nn.utils.prune as prune
import os
import gc
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

def apply_pruning_cpu(model, amount=0.3):
    print(f"Applying magnitude-based pruning ({amount*100}% sparsity) on CPU...")
    for name, module in model.named_modules():
        if isinstance(module, torch.nn.Linear):
            prune.l1_unstructured(module, name='weight', amount=amount)
            prune.remove(module, 'weight')
    return model

def save_weights(model, name):
    output_dir = f"compressed_models/{name}"
    print(f"Saving weights for {name} to {output_dir}...")
    model.save_pretrained(output_dir)

def compress():
    model_path = "qwen2.5-3b"
    os.makedirs("compressed_models", exist_ok=True)
    
    bnb_config_4bit = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True
    )

    # 1. Baseline FP16 Weights (for reference/eval)
    print("\n--- Saving Baseline Weights (FP16) ---")
    if not os.path.exists("compressed_models/qwen2.5-3b-baseline-fp16"):
        model_base = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True
        )
        save_weights(model_base, "qwen2.5-3b-baseline-fp16")
        del model_base
        gc.collect()
    else:
        print("Baseline weights already exist.")

    # 2. Pruned FP16 Weights
    print("\n--- Weight Pruning (FP16) ---")
    if not os.path.exists("compressed_models/qwen2.5-3b-pruned"):
        model_pruned = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True
        )
        model_pruned = apply_pruning_cpu(model_pruned, amount=0.3)
        save_weights(model_pruned, "qwen2.5-3b-pruned")
        del model_pruned
        gc.collect()
    else:
        print("Pruned weights already exist.")

    # 3. INT4 weights (BNB)
    # Note: These are saved as a quantized format that transformers understands.
    print("\n--- INT4 Quantization (BNB) ---")
    if not os.path.exists("compressed_models/qwen2.5-3b-int4"):
        model_int4 = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=bnb_config_4bit,
            low_cpu_mem_usage=True
        )
        save_weights(model_int4, "qwen2.5-3b-int4")
        del model_int4
        gc.collect()
    else:
        print("INT4 weights already exist.")

    # 4. Hybrid weights (Pruned -> INT4 BNB)
    print("\n--- Hybrid (Pruned -> INT4 BNB) ---")
    pruned_path = "compressed_models/qwen2.5-3b-pruned"
    if os.path.exists(pruned_path) and not os.path.exists("compressed_models/qwen2.5-3b-hybrid"):
        model_hybrid = AutoModelForCausalLM.from_pretrained(
            pruned_path,
            quantization_config=bnb_config_4bit,
            low_cpu_mem_usage=True
        )
        save_weights(model_hybrid, "qwen2.5-3b-hybrid")
        del model_hybrid
        gc.collect()
    else:
        print("Hybrid weights already exist or pruned weights missing.")
    
if __name__ == "__main__":
    compress()
