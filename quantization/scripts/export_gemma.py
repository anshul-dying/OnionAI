import os
import sys
import subprocess
import shutil

def run_command(cmd):
    print(f"\nRunning: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"FAILED with exit code {result.returncode}")
        return False
    return True

def main():
    os.makedirs("compressed_models", exist_ok=True)
    
    if os.path.exists("gemma-3-1B"):
        model_source = "gemma-3-1B"
    elif os.path.exists("gemma-3-1b"):
        model_source = "gemma-3-1b"
    else:
        model_source = "google/gemma-3-1b-it"
        print("WARNING: Local directory not found. Exporting directly from HF hub.")
        print("Make sure you are logged in using 'hf auth login'.")
        
    print(f"Using model source '{model_source}' for export.")

    variants = {
        "gemma-3-1b-int4": ["--qlinear", "8da4w"],
        "gemma-3-1b-int8": ["--qlinear", "8da8w"],
        "gemma-3-1b-fp32": []  # Baseline FP32
    }
    
    for name, quant_args in variants.items():
        output_dir = f"compressed_models/{name}"
        print(f"\n=======================================================")
        print(f"Exporting variant: {name} to {output_dir}")
        print(f"=======================================================")
        
        # Clean existing directory to avoid conflicts
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
            
        cmd = [
            "optimum-cli", "export", "executorch",
            "--model", model_source,
            "--task", "text-generation",
            "--recipe", "xnnpack",
            "--output_dir", output_dir
        ] + quant_args
        
        success = run_command(cmd)
        if not success:
            print(f"Failed to export {name}!")
            
    # Copy INT4 model.pte to compressed_models/model.pte for the React Native app
    int4_pte_path = "compressed_models/gemma-3-1b-int4/model.pte"
    target_pte_path = "compressed_models/model.pte"
    if os.path.exists(int4_pte_path):
        shutil.copy(int4_pte_path, target_pte_path)
        print(f"\nSUCCESS: Copied {int4_pte_path} to {target_pte_path} (Ready for mobile!)")
    else:
        print(f"\nERROR: Could not find compiled INT4 model at {int4_pte_path}")

if __name__ == "__main__":
    main()
