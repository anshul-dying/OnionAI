# onionAI - Private, Local-First AI Chat

onionAI is a privacy-centric AI chat application built with React Native and Expo. It leverages **ExecuTorch** to run Large Language Models (LLMs) locally on mobile hardware, ensuring that data never leaves the device and that the AI remains functional without an internet connection.

## Project Overview

- **Purpose:** Provide a secure, private, and offline-capable AI assistant.
- **Core Technology:** [ExecuTorch](https://pytorch.org/executorch/) for on-device inference.
- LLM weights in `.pte` format and a compatible `tokenizer.json`.
- Architecture: 
  - **Framework:** Expo (SDK 54) with Expo Router for file-based navigation.
  - **AI Logic:** `useOnionAI` hook manages the chat state and interacts with either the `react-native-executorch` native module or a `MockLLMService` (for development/non-native environments).
  - **State Management:** React Context (`ModelContext.tsx`) manages model and tokenizer file paths.
  - **Privacy:** `PrivacyGuard` component ensures user assurance regarding local-only processing.

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- Android Studio / Xcode for native builds (ExecuTorch requires native modules).
- LLM weights in `.pte` format and a compatible `tokenizer.json`.

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. **Android Setup:**
   - The app expects model files to be at `/storage/emulated/0/onionAI/` on the device.
   - Files needed: `Llama-3.2-1B-Instruct.pte` and `tokenizer.json`.
   - Ensure permissions are granted for external storage.

### Commands
- **Start Development Server:**
  ```bash
  npx expo start
  ```
  *Note: Running in Expo Go will trigger "Mock Mode" because native ExecuTorch modules are not available.*

- **Run on Android:**
  ```bash
  npm run android
  ```

- **Run on iOS:**
  ```bash
  npm run ios
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

## Development Conventions

- **AI Hook (`hooks/useOnionAI.ts`):** All chat interactions should go through this hook. It handles both streaming (from real LLM) and static responses (from mock).
- **Model Management:** Avoid hardcoding model paths. Use `ModelContext` to provide URIs to the application.
- **UI & Theming:** Use themed components from `components/ThemedText.tsx` and constants from `constants/theme.ts` to support light/dark modes.
- **Safety & Privacy:** Always prioritize "Private by Design" principles. Avoid adding any features that send user data or chat history to external servers.

## Key Directory Structure

- `app/`: Expo Router screens and layouts.
- `assets/`: Static assets (icons, splash) and potentially small model files (though large ones should be loaded from external storage).
- `components/`:
  - `Chat/`: Messaging UI (bubbles, input areas, system monitoring).
  - `Assurance/`: Privacy-focused UI components.
- `hooks/`: Custom hooks for state and AI logic.
- `scripts/`: Utility scripts, including `mock-llm.ts` for non-native testing.
