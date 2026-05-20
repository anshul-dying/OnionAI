# Roadmap: Transform onionAI to LM Studio for Android

This document outlines the strategic plan to evolve onionAI from a basic local chat interface into a comprehensive local LLM workstation, similar to LM Studio, but optimized for mobile hardware.

## Phase 1: Local Storage & Asset Management
**Goal:** Enable users to scan, view, and manage offline model files stored locally on device storage.

- [ ] **Dynamic Directory Scanning:** Scan device folders (`/storage/emulated/0/onionAI/`, scoped storage) for `.pte` models and tokenizer configurations.
- [ ] **Storage Analyzer UI:** View physical file sizes, disk usage, and detailed model specifications.
- [ ] **Asset Deletion & Cleanups:** Safe UI controls to delete unused models and purge cache files to reclaim device storage.

## Phase 2: Advanced Inference Configuration
**Goal:** Give power users control over the inference engine parameters.

- [ ] **Dynamic Configuration:** Move away from hardcoded settings in `useOnionAI.ts`.
- [ ] **Parameter Control:**
    - **System Prompt:** Editable field to define AI persona/instructions.
    - **Context Window:** Adjustable token limit (up to hardware capability).
    - **Sampling Params:** Temperature, Top-P, and Top-K controls.
- [ ] **Model Loading Lifecycle:** Add "Load/Unload" buttons to explicitly manage device RAM usage.

## Phase 3: Developer Tools & Observability
**Goal:** Provide real-time feedback on model performance and resource usage.

- [ ] **Inference Stats:** Track and display `tokens/sec`, `time to first token`, and total token count.
- [ ] **Resource Monitor:** Real-time RAM and NPU/GPU utilization overlay during generation.
- [ ] **Log Viewer:** Access to native ExecuTorch logs for debugging model load failures.

## Phase 4: UI/UX Overhaul (The "Studio" Experience)
**Goal:** Refine the interface to feel like a professional workstation.

- [ ] **Multi-Session View:** Side-by-side or tabbed chat sessions for comparing model outputs.
- [ ] **Model Info Cards:** Rich metadata display including parameter count, quantization method (INT4/INT8), and base model architecture (Llama/Qwen/Mistral).
- [ ] **Prompt Gallery:** Save and load complex multi-turn prompt templates.

## Technical Requirements
- **Hardware:** Android device with 6GB+ RAM (8GB+ recommended for Llama 3).
- **Storage:** Scoped storage permissions for external model directories.
- **Inference:** `react-native-executorch` updated to support dynamic parameter injection.

---
*Created by Gemini CLI - 2026*
