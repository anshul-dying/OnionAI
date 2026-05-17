# onionAI Quantization Project Status

## Project Goal
Deploy compressed `Qwen2.5-3B-Instruct` on edge devices using ExecuTorch.

## ✅ Completed
- **Baseline Setup**: Downloaded `Qwen2.5-3B-Instruct` model and tokenizer.
- **Quantization Scripts**:
    - `compress_model.py`: Script for basic quantization/compression logic.
    - `export_int4_final.py`: Script for INT4 quantization export.
    - `export_int4_hybrid.py`: Script for hybrid (pruning + quantization) export.
- **Baseline Evaluation**: 
    - `eval_baseline.py`: script for benchmarking the baseline model.
- **Metrics & Results**:
    - Initial CSV files generated in `results/csv/`:
        - `compression_metrics.csv`
        - `energy_metrics.csv`
        - `latency_benchmark.csv`
        - `memory_profile.csv`
        - `perplexity_results.csv`
        - `qualitative_metrics.csv`
- **Visualization**:
    - `generate_plots.py`: Script to visualize results.
    - Initial plots generated in `results/plots/`.
- **Export & Verification**:
    - `export_executorch.py`: Base script for PTE export.
    - `verify_pte.py`: Script to verify exported `.pte` files.

## ⏳ In Progress / What's Next
- **ExecuTorch Deployment**:
    - Finalizing `.pte` exports for all variants (INT8, INT4, Hybrid).
    - Testing exported models in the `onionAI` mobile application.
- **Research Paper**:
    - Drafting content based on `research_paper/main.tex`.
    - Integrating final benchmark results into the paper.
- **Refinement**:
    - Optimizing `tokens/sec` and `memory footprint` for edge deployment.
    - Ensuring high-quality instruction following after aggressive quantization.

## 📋 Task List
- [ ] Export final INT8 and INT4 `.pte` models.
- [ ] Run exhaustive benchmarking for all variants.
- [ ] Update `TODO.md` with final performance numbers.
- [ ] Complete the LaTeX research paper with generated plots.
