# Optimization and Deployment of Privacy-Preserving SLMs on Resource-Constrained Edge Hardware

## FF 180 Updated Project Plan

---

# 1. Project Objective

Develop and evaluate compressed Small Language Models (SLMs) for fully local inference on resource-constrained edge devices (4GB–8GB RAM) using:

- Quantization
- Structured / magnitude pruning
- ExecuTorch deployment
- Edge-side benchmarking

### Primary Target Model
- `Qwen/Qwen2.5-3B-Instruct`

---

# 2. Research Goals

## Core Goals

1. Achieve substantial memory reduction (>70%).
2. Enable fully offline inference using ExecuTorch `.pte` models.
3. Measure tradeoffs between:
   - memory
   - latency
   - perplexity
   - energy efficiency
4. Benchmark compressed variants on edge-compatible runtime.
5. Generate research-paper-ready benchmark datasets and graphs.

---

# 3. Research Motivation

Current LLM systems rely heavily on centralized cloud infrastructure, introducing:

- Privacy risks
- High latency
- Increased energy consumption
- Dependency on internet connectivity

This project investigates whether 3B parameter instruction-tuned SLMs can be practically deployed on low-memory edge hardware using compression and optimized local inference.

---

# 4. Experimental Methodology

## Important Technical Clarification

Unstructured pruning alone does NOT significantly reduce:
- model file size
- RAM usage
- latency

unless sparse-aware runtimes are used.

Therefore:
- Quantization is treated as the primary deployment optimization.
- Pruning is evaluated mainly for sparsity and hybrid compression analysis.

---

# 5. Experimental Pipeline

# Phase 1 — Baseline Setup

## Model
- `Qwen/Qwen2.5-3B-Instruct`

## Baseline Precision
- FP16

## Tasks

1. Download model + tokenizer
2. Run baseline inference
3. Export baseline `.pte`
4. Record metrics

## Baseline Metrics

| Metric | Measurement |
|---|---|
| Model Size | Disk size (GB/MB) |
| RAM Usage | Peak RAM during inference |
| VRAM Usage | Peak GPU memory |
| Throughput | Tokens/sec |
| Latency | Prompt-to-generation time |
| Perplexity | WikiText-2 |
| Power Estimate | Tokens-per-Watt |

---

# Phase 2 — Compression Variants

## Variant A — INT8 Quantization

### Method
- bitsandbytes INT8

### Purpose
- Moderate compression
- Quality-preserving baseline

---

## Variant B — INT4 Quantization

### Method
- NF4 weight-only quantization

### Purpose
- Aggressive edge deployment optimization

### Expected Outcome
- ~70% memory reduction
- Minimal perplexity degradation

---

## Variant C — Magnitude-Based Pruning

### Method
- 20–30% sparsity

### Purpose
Evaluate:
- sparsity effects
- quality degradation
- interaction with quantization

### Important Note
This experiment does NOT guarantee real storage compression gains.

---

## Variant D — Hybrid Compression

### Method
- pruning + INT4 quantization

### Purpose
Evaluate:
- whether sparsity improves compressed deployment efficiency
- quality tradeoffs under combined optimization

---

# Phase 3 — ExecuTorch Deployment

## Deployment Pipeline

1. Convert compressed variants to ExecuTorch `.pte`
2. Load models into custom local inference app
3. Benchmark on edge-compatible runtime

## Deployment Objectives

- Fully offline inference
- Privacy-preserving execution
- Reduced memory footprint
- Edge-compatible latency

---

# Phase 4 — Evaluation & Benchmarking

## Evaluation Dataset

### Perplexity Evaluation
- WikiText-2
- PTB subset

### Inference Benchmarks
Standard prompts:
- summarization
- Q&A
- instruction following

---

# 6. Final Evaluation Metrics

| Category | Metrics |
|---|---|
| Compression | Disk Size Reduction (%) |
| Runtime | RAM / VRAM Usage |
| Performance | Tokens/sec |
| Responsiveness | End-to-End Latency |
| Quality | Perplexity |
| Energy | Tokens-per-Watt |
| Deployment | `.pte` compatibility |

---

# 7. Runtime & Toolchain

| Component | Tool |
|---|---|
| Base Runtime | Transformers |
| Quantization | bitsandbytes |
| Pruning | torch.nn.utils.prune |
| Export | ExecuTorch |
| Evaluation | PyTorch + datasets |
| Edge App | Custom local inference app |

---

# 8. Research Contribution

## Key Contribution

Demonstrating practical deployment of compressed 3B instruction-tuned language models on low-memory edge systems using:

- quantization
- lightweight pruning
- ExecuTorch execution
- fully local inference pipeline

---

# 9. Expected Results

| Variant | Expected Compression | Expected Quality Loss |
|---|---|---|
| FP16 | Baseline | None |
| INT8 | ~50% | Very Low |
| INT4 NF4 | ~70% | Low |
| Pruned | Minimal real size reduction | Moderate |
| Hybrid | ~70%+ | Moderate |

---

# 10. Research Paper Data Collection Plan

## Required CSV Outputs

### 1. compression_metrics.csv

| Model | Precision | Disk Size MB | RAM MB | VRAM MB | Tokens/sec | Latency ms | Perplexity | Tokens/Watt |
|---|---|---|---|---|---|---|---|---|

---

### 2. latency_benchmark.csv

| Model | Prompt Length | Generated Tokens | Total Time | Tokens/sec |
|---|---|---|---|---|

---

### 3. memory_profile.csv

| Model | Peak RAM | Peak VRAM | Avg RAM | Avg VRAM |
|---|---|---|---|---|

---

### 4. perplexity_results.csv

| Model | Dataset | Perplexity |
|---|---|---|

---

### 5. energy_metrics.csv

| Model | Avg Power Draw | Tokens/sec | Tokens/Watt |
|---|---|---|---|

---

# 11. Research Paper Graphs

## Mandatory Graphs

### 1. Memory vs Perplexity
Shows compression-quality tradeoff.

### 2. Compression Ratio vs Quality Loss
Demonstrates optimization efficiency.

### 3. Latency vs Model Size
Measures deployment responsiveness.

### 4. Tokens/sec vs Power Consumption
Evaluates edge energy efficiency.

### 5. RAM Usage vs Quantization Level
Demonstrates deployment feasibility on low-memory devices.

---

# 12. Benchmarking Recommendations

## Hardware Information Must Be Logged

For every experiment record:
- CPU
- GPU/NPU
- RAM
- OS
- Runtime backend
- ExecuTorch version

Without this, research reproducibility becomes weak.

---

# 13. Important Academic Statement

The paper should explicitly state:

> “Magnitude-based pruning primarily introduces sparsity and does not necessarily reduce physical model size without sparse-aware inference runtimes.”

This avoids methodological criticism during evaluation or review.

---

# 14. Updated Methodology Flow

```text
Baseline FP16
      ↓
INT8 / INT4 Quantization
      ↓
Pruning Experiments
      ↓
Hybrid Compression
      ↓
ExecuTorch Export (.pte)
      ↓
Edge Deployment
      ↓
Benchmarking & Evaluation
      ↓
Privacy + Energy Analysis
```

# Final Deliverables
Models
- FP16 baseline
- INT8 .pte
- INT4 .pte
- Hybrid .pte

Benchmark Files
- compression_metrics.csv
- latency logs
- memory usage logs
- perplexity evaluation logs
- energy efficiency logs

Research Paper Assets
- Publication-ready graphs
- Benchmark tables
- Compression comparison analysis
- Deployment screenshots
- Edge inference latency analysis

