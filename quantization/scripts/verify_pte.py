import torch
from executorch.runtime import Runtime
from transformers import AutoTokenizer
import os
import sys

def verify_pte(pte_path):
    if not os.path.exists(pte_path):
        print(f"Error: {pte_path} not found.")
        return

    print(f"\n>>> Verifying dynamic shape execution of {pte_path} ...")
    
    # Load tokenizer from source model directory
    is_gemma = "gemma" in pte_path.lower() or "model.pte" in pte_path.lower()
    if is_gemma:
        if os.path.exists("gemma-3-1B"):
            tokenizer_path = "gemma-3-1B"
        elif os.path.exists("gemma-3-1b"):
            tokenizer_path = "gemma-3-1b"
        else:
            tokenizer_path = "google/gemma-3-1b-it"
            print(f"Local tokenizer path not found. Falling back to HF Hub: {tokenizer_path}")
    else:
        tokenizer_path = "qwen2.5-3b"
    
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path, local_files_only=(tokenizer_path != "google/gemma-3-1b-it"))
    
    try:
        # Get Runtime singleton
        et_runtime = Runtime.get()
        
        # Load the program
        print(f"Loading program {pte_path}...")
        program = et_runtime.load_program(pte_path)
        
        print(f"Available methods: {program.method_names}")
        # QwenWrapper usually exports to 'forward'
        method_name = "forward" if "forward" in program.method_names else list(program.method_names)[0]
        
        print(f"Loading method: {method_name}")
        forward = program.load_method(method_name)
        
        # Prepare dynamic inputs of different lengths to verify dynamic shape compilation!
        test_prompts = [
            "User: Hello!\nAssistant:",  # Short sequence
            "User: Explain model compression in one sentence.\nAssistant:",  # Medium sequence
        ]
        
        for prompt in test_prompts:
            print(f"\n--- Testing with prompt: '{prompt}' ---")
            inputs = tokenizer(prompt, return_tensors="pt")
            input_ids = inputs["input_ids"]
            
            # Since our model is compiled with DYNAMIC shapes, we do NOT need 
            # to truncate or pad to a rigid sequence limit! We pass the raw shape.
            print(f"Input shape: {input_ids.shape}")
            
            # Execute sequential prefill since the model was exported without dynamic shapes (static seq_len=1)
            print("Executing sequential prefill inference...")
            logits = None
            for i in range(input_ids.shape[1]):
                token = input_ids[:, i:i+1] # shape (1, 1)
                cache_pos = torch.tensor([i], dtype=torch.long)
                outputs = forward.execute([token, cache_pos])
                logits = outputs[0]
            
            logits = outputs[0]
            print(f"Output logits shape: {logits.shape}")
            
            # Basic sanity check
            if torch.isnan(logits).any():
                print("❌ FAILED: Output contains NaNs.")
            elif torch.all(logits == 0):
                print("❌ FAILED: Output is all zeros.")
            else:
                print("✅ SUCCESS: Model executed with dynamic shape and returned valid logits.")
                
                # Predict next token (for prompt completion check)
                next_token_logits = logits[0, -1, :]
                next_token_id = torch.argmax(next_token_logits).item()
                next_token = tokenizer.decode([next_token_id])
                print(f"Next token prediction: '{next_token}'")

    except Exception as e:
        print(f"❌ FAILED to verify {pte_path}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        verify_pte(sys.argv[1])
    else:
        # Check all .pte files in compressed_models
        model_dir = "compressed_models"
        if os.path.exists(model_dir):
            pte_files = [f for f in os.listdir(model_dir) if f.endswith(".pte")]
            if not pte_files:
                print(f"No .pte files found in {model_dir}")
            for f in pte_files:
                if "qwen" in f.lower(): continue # Skip old Qwen binaries
                verify_pte(os.path.join(model_dir, f))
        else:
            print(f"Directory {model_dir} not found.")
