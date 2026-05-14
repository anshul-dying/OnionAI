import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def generate_plots():
    if not os.path.exists("compression_metrics.csv"):
        print("Error: compression_metrics.csv not found.")
        return

    df = pd.DataFrame(pd.read_csv("compression_metrics.csv"))
    os.makedirs("plots", exist_ok=True)
    sns.set_theme(style="whitegrid")

    # 1. Memory vs Perplexity (Trade-off)
    plt.figure(figsize=(12, 7))
    sns.scatterplot(data=df, x="Disk Size MB", y="Perplexity", hue="Model", s=250)
    for i in range(df.shape[0]):
        plt.text(df["Disk Size MB"][i]+50, df["Perplexity"][i], df["Model"][i], fontsize=9, fontweight='bold')
    plt.title("Model Size vs. Perplexity (Quality Trade-off)")
    plt.xlabel("Disk Size (MB)")
    plt.ylabel("Perplexity (Lower is better)")
    plt.tight_layout()
    plt.savefig("plots/size_vs_perplexity.png")
    print("Generated: plots/size_vs_perplexity.png")

    # 2. Throughput (Tokens/sec) comparison
    plt.figure(figsize=(12, 7))
    sns.barplot(data=df, x="Model", y="Tokens/sec", hue="Model", palette="viridis", legend=False)
    plt.title("Inference Throughput (Tokens/sec)")
    plt.ylabel("Tokens per Second")
    plt.xticks(rotation=45, ha='right')
    plt.subplots_adjust(bottom=0.25) # Force space for rotated labels
    plt.savefig("plots/throughput_comparison.png")
    print("Generated: plots/throughput_comparison.png")

    # 3. RAM and VRAM Footprint
    df_melted = df.melt(id_vars="Model", value_vars=["RAM MB", "VRAM MB"], var_name="Memory Type", value_name="Usage MB")
    plt.figure(figsize=(12, 7))
    sns.barplot(data=df_melted, x="Model", y="Usage MB", hue="Memory Type")
    plt.title("Memory Footprint (Peak RAM vs VRAM)")
    plt.ylabel("Usage (MB)")
    plt.xticks(rotation=45, ha='right')
    plt.subplots_adjust(bottom=0.25) # Force space for rotated labels
    plt.savefig("plots/memory_footprint.png")
    print("Generated: plots/memory_footprint.png")

    # 4. Energy Efficiency (Tokens/Watt)
    plt.figure(figsize=(12, 7))
    sns.barplot(data=df, x="Model", y="Tokens/Watt", hue="Model", palette="magma", legend=False)
    plt.title("Energy Efficiency (Estimated Tokens per Watt)")
    plt.ylabel("Tokens / Watt")
    plt.xticks(rotation=45, ha='right')
    plt.subplots_adjust(bottom=0.25)
    plt.savefig("plots/energy_efficiency.png")
    print("Generated: plots/energy_efficiency.png")

    # 5. Qualitative Metrics (Statistical vs Model-Based)
    if "BLEU" in df.columns:
        df_qual = df.melt(id_vars="Model", value_vars=["BLEU", "ROUGE-L", "BERTScore"], var_name="Metric", value_name="Score")
        plt.figure(figsize=(14, 8))
        sns.barplot(data=df_qual, x="Model", y="Score", hue="Metric", palette="muted")
        plt.title("Qualitative Quality Comparison (Higher is Better)")
        plt.ylabel("Score (%)")
        plt.ylim(0, 110)
        plt.xticks(rotation=45, ha='right')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig("plots/qualitative_comparison.png")
        print("Generated: plots/qualitative_comparison.png")

if __name__ == "__main__":
    generate_plots()
