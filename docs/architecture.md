# OnionAI Architecture

This document describes the high-level architecture and system design of OnionAI,
a private, local-first AI chat application.

## System Overview

OnionAI is designed to provide secure, offline-capable AI chat using Large
Language Models (LLMs) directly on mobile devices. It leverages ExecuTorch for
high-performance on-device inference and React Native for a cross-platform user
experience.

## Technical Stack

OnionAI is built using modern mobile development technologies:

- **Framework:** Expo SDK 54 (React Native 0.81).
- **Navigation:** Expo Router for file-based routing.
- **AI Engine:** ExecuTorch for on-device inference.
- **State Management:** React Context (Model and History providers).
- **Architecture:** React Native New Architecture enabled with React Compiler.
- **Styling:** Themed components supporting light and dark modes.

## Component Architecture

The following diagram illustrates the relationship between the major layers of
the application.

```mermaid
graph TD
    subgraph UI_Layer [Presentation Layer]
        HomeScreen[HomeScreen]
        InputArea[InputArea]
        MessageBubble[MessageBubble]
        SystemMonitor[SystemMonitor]
        PrivacyGuard[PrivacyGuard]
    end

    subgraph Logic_Layer [Application Logic]
        useOnionAI[useOnionAI Hook]
        ModelContext[ModelContext Provider]
        ChatHistoryContext[ChatHistoryContext Provider]
    end

    subgraph Native_Layer [Inference Layer]
        ExecuTorch[react-native-executorch]
        MockLLM[MockLLMService]
    end

    subgraph Data_Layer [Data Layer]
        FileSystem[Expo FileSystem]
        ModelFiles[Llama-3.2-1B-Instruct.pte]
        TokenizerFiles[tokenizer.json]
        HistoryFile[chat-sessions.json]
    end

    HomeScreen --> useOnionAI
    HomeScreen --> ModelContext
    HomeScreen --> ChatHistoryContext
    useOnionAI --> ExecuTorch
    useOnionAI --> MockLLM
    ChatHistoryContext --> FileSystem
    ModelContext --> FileSystem
    FileSystem --> ModelFiles
    FileSystem --> TokenizerFiles
    FileSystem --> HistoryFile
```

### Layer Responsibilities

- **Presentation Layer:** Handles user interaction and rendering. Components are
  built with React Native and themed for light/dark mode support.
- **Application Logic:** Manages the state of the chat, model configuration, and
  orchestration between the UI and inference engines.
- **Inference Layer:** Provides the execution environment for LLMs. It abstracts
  the native `react-native-executorch` module.
- **Data Layer:** Manages access to model binaries and tokenizer configurations
  stored on the device's local filesystem.

## Interaction Flow

The sequence diagram below shows how a message is processed from user input to
AI response.

```mermaid
sequenceDiagram
    participant User
    participant HomeScreen
    participant useOnionAI
    participant ChatHistoryContext
    participant Inference
    participant FileSystem

    User->>HomeScreen: handleSend(text)
    HomeScreen->>useOnionAI: sendMessage(text)
    useOnionAI->>HomeScreen: Update messages (User Msg)
    
    useOnionAI->>ChatHistoryContext: onMessagesChange()
    ChatHistoryContext->>FileSystem: Save chat-sessions.json (Debounced)
    
    alt Native Mode (ExecuTorch)
        useOnionAI->>Inference: sendMessage(text)
        loop Streaming
            Inference-->>useOnionAI: onResponseUpdate(chunk)
            useOnionAI->>HomeScreen: Update messages (AI Msg)
            useOnionAI->>ChatHistoryContext: onMessagesChange()
        end
    else Mock Mode
        useOnionAI->>Inference: generateResponse(text)
        Inference-->>useOnionAI: fullResponse
        useOnionAI->>HomeScreen: Update messages (AI Msg)
        useOnionAI->>ChatHistoryContext: onMessagesChange()
    end
    ChatHistoryContext->>FileSystem: Save final session state
```

## System Lifecycle

OnionAI undergoes a strict initialization phase to ensure model assets are
available before chat begins.

```mermaid
stateDiagram-v2
    [*] --> Initializing: App Startup
    
    state Initializing {
        [*] --> LoadingModels: ModelContext
        [*] --> LoadingHistory: ChatHistoryContext
        
        LoadingModels --> ScanningFiles: Search Storage
        ScanningFiles --> ModelsReady
        
        LoadingHistory --> ReadingJSON: Read chat-sessions.json
        ReadingJSON --> HistoryReady
    }

    Initializing --> ReadyToChat: Models & History Loaded
    Initializing --> FallbackMode: Asset Load Failed

    state ReadyToChat {
        [*] --> Idle
        Idle --> Generating: User Input
        Generating --> Idle: Response Complete
        Idle --> Saving: Debounced Change
        Saving --> Idle
    }
```

## Data Models and Interfaces

The following class diagram represents the core data structures and hooks used
within the application logic.

```mermaid
classDiagram
    class ModelContextType {
        +string modelUri
        +string tokenizerUri
        +string tokenizerConfigUri
        +boolean isLoadingAssets
    }

    class ChatHistoryContextType {
        +ChatSession[] sessions
        +ChatSession activeSession
        +boolean isLoading
        +selectSession(id: string)
        +createNewSession() string
        +deleteSession(id: string)
        +updateActiveSessionMessages(msgs: Message[])
    }

    class ChatSession {
        +string id
        +string title
        +string createdAt
        +string updatedAt
        +Message[] messages
    }

    class Message {
        +string id
        +string text
        +string sender
        +string timestamp
        +string senderName
    }

    class UseOnionAIReturn {
        +Message[] messages
        +sendMessage(text: string)
        +boolean isThinking
        +boolean isMockMode
    }

    ModelProvider ..> ModelContextType : provides
    ChatHistoryProvider ..> ChatHistoryContextType : provides
    ChatSession "1" *-- "many" Message : contains
    ChatHistoryContextType "1" *-- "many" ChatSession : manages
    HomeScreen ..> useOnionAI : uses
    useOnionAI ..> Message : manages
```

## Data Privacy Model

OnionAI follows a "Local-First, Local-Only" privacy model:

1.  **Zero Telemetry:** No chat data or model prompts are sent to external
    servers.
2.  **On-Device Inference:** All neural network computations happen on the
    device's NPU/GPU/CPU via ExecuTorch.
3.  **Local Storage:** Model weights and chat history (if persistent) remain in
    private app storage or user-controlled folders.
