import os
from huggingface_hub import snapshot_download

def download_qwen():
    repo_id = "Qwen/Qwen2.5-3B-Instruct"
    local_dir = "qwen2.5-3b"

    print(f"Downloading {repo_id}...")

    os.makedirs(local_dir, exist_ok=True)

    snapshot_download(
        repo_id=repo_id,
        local_dir=local_dir,
        revision="main",
        max_workers=4
    )

    print("Download complete!")

if __name__ == "__main__":
    download_qwen()