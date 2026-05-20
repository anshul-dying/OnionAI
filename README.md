# onionAI 🧅

**Private, Local-First AI Chat for Mobile**

onionAI is a privacy-centric AI chat application built with React Native and Expo. It leverages **ExecuTorch** to run Large Language Models (LLMs) locally on mobile hardware, ensuring that data never leaves the device and that the AI remains functional without an internet connection.

---

## Key Features

- **Privacy by Design:** "Local-First, Local-Only" model. Zero telemetry, zero external API calls.
- **On-Device Inference:** High-performance neural network execution using [ExecuTorch](https://pytorch.org/executorch/).
- **Offline Capable:** Works perfectly in airplane mode or areas with no connectivity.
- **Real-Time Streaming:** Responsive UI with token-by-token streaming from local models.
- **Privacy Guard:** Built-in UI components to assure users of their data security.
- **Model Flexibility:** Comprehensive support for **Gemma 3 1B** (INT4, INT8, FP32), **Llama 3.2 1B**, and other ExecuTorch-compatible models.
- **Model Optimization Suite:** Robust toolchain for quantization, dynamic shape tracing, and performance evaluation.
- **Dual Mode:** Includes a `MockLLMService` for rapid UI development and testing in non-native environments (like Expo Go or Web).

---

## Tech Stack

- **Framework:** [Expo](https://expo.dev/) (SDK 54) with [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation).
- **AI Engine:** `react-native-executorch` for hardware-accelerated inference.
- **Language:** TypeScript.
- **Styling:** Custom themed components for seamless Light/Dark mode support.
- **State Management:** React Context (Model and History providers).

---

## Architecture Overview

onionAI follows a modular architecture designed for security and performance:

1.  **Presentation Layer:** Themed UI components (`app/`, `components/`) built for responsiveness.
2.  **Application Logic:** Orchestrated via `useOnionAI` hook, managing state between the UI and inference engines.
3.  **Inference Layer:** An abstraction layer that switches between the native ExecuTorch module and a Mock service.
4.  **Data Layer:** Manages local storage for model binaries (`.pte`), tokenizer configs (`tokenizer.json`), and chat history.

For more details, see [Architecture Documentation](./docs/architecture.md).

---

## Getting Started

### Prerequisites

- **Node.js:** v20 or higher.
- **Development Environment:** 
    - **Android:** Android Studio and SDK (API 34+).
    - **iOS:** macOS with Xcode (ExecuTorch requires native compilation).
- **Model Assets:** You need compatible LLM weights in `.pte` format and a `tokenizer.json`.
    - Recommended: Gemma-3-1B-IT or Llama-3.2-1B-Instruct.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/onionAI.git
    cd onionAI
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Model Setup

ExecuTorch requires model files to be accessible on the device storage.

#### Android Setup
1.  Create a directory on your device/emulator: `/storage/emulated/0/onionAI/`
2.  Push your model files (using Llama 3.2 or Gemma 3):
    ```bash
    adb shell mkdir -p /storage/emulated/0/onionAI/
    
    # For Llama 3.2 1B:
    adb push Llama-3.2-1B-Instruct.pte /storage/emulated/0/onionAI/
    adb push tokenizer.json /storage/emulated/0/onionAI/
    
    # For Gemma 3 1B:
    adb push gemma-3-1b-int4.pte /storage/emulated/0/onionAI/model.pte
    adb push tokenizer.json /storage/emulated/0/onionAI/tokenizer.json
    ```

---

## Model Quantization & Optimization Pipeline

The `quantization/` directory contains an end-to-end pipeline to compress, evaluate, export, and verify Edge AI models for resource-constrained edge hardware.

### Key Scripts

- **`quantization/scripts/download_gemma.py`:** Downloads the Gemma 3 1B base and instruction-tuned weights from HuggingFace.
- **`quantization/scripts/export_gemma.py`:** Exports Gemma 3 1B to ExecuTorch format with quantization recipes (INT4 weight-only `8da4w`, INT8 weight-only `8da8w`, and FP32 baseline).
- **`quantization/scripts/verify_pte.py`:** Validates exported `.pte` files for dynamic shape support, memory bounds, and execution correctness.
- **`quantization/scripts/generate_plots.py`:** Generates performance comparison charts for model size, throughput, energy efficiency, and memory footprint.
- **`quantization/scripts/eval_gemma.py`:** Computes perplexity and accuracy scores on benchmark datasets.

### Edge Performance Benchmarks & Plots
Performance metrics and visualizations are stored in `quantization/results/`. The pipeline compares model architectures across key metrics:
- **Cross-Model Size Comparison** (`cross_model_size_comparison.png`)
- **Throughput & Latency** (`cross_model_throughput_comparison.png`)
- **Energy Efficiency** (`energy_efficiency.png` / `gemma_energy_efficiency.png`)
- **Memory Footprint** (`gemma_memory_footprint.png`)

For in-depth analysis of Edge AI runtime crashes (such as CPU bfloat16 incompatibilities, SDPA symbolic dispatch guards, and Jetsam/LMK memory management), refer to the [Deep Diagnostics Report](quantization/docs/model_compression_diagnostics.md) and the [Project Audit Report](docs/project_audit.md).

---

## Usage & Commands

### Development

- **Start Expo Server:**
  ```bash
  npm run start
  ```
  *Note: Running in Expo Go will trigger **Mock Mode** because native ExecuTorch modules are not available in the sandbox.*

- **Run on Android (Native):**
  ```bash
  npm run android
  ```

- **Run on iOS (Native):**
  ```bash
  npm run ios
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

### Building

- **Build APK (Android Preview):**
  ```bash
  npx eas build -p android --profile preview
  ```
  *Generates an installable APK for testing on physical devices.*

- **Build AAB (Android Production):**
  ```bash
  npx eas build -p android --profile production
  ```
  *Generates a production-ready Android App Bundle.*

- **EAS Login:**
  ```bash
  npx eas-cli login
  ```

### Mock Mode
If you don't have a physical device or native setup ready, the app automatically falls back to a simulated LLM. This allows you to test the UI, history management, and theming without needing a GPU-capable mobile device.

---

## Project Structure

```text
onionAI/
├── app/                # Expo Router screens (Tabs, Modals, Layouts)
├── assets/             # Images, fonts, and static assets
├── components/         # UI Components
│   ├── Assurance/      # Privacy-focused UI components
│   ├── Chat/           # Messaging bubbles, input areas, system monitors
│   └── ui/             # Themed base components
├── constants/          # Theme and global constants
├── docs/               # Technical documentation (SRS, Architecture, Audits)
├── hooks/              # Custom React hooks (AI logic, Context Providers)
│   ├── useOnionAI.ts   # Main AI interaction hook
│   ├── ModelContext.tsx# Model asset management & scanning
│   └── ChatHistoryContext.tsx # Local persistence of chats
├── quantization/       # Model compression & benchmarking tools
│   ├── scripts/        # Python scripts for PT2E/ExecuTorch export
│   ├── results/        # Metrics and plots from benchmarks
│   └── research_paper/ # LaTeX source for project publication
├── scripts/            # Utility scripts (Mock LLM, project reset)
└── .gemini/            # AI Agent configuration and custom skills
```

---

## Privacy & Security

onionAI is built on the principle that **your data is your own**.

- **No Cloud:** We do not use OpenAI, Anthropic, or any other cloud provider.
- **No Analytics:** We do not track your prompts or usage patterns.
- **Local Persistence:** Chat history is stored only on your device using the Expo FileSystem API.
- **Transparency:** The `PrivacyGuard` component provides real-time status of the local connection.

---

## Contributing

Contributions are welcome! Please read our `CONTRIBUTING.md` (if available) before submitting a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**OnionAI: Keeping your thoughts private, one layer at a time.**
