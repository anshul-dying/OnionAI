# onionAI 🧅

**Private, Local-First AI Chat for Mobile**

onionAI is a privacy-centric AI chat application built with React Native and Expo. It leverages **ExecuTorch** to run Large Language Models (LLMs) locally on mobile hardware, ensuring that data never leaves the device and that the AI remains functional without an internet connection.

---

## 🌟 Key Features

- **Privacy by Design:** "Local-First, Local-Only" model. Zero telemetry, zero external API calls.
- **On-Device Inference:** High-performance neural network execution using [ExecuTorch](https://pytorch.org/executorch/).
- **Offline Capable:** Works perfectly in airplane mode or areas with no connectivity.
- **Real-Time Streaming:** Responsive UI with token-by-token streaming from local models.
- **Privacy Guard:** Built-in UI components to assure users of their data security.
- **Model Flexibility:** Supports Llama 3.2 1B and other ExecuTorch-compatible models.
- **Dual Mode:** Includes a `MockLLMService` for rapid UI development and testing in non-native environments (like Expo Go or Web).

---

## 🚀 Tech Stack

- **Framework:** [Expo](https://expo.dev/) (SDK 54) with [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation).
- **AI Engine:** `react-native-executorch` for hardware-accelerated inference.
- **Language:** TypeScript.
- **Styling:** Custom themed components for seamless Light/Dark mode support.
- **State Management:** React Context (Model and History providers).

---

## 🏗 Architecture Overview

OnionAI follows a modular architecture designed for security and performance:

1.  **Presentation Layer:** Themed UI components (`app/`, `components/`) built for responsiveness.
2.  **Application Logic:** Orchestrated via `useOnionAI` hook, managing state between the UI and inference engines.
3.  **Inference Layer:** An abstraction layer that switches between the native ExecuTorch module and a Mock service.
4.  **Data Layer:** Manages local storage for model binaries (`.pte`), tokenizer configs (`tokenizer.json`), and chat history.

For more details, see [Architecture Documentation](./docs/architecture.md).

---

## 📦 Getting Started

### Prerequisites

- **Node.js:** v20 or higher.
- **Development Environment:** 
    - **Android:** Android Studio and SDK (API 34+).
    - **iOS:** macOS with Xcode (ExecuTorch requires native compilation).
- **Model Assets:** You need compatible LLM weights in `.pte` format and a `tokenizer.json`.
    - Recommended: Llama-3.2-1B-Instruct.

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
2.  Push your model files:
    ```bash
    adb shell mkdir -p /storage/emulated/0/onionAI/
    adb push Llama-3.2-1B-Instruct.pte /storage/emulated/0/onionAI/
    adb push tokenizer.json /storage/emulated/0/onionAI/
    ```

---

## 🛠 Usage & Commands

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

### Mock Mode
If you don't have a physical device or native setup ready, the app automatically falls back to a simulated LLM. This allows you to test the UI, history management, and theming without needing a GPU-capable mobile device.

---

## 📂 Project Structure

```text
onionAI/
├── app/                # Expo Router screens (Tabs, Modals, Layouts)
├── assets/             # Images, fonts, and static assets
├── components/         # UI Components
│   ├── Assurance/      # Privacy-focused UI components
│   ├── Chat/           # Messaging bubbles, input areas, system monitors
│   └── ui/             # Themed base components
├── constants/          # Theme and global constants
├── docs/               # Technical documentation
├── hooks/              # Custom React hooks (AI logic, Context Providers)
│   ├── useOnionAI.ts   # Main AI interaction hook
│   ├── ModelContext.ts # Model asset management
│   └── ChatHistoryContext.ts # Local persistence of chats
├── scripts/            # Build and utility scripts
└── docs/               # Architecture and system documentation
```

---

## 🔒 Privacy & Security

OnionAI is built on the principle that **your data is your own**.

- **No Cloud:** We do not use OpenAI, Anthropic, or any other cloud provider.
- **No Analytics:** We do not track your prompts or usage patterns.
- **Local Persistence:** Chat history is stored only on your device using the Expo FileSystem API.
- **Transparency:** The `PrivacyGuard` component provides real-time status of the local connection.

---

## 🤝 Contributing

Contributions are welcome! Please read our `CONTRIBUTING.md` (if available) before submitting a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**OnionAI: Keeping your thoughts private, one layer at a time.** 🧅
