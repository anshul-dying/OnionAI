import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys

def plot_df(df, output_dir, prefix="", qual_df=None):
    # Apply publication-level academic theme settings
    plt.rcParams.update({
        'font.family': 'serif',
        'font.serif': ['DejaVu Serif', 'Times New Roman', 'Georgia'],
        'font.size': 11,
        'axes.labelsize': 12,
        'axes.titlesize': 13,
        'xtick.labelsize': 10,
        'ytick.labelsize': 10,
        'figure.titlesize': 14,
        'grid.alpha': 0.5,
        'grid.linestyle': '--'
    })
    
    sns.set_theme(style="whitegrid", rc={"font.family": "serif"})
    
    # ----------------- PLOT 1: Size vs Perplexity -----------------
    plt.figure(figsize=(10, 6.5))
    scatter = sns.scatterplot(
        data=df, 
        x="Disk Size MB", 
        y="Perplexity", 
        hue="Model", 
        style="Model", 
        s=300, 
        edgecolor="black", 
        linewidth=1.2
    )
    
    # Annotate points
    for i in range(df.shape[0]):
        plt.text(
            df["Disk Size MB"][i] + (50 if df["Disk Size MB"][i] < 4000 else -400), 
            df["Perplexity"][i] - 0.15, 
            df["Model"][i], 
            fontsize=9.5, 
            fontweight='semibold'
        )
    
    plt.title(f"{prefix.upper()} Model Compression: Size vs. Perplexity", pad=15)
    plt.xlabel("Physical Model Disk Footprint (MB)", labelpad=10)
    plt.ylabel("Language Perplexity (WikiText-2, Lower is better)", labelpad=10)
    
    # Adjust limits dynamically based on sizes
    max_size = df["Disk Size MB"].max()
    max_ppl = df["Perplexity"].max()
    plt.xlim(0, max_size * 1.15)
    plt.ylim(df["Perplexity"].min() * 0.9, max_ppl * 1.1)
    
    plt.grid(True)
    plt.tight_layout()
    plot_path = os.path.join(output_dir, f"{prefix}size_vs_perplexity.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Generated: {plot_path}")

    # ----------------- PLOT 2: Throughput (Tokens/sec) -----------------
    plt.figure(figsize=(9, 6))
    bar = sns.barplot(
        data=df, 
        x="Model", 
        y="Tokens/sec", 
        hue="Model", 
        palette="viridis", 
        edgecolor="black",
        linewidth=0.8,
        legend=False
    )
    
    for p in bar.patches:
        height = p.get_height()
        bar.annotate(
            f"{height:.2f} t/s",
            (p.get_x() + p.get_width() / 2., height + (height * 0.02 + 0.1)),
            ha='center', 
            va='center', 
            xytext=(0, 5), 
            textcoords='offset points', 
            fontsize=9.5,
            fontweight='bold'
        )

    plt.title(f"{prefix.upper()} Edge Throughput Comparison (Tokens per Second)", pad=15)
    plt.xlabel("Compression Model Variant", labelpad=10)
    plt.ylabel("Inference Generation Speed (Tokens/sec)", labelpad=10)
    plt.ylim(0, df["Tokens/sec"].max() * 1.15)
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plot_path = os.path.join(output_dir, f"{prefix}throughput_comparison.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Generated: {plot_path}")

    # ----------------- PLOT 3: Memory Footprint -----------------
    df_melted = df.melt(
        id_vars="Model", 
        value_vars=["RAM MB", "VRAM MB"], 
        var_name="Memory Type", 
        value_name="Usage MB"
    )
    plt.figure(figsize=(10, 6.5))
    bar_mem = sns.barplot(
        data=df_melted, 
        x="Model", 
        y="Usage MB", 
        hue="Memory Type", 
        palette="deep",
        edgecolor="black",
        linewidth=0.8
    )
    
    for p in bar_mem.patches:
        height = p.get_height()
        if height > 0:
            bar_mem.annotate(
                f"{int(height)} MB",
                (p.get_x() + p.get_width() / 2., height + (height * 0.01 + 10)),
                ha='center', 
                va='center', 
                xytext=(0, 5), 
                textcoords='offset points', 
                fontsize=8,
                rotation=90
            )

    plt.title(f"{prefix.upper()} Hardware Resource Profile: Peak RAM vs. VRAM", pad=15)
    plt.xlabel("Compression Model Variant", labelpad=10)
    plt.ylabel("Memory Allocation (MB)", labelpad=10)
    plt.ylim(0, df_melted["Usage MB"].max() * 1.2)
    plt.xticks(rotation=15, ha='right')
    plt.legend(frameon=True, shadow=True, facecolor="white")
    plt.tight_layout()
    plot_path = os.path.join(output_dir, f"{prefix}memory_footprint.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Generated: {plot_path}")

    # ----------------- PLOT 4: Energy Efficiency -----------------
    plt.figure(figsize=(9, 6))
    bar_energy = sns.barplot(
        data=df, 
        x="Model", 
        y="Tokens/Watt", 
        hue="Model", 
        palette="magma", 
        edgecolor="black",
        linewidth=0.8,
        legend=False
    )
    
    for p in bar_energy.patches:
        height = p.get_height()
        bar_energy.annotate(
            f"{height:.2f} T/W",
            (p.get_x() + p.get_width() / 2., height + (height * 0.02 + 0.02)),
            ha='center', 
            va='center', 
            xytext=(0, 5), 
            textcoords='offset points', 
            fontsize=9.5,
            fontweight='bold'
        )

    plt.title(f"{prefix.upper()} Sustainable Edge AI: Energy Efficiency Metrics", pad=15)
    plt.xlabel("Compression Model Variant", labelpad=10)
    plt.ylabel("Inference Generation Per Watt (Tokens / Watt)", labelpad=10)
    plt.ylim(0, df["Tokens/Watt"].max() * 1.15)
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plot_path = os.path.join(output_dir, f"{prefix}energy_efficiency.png")
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Generated: {plot_path}")

    # ----------------- PLOT 5: Qualitative Semantic Retention -----------------
    if qual_df is not None:
        df_qual = qual_df.melt(
            id_vars="Model", 
            value_vars=["BLEU", "ROUGE-L", "BERTScore"], 
            var_name="Evaluation Metric", 
            value_name="Score (%)"
        )
        
        plt.figure(figsize=(11, 7))
        bar_q = sns.barplot(
            data=df_qual, 
            x="Model", 
            y="Score (%)", 
            hue="Evaluation Metric", 
            palette="muted",
            edgecolor="black",
            linewidth=0.8
        )
        
        for p in bar_q.patches:
            height = p.get_height()
            if height > 0:
                bar_q.annotate(
                    f"{height:.1f}%",
                    (p.get_x() + p.get_width() / 2., height + 1.2),
                    ha='center', 
                    va='center', 
                    xytext=(0, 5), 
                    textcoords='offset points', 
                    fontsize=7.5,
                    rotation=90
                )
                
        plt.title(f"{prefix.upper()} Qualitative Semantic Retention scores", pad=15)
        plt.xlabel("Compression Model Variant", labelpad=10)
        plt.ylabel("Relative Semantic Score (%)", labelpad=10)
        plt.ylim(0, 115)
        plt.xticks(rotation=15, ha='right')
        plt.legend(frameon=True, shadow=True, facecolor="white", loc='upper right')
        plt.tight_layout()
        plot_path = os.path.join(output_dir, f"{prefix}qualitative_comparison.png")
        plt.savefig(plot_path, dpi=300)
        plt.close()
        print(f"Generated: {plot_path}")

def generate_cross_model_plot(qwen_df, gemma_df, output_dir):
    print("Generating Academic Cross-Model Comparison (Qwen vs Gemma)...")
    
    # Filter for the important compared models
    # Qwen: Baseline, INT4
    # Gemma: Baseline, INT4
    qwen_sub = qwen_df[qwen_df["Model"].isin(["Baseline (FP16)", "INT4 NF4"])].copy()
    qwen_sub["Architecture"] = "Qwen2.5-3B"
    qwen_sub["Model Type"] = qwen_sub["Model"].apply(lambda x: "Baseline (FP16)" if "Baseline" in x else "INT4 (Edge)")
    
    gemma_sub = gemma_df[gemma_df["Model"].isin(["Gemma 3 1B (FP32)", "Gemma 3 1B (INT4)"])].copy()
    gemma_sub["Architecture"] = "Gemma 3 1B"
    gemma_sub["Model Type"] = gemma_sub["Model"].apply(lambda x: "Baseline (FP16)" if "FP32" in x else "INT4 (Edge)")
    
    combined = pd.concat([qwen_sub, gemma_sub])
    
    # Size comparison grouped bar plot
    plt.figure(figsize=(10, 6))
    bar_size = sns.barplot(
        data=combined,
        x="Model Type",
        y="Disk Size MB",
        hue="Architecture",
        palette="Set2",
        edgecolor="black",
        linewidth=0.8
    )
    for p in bar_size.patches:
        height = p.get_height()
        if height > 0:
            bar_size.annotate(
                f"{int(height)} MB",
                (p.get_x() + p.get_width() / 2., height + 100),
                ha='center', va='center', xytext=(0, 5), textcoords='offset points',
                fontsize=9, fontweight='semibold'
            )
    plt.title("Physical Size Comparison: Qwen2.5-3B vs. Gemma 3 1B", pad=15)
    plt.xlabel("Deployment Stage", labelpad=10)
    plt.ylabel("Disk Footprint (MB)", labelpad=10)
    plt.ylim(0, 6800)
    plt.tight_layout()
    size_path = os.path.join(output_dir, "cross_model_size_comparison.png")
    plt.savefig(size_path, dpi=300)
    plt.close()
    print(f"Generated: {size_path}")
    
    # Throughput comparison grouped bar plot
    plt.figure(figsize=(10, 6))
    bar_tps = sns.barplot(
        data=combined,
        x="Model Type",
        y="Tokens/sec",
        hue="Architecture",
        palette="Set1",
        edgecolor="black",
        linewidth=0.8
    )
    for p in bar_tps.patches:
        height = p.get_height()
        if height > 0:
            bar_tps.annotate(
                f"{height:.2f} t/s",
                (p.get_x() + p.get_width() / 2., height + 0.8),
                ha='center', va='center', xytext=(0, 5), textcoords='offset points',
                fontsize=9, fontweight='semibold'
            )
    plt.title("Edge Throughput Efficiency: Qwen2.5-3B vs. Gemma 3 1B", pad=15)
    plt.xlabel("Deployment Stage", labelpad=10)
    plt.ylabel("Generation Throughput (Tokens/sec)", labelpad=10)
    plt.ylim(0, 48)
    plt.tight_layout()
    tps_path = os.path.join(output_dir, "cross_model_throughput_comparison.png")
    plt.savefig(tps_path, dpi=300)
    plt.close()
    print(f"Generated: {tps_path}")

def main():
    output_dir = "results/plots"
    os.makedirs(output_dir, exist_ok=True)
    
    # Load Qwen data (if exists)
    qwen_csv = "results/csv/compression_metrics.csv"
    if not os.path.exists(qwen_csv):
        qwen_csv = "compression_metrics.csv"
        
    qwen_df = None
    if os.path.exists(qwen_csv):
        print(f"Loading Qwen data from {qwen_csv}...")
        qwen_df = pd.read_csv(qwen_csv)
        qwen_qual_csv = "results/csv/qualitative_metrics.csv"
        qwen_qual_df = pd.read_csv(qwen_qual_csv) if os.path.exists(qwen_qual_csv) else None
        
        # Plot Qwen
        print("Generating Qwen plots...")
        plot_df(qwen_df, output_dir, prefix="", qual_df=qwen_qual_df)
    else:
        print("Qwen CSV files not found.")
        
    # Load Gemma data (if exists)
    gemma_csv = "results/csv/gemma_compression_metrics.csv"
    gemma_df = None
    if os.path.exists(gemma_csv):
        print(f"Loading Gemma data from {gemma_csv}...")
        gemma_df = pd.read_csv(gemma_csv)
        gemma_qual_csv = "results/csv/gemma_qualitative_metrics.csv"
        gemma_qual_df = pd.read_csv(gemma_qual_csv) if os.path.exists(gemma_qual_csv) else None
        
        # Plot Gemma
        print("Generating Gemma plots...")
        plot_df(gemma_df, output_dir, prefix="gemma_", qual_df=gemma_qual_df)
    else:
        print("Gemma CSV files not found. Run eval_gemma.py first to generate them.")
        
    # Generate Cross-Model Comparison if both exist
    if qwen_df is not None and gemma_df is not None:
        generate_cross_model_plot(qwen_df, gemma_df, output_dir)
        
    print("\nSUCCESS: All requested publication-grade plots generated inside results/plots/!")

if __name__ == "__main__":
    main()
