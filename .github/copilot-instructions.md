# Copilot instructions for onionAI

## Build, run, and lint commands

- Install dependencies: `npm install`
- Start dev server: `npm run start` (same as `expo start`)
- Run Android native build/dev client: `npm run android`
- Run iOS native build/dev client: `npm run ios`
- Run web target: `npm run web`
- Lint: `npm run lint`
- Tests: no automated test command is currently configured in `package.json` (no single-test command available yet).

## High-level architecture

- App routing is Expo Router-based (`app/`), with root providers wired in `app/_layout.tsx` in this order: `SafeAreaProvider` → `ChatHistoryProvider` → `ModelProvider` → `ThemeProvider`.
- Main chat screen is `app/(tabs)/index.tsx`. It waits for both model assets and chat history to load, then mounts `ChatRuntime`.
- `ChatRuntime` uses `useOnionAI` (`hooks/useOnionAI.ts`) as the single chat runtime entry point and syncs messages back to session storage through `onMessagesChange`.
- `ModelProvider` (`hooks/ModelContext.tsx`) discovers model/tokenizer files from Android paths (`file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files` first, then `file:///storage/emulated/0/onionAI`), and creates `tokenizer_config.json` in app document storage if missing.
- `useOnionAI` dynamically uses native `react-native-executorch` when available; otherwise it falls back to `MockLLMService` (`scripts/mock-llm.ts`). It also has tokenizer fallback logic (`tokenizer.json`/`.bin`/`.model`) when load errors occur.
- `ChatHistoryProvider` (`hooks/ChatHistoryContext.tsx`) persists sessions to `FileSystem.documentDirectory + "chat-sessions.json"` with a 250ms debounce and auto-derives session titles from the first user message.

## Key repo-specific conventions

- Keep all AI message flow inside `useOnionAI`; UI components should not call native LLM modules directly.
- Use `ModelContext` for model/tokenizer URIs; do not hardcode file paths in screens/components beyond default constants used by model-management UI.
- Preserve local-first behavior: no cloud inference, telemetry, or external chat-history transport.
- Use path alias imports (`@/`) defined in `tsconfig.json` rather than deep relative imports.
- Reuse existing chat data shape from `scripts/mock-llm.ts` (`Message` interface) across hooks/components.
- Keep visual styling aligned with existing theme tokens in `constants/theme.ts` and shared UI primitives like `ThemedHeader` and chat components under `components/Chat/`.
