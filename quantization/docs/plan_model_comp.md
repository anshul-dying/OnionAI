# Model Compression & Evaluation Plan (Qwen2.5-3B-Instruct)

## Objective
Download `Qwen/Qwen2.5-3B-Instruct`, apply multiple compression techniques (INT4, Pruning), evaluate performance metrics, and document data for research paper plots as per FF 180 requirements.

## Scope & Impact
- Target Model: `Qwen/Qwen2.5-3B-Instruct`
- Target Environment: Edge hardware (4GB-8GB RAM).
- Goal: >70% memory reduction, track metrics for graphs.

## Phase 1: Setup & Baseline
1.  **Download:** Fetch `Qwen/Qwen2.5-3B-Instruct` model and tokenizer.
2.  **Baseline Eval:** Measure FP16 baseline metrics:
    -   Memory footprint (MB).
    -   Latency (tokens/sec).
    -   Accuracy (e.g., subset validation score).

## Phase 2: Compression Pipeline
Run the following compression techniques independently and combined:
1.  **INT4 Quantization:** Weight-only INT4 quantization.
2.  **Weight Pruning:** Magnitude-based pruning (20%-30% sparsity).
3.  **Hybrid:** INT4 Quantization + Pruning.
4.  **Export:** Convert all variants to ExecuTorch `.pte` format.

## Phase 3: Evaluation (FF 180 Metrics)
Measure the following for Baseline, Pruned, Quantized, and Hybrid models:
1.  **Memory:** Size on disk and active NPU/RAM usage.
2.  **Latency/Throughput:** Generation speed in tokens/sec.
3.  **Accuracy/Perplexity:** Quality degradation compared to baseline.
4.  **Energy Efficiency:** Tokens-per-Watt estimation.

## Phase 4: Documentation & Output
1.  Generate `compression_metrics.csv` containing all evaluation data.
2.  Provide tabular data ready for paper plots (Memory vs Accuracy, Latency vs Power).