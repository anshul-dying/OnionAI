# OnionAI Mobile Team: Roles and Responsibilities

This document outlines the division of work for the 3-member Mobile Application team within the OnionAI project. It maps specific technical responsibilities to individual roles and identifies the primary code files owned by each member.

---

## 1. AI Engine Specialist
**Focus:** Local Inference, Native Bridge & Model Orchestration  
*Responsible for the core logic that communicates with the LLM and manages the "thinking" process.*

### Key Responsibilities:
*   **Native Integration:** Integrating the `react-native-executorch` native module for local inference.
*   **Streaming Logic:** Implementing the logic to update the UI as the AI generates tokens in real-time.
*   **Fallback Management:** Developing the `MockLLMService` for development and unsupported environments.
*   **Performance Monitoring:** Managing error handling for model loading and runtime failures.

### Primary Code Files:
*   `hooks/useOnionAI.ts`: The central orchestrator for message generation and streaming.
*   `scripts/mock-llm.ts`: Logic for simulated AI responses in "Mock Mode".
*   `quantization/export_executorch.py`: Scripts used to prepare `.pte` model files (Collaborative).

---

## 2. Interface Engine Specialist
**Focus:** State Management, Persistence & File Operations  
*Responsible for the "Middleware"—how data flows between the AI engine and the UI, and how it is stored.*

### Key Responsibilities:
*   **State Management:** Managing global application state using React Context (Model and History).
*   **Data Persistence:** Implementing local filesystem storage for chat sessions using `chat-sessions.json`.
*   **Model Scanning:** Developing the logic to detect and validate `.pte` and `tokenizer.json` files on the device.
*   **FileSystem Operations:** Handling device permissions and directory management via Expo FileSystem.

### Primary Code Files:
*   `hooks/ChatHistoryContext.tsx`: Manages the lifecycle and storage of all chat sessions.
*   `hooks/ModelContext.tsx`: Logic for storage scanning, model switching, and asset validation.
*   `hooks/use-theme-color.ts` & `constants/theme.ts`: Core theming and appearance logic.

---

## 3. UI/UX Specialist
**Focus:** Presentation Layer, Navigation & Component Design  
*Responsible for the user's visual experience, ensuring the app is intuitive, responsive, and accessible.*

### Key Responsibilities:
*   **Screen Development:** Building the functional screens (Chat Workspace, History Browser, Model Manager, Settings).
*   **Component Design:** Creating reusable themed components (Bubbles, Inputs, Headers, Monitors).
*   **Navigation Architecture:** Implementing file-based routing and navigation flow using Expo Router.
*   **Privacy UI:** Designing indicators like `PrivacyGuard` and `SystemMonitor` to communicate "Private-by-Design" principles.

### Primary Code Files:
*   `app/(tabs)/index.tsx`: The main Chat Workspace screen.
*   `app/(tabs)/models.tsx` & `app/history.tsx`: Management and history browser screens.
*   `components/Chat/MessageBubble.tsx` & `components/Chat/InputArea.tsx`: Primary chat UI components.
*   `components/Assurance/PrivacyGuard.tsx`: Component for user privacy assurance.

---

## Technical Architecture Summary

| Component | Responsibility | Owner |
| :--- | :--- | :--- |
| **View (UI)** | Renders chat bubbles, status indicators, and handles user navigation. | Member 3 |
| **Logic (Hooks)** | Orchestrates inference, streaming, and maps AI output to the state. | Member 1 |
| **State (Context)** | Manages active sessions, model selection, and local persistence. | Member 2 |
| **Engine (Native)** | Performs local mathematical inference on the device hardware. | Member 1 |

---

## Viva / Review Quick Reference
- **"Where is the AI logic?"** -> `hooks/useOnionAI.ts` (Member 1)
- **"How is history saved?"** -> `hooks/ChatHistoryContext.tsx` (Member 2)
- **"Where are the UI components?"** -> `components/Chat/` (Member 3)
- **"How does the app detect models?"** -> `hooks/ModelContext.tsx` (Member 2)
