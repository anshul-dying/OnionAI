import os
import sys
from huggingface_hub import HfApi
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def download():
    model_id = "google/gemma-3-1b-it"
    local_dir = "gemma-3-1b"
    
    print(f"\n>>> Preparing to download {model_id} from Hugging Face Hub...")
    
    # Check if logged in
    api = HfApi()
    try:
        user_info = api.whoami()
        print(f"Authenticated as Hugging Face user: {user_info['username']}")
    except Exception as auth_err:
        print(f"ERROR: Hugging Face authentication failed or not logged in: {auth_err}")
        print("Please run 'hf auth login' in your virtual environment and provide your HF Access Token.")
        print("You must also accept the Gemma 3 license terms at: https://huggingface.co/google/gemma-3-1b-it")
        sys.exit(1)
        
    print(f"Downloading model to local directory: {local_dir}/...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir=None)
        tokenizer.save_pretrained(local_dir)
        print("Tokenizer successfully downloaded and saved.")
        
        print("Downloading model weights in FP32 format (for clean quantization)...")
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )
        model.save_pretrained(local_dir)
        print(f"SUCCESS: Model downloaded and saved in '{local_dir}/'")
        print("Ready for compression and ExecuTorch export.")
    except Exception as e:
        print(f"ERROR downloading model: {e}")
        print("Ensure you have accepted the Gemma 3 license agreement on Hugging Face (https://huggingface.co/google/gemma-3-1b-it).")
        sys.exit(1)

if __name__ == "__main__":
    download()
