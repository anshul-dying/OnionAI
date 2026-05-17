import torch
from executorch.runtime import Runtime
from transformers import AutoTokenizer
import os
import sys

def verify_pte(pte_path):
    if not os.path.exists(pte_path):
        print(f"Error: {pte_path} not found.")
        return

    print(f"\n>>> Verifying {pte_path} ...")
    
    # Load tokenizer from source model directory
    tokenizer_path = "qwen2.5-3b"
    if not os.path.exists(tokenizer_path):
        print(f"Error: Tokenizer path {tokenizer_path} not found.")
        return
        
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
    
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
        
        # Prepare input
        prompt = "User: Explain model compression in one sentence.\nAssistant:"
        inputs = tokenizer(prompt, return_tensors="pt")
        input_ids = inputs["input_ids"]
        
        # QwenWrapper was traced with (1, 32). We must match the trace shape exactly.
        max_len = 32
        if input_ids.shape[1] < max_len:
            # Pad with zeros (or tokenizer.pad_token_id if available)
            padding = torch.zeros((1, max_len - input_ids.shape[1]), dtype=torch.long)
            input_ids = torch.cat([input_ids, padding], dim=1)
        else:
            input_ids = input_ids[:, :max_len]
            
        print(f"Input shape: {input_ids.shape}")
        
        # Run execution
        print("Executing inference...")
        outputs = forward.execute([input_ids])
        
        logits = outputs[0]
        print(f"Output logits shape: {logits.shape}")
        
        # Basic sanity check
        if torch.isnan(logits).any():
            print("❌ FAILED: Output contains NaNs.")
        elif torch.all(logits == 0):
            print("❌ FAILED: Output is all zeros.")
        else:
            print("✅ SUCCESS: Model returned valid logits.")
            
            # Predict next token (for prompt completion check)
            # Find the position of the last non-padded token
            prompt_len = inputs["input_ids"].shape[1]
            next_token_logits = logits[0, prompt_len - 1, :]
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
                verify_pte(os.path.join(model_dir, f))
        else:
            print(f"Directory {model_dir} not found.")
