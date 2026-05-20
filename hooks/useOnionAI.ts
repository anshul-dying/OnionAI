import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MockLLMService, Message } from '../scripts/mock-llm';
import * as FileSystem from 'expo-file-system/legacy';
import { useSettings } from './SettingsContext';

type NativeUseLLM = (options: {
  model: {
    modelName: string;
    modelSource: string;
    tokenizerSource: string;
    tokenizerConfigSource: string;
  };
  maxSeqLen?: number;
  preventLoad: boolean;
}) => {
  response?: string;
  isReady?: boolean;
  isGenerating?: boolean;
  sendMessage?: (text: string) => Promise<void>;
  generate?: (messages: any[]) => Promise<string>;
  configure?: (config: {
    chatConfig?: { systemPrompt?: string };
    toolsConfig?: unknown;
    generationConfig?: { temperature?: number; topp?: number };
  }) => void;
  error?: { message?: string; code?: number };
};

// Mock hook for when ExecuTorch is not available
const useMockLLM = (): ReturnType<NativeUseLLM> => ({
  response: '',
  isGenerating: false,
  sendMessage: async (text: string) => {
    console.warn('Real LLM not available, sendMessage ignored.');
  },
});

let cachedNativeUseLLM: NativeUseLLM | null | undefined;
let executorchInitialized = false;

function getNativeUseLLM(): NativeUseLLM | null {
  if (cachedNativeUseLLM !== undefined) {
    return cachedNativeUseLLM;
  }
  try {
    const executorch = require('react-native-executorch');
    const executorchExpoResourceFetcher = require('react-native-executorch-expo-resource-fetcher');
    const maybeUseLLM = executorch?.useLLM as NativeUseLLM | undefined;
    const initExecutorch = executorch?.initExecutorch as
      | ((options: { resourceFetcher: unknown }) => void)
      | undefined;
    const resourceFetcher = executorchExpoResourceFetcher?.ExpoResourceFetcher;

    if (initExecutorch && resourceFetcher && !executorchInitialized) {
      initExecutorch({ resourceFetcher });
      executorchInitialized = true;
    } else if (initExecutorch && !resourceFetcher) {
      console.error(
        'react-native-executorch-expo-resource-fetcher is unavailable. Native mode cannot initialize.'
      );
    }

    if (!maybeUseLLM) {
      console.warn(
        'react-native-executorch loaded, but useLLM is unavailable. Falling back to mock mode.'
      );
    }

    cachedNativeUseLLM = maybeUseLLM ?? null;
  } catch (error) {
    console.error(
      'Failed to load react-native-executorch. Falling back to mock mode.',
      error
    );
    cachedNativeUseLLM = null;
  }
  return cachedNativeUseLLM;
}

export interface UseOnionAIProps {
  useMock?: boolean;
  modelUri?: string | null;
  tokenizerUri?: string | null;
  tokenizerConfigUri?: string | null;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: "Hello. I am OnionAI, made by TY_A_GROUP16, running locally on your hardware. My responses are private, secure, and require no internet connection. How can I assist your workflow today?",
  sender: 'ai',
  senderName: 'OnionAI',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function useOnionAI({
  useMock: initialUseMock = false,
  modelUri,
  tokenizerUri,
  tokenizerConfigUri,
  initialMessages,
  onMessagesChange,
}: UseOnionAIProps = {}) {
  const { systemPrompt, temperature, topp } = useSettings();
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0 ? initialMessages : [WELCOME_MESSAGE]
  );
  const [mockIsGenerating, setMockIsGenerating] = useState(false);
  const [runtimeErrorMessage, setRuntimeErrorMessage] = useState<string | null>(null);
  const [activeTokenizerUri, setActiveTokenizerUri] = useState<string | null>(tokenizerUri ?? null);
  const [isTokenizerFallbackExhausted, setIsTokenizerFallbackExhausted] = useState(false);
  const messageCounterRef = useRef(0);
  const pendingNativeAiMessageIdRef = useRef<string | null>(null);
  const lastNativeResponseRef = useRef<string>('');
  const lastSyncedMessagesRef = useRef<Message[] | null>(null);
  const nativeUseLLM = getNativeUseLLM();

  useEffect(() => {
    setActiveTokenizerUri(tokenizerUri ?? null);
    setIsTokenizerFallbackExhausted(false);
  }, [tokenizerUri, modelUri]);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      return;
    }
    setMessages([WELCOME_MESSAGE]);
  }, [initialMessages]);

  const tokenizerCandidates = useMemo(() => {
    const dirs = [
      'file:///storage/emulated/0/Android/data/com.anonymous.onionAI/files',
      'file:///storage/emulated/0/Android/media/com.anonymous.onionAI',
      'file:///storage/emulated/0/onionAI',
      'file:///storage/emulated/0/Download/onionAI',
      'file:///storage/emulated/0/Download',
    ];
    const names = ['tokenizer.json', 'tokenizer.bin', 'tokenizer.model'];
    const candidates = [
      tokenizerUri,
      ...dirs.flatMap((dir) => names.map((name) => `${dir}/${name}`)),
    ].filter((uri): uri is string => Boolean(uri));
    return Array.from(new Set(candidates));
  }, [tokenizerUri]);
  
  const computedUseMock =
    initialUseMock || !nativeUseLLM || !modelUri || !activeTokenizerUri || !tokenizerConfigUri;
  
  const modelId = useMemo(() => {
    if (!modelUri) return 'unknown';
    const filename = modelUri.split('/').pop() || 'model.pte';
    return filename.replace('.pte', '').replace('.pth', '');
  }, [modelUri]);

  const llm = nativeUseLLM
    ? nativeUseLLM({
        model: {
          modelName: modelId,
          modelSource: modelUri || '',
          tokenizerSource: activeTokenizerUri || '',
          tokenizerConfigSource: tokenizerConfigUri || '',
        },
        maxSeqLen: 1024,
        preventLoad: computedUseMock,
      })
    : useMockLLM();

  // Dynamic Parameter Syncing inside ExecuTorch
  useEffect(() => {
    if (computedUseMock || !llm || !llm.configure || llm.error) {
      return;
    }
    if (llm.isReady) {
      try {
        llm.configure({
          chatConfig: {
            systemPrompt: systemPrompt,
          },
          generationConfig: {
            temperature: temperature,
            topp: topp,
          },
        });
      } catch (err) {
        console.warn('Failed to configure ExecuTorch engine:', err);
      }
    }
  }, [llm?.isReady, systemPrompt, temperature, topp, computedUseMock]);

  useEffect(() => {
    if (computedUseMock || !llm?.error || isTokenizerFallbackExhausted) {
      return;
    }

    const errorCode = (llm.error as { code?: number })?.code;
    const errorMessage = `${llm.error?.message ?? ''}`.toLowerCase();
    const isTokenizerLoadError =
      errorCode === 167 ||
      (errorMessage.includes('tokenizer') && errorMessage.includes('load'));

    if (!isTokenizerLoadError) {
      return;
    }

    let cancelled = false;
    (async () => {
      // Extract the internal error code if present in the message
      const internalErrorCodeMatch = errorMessage.match(/error code: (\d+)/);
      const internalErrorCode = internalErrorCodeMatch?.[1];

      if (internalErrorCode === '4' && activeTokenizerUri?.endsWith('.model')) {
        console.error('CRITICAL: Tokenizer load failure (Code 4).');
        console.error('The native runner (HFTokenizer) failed to load your .model file.');
        console.error('Please provide the "tokenizer.json" file from HuggingFace instead.');
      }

      const currentIndex = Math.max(
        tokenizerCandidates.indexOf(activeTokenizerUri ?? ''),
        -1
      );

      for (let index = currentIndex + 1; index < tokenizerCandidates.length; index += 1) {
        const candidate = tokenizerCandidates[index];
        const fileInfo = await FileSystem.getInfoAsync(candidate);
        if (!fileInfo.exists) {
          continue;
        }
        if (!cancelled) {
          console.warn('Tokenizer load failed, retrying with fallback:', candidate);
          setActiveTokenizerUri(candidate);
        }
        return;
      }

      if (!cancelled) {
        setIsTokenizerFallbackExhausted(true);
        console.error('Tokenizer fallback exhausted. No compatible tokenizer file found.');
        if (activeTokenizerUri?.endsWith('.model')) {
           console.error('PROMPT: If you are using Llama 3.2, you MUST use "tokenizer.json".');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [llm?.error, computedUseMock, isTokenizerFallbackExhausted, tokenizerCandidates, activeTokenizerUri]);

  const sendMessage = useCallback(async (text: string) => {
    const createMessageId = () => {
      messageCounterRef.current += 1;
      return `${Date.now()}-${messageCounterRef.current}`;
    };

    // Add user message to UI immediately
    const userMessage: Message = {
      id: createMessageId(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setRuntimeErrorMessage(null);

    // Easter Egg: Maggie Healthy
    const normalizedText = text.toLowerCase();
    if (normalizedText.includes('maggie') && normalizedText.includes('healthy')) {
      const aiMessage: Message = {
        id: createMessageId(),
        text: "Yes, Maggie is healthy and officially approved by TY_A_GROUP16! 🍜",
        sender: 'ai',
        senderName: 'OnionAI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }

    if (computedUseMock) {
      setMockIsGenerating(true);
      try {
        const response = await MockLLMService.generateResponse(text, systemPrompt, temperature);
        const aiMessage: Message = {
          id: createMessageId(),
          text: response,
          sender: 'ai',
          senderName: 'OnionAI',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (err) {
        console.error('Mock LLM Error:', err);
        setRuntimeErrorMessage(err instanceof Error ? err.message : 'Failed to generate mock response.');
      } finally {
        setMockIsGenerating(false);
      }
    } else if (llm && (llm.generate || llm.sendMessage) && !llm.error) {
      try {
        const aiMessageId = createMessageId();
        pendingNativeAiMessageIdRef.current = aiMessageId;
        lastNativeResponseRef.current = llm?.response ?? '';
        setMessages(prev => [
          ...prev,
          {
            id: aiMessageId,
            text: '',
            sender: 'ai',
            senderName: 'OnionAI',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (llm.generate) {
          // Truncation fix: Many .pte models are compiled with 64 or 128 token limits.
          // Minimize prompt to leave space for output.
          const nativeMessages = [
            { role: 'system' as const, content: 'Name: OnionAI (TY_A_GROUP16). Brief.' },
            { role: 'user' as const, content: text }
          ];
          await llm.generate(nativeMessages);
        } else if (llm.sendMessage) {
          await llm.sendMessage(text);
        } else {
          console.warn('Native execution interface is unavailable (both generate and sendMessage are missing).');
        }
      } catch (err) {
        console.error("ExecuTorch Error:", err);
        setRuntimeErrorMessage(err instanceof Error ? err.message : 'Failed to generate native response.');
      }
    } else {
      const errorMsg = llm?.error?.message ?? 'LLM is not ready yet. Check model/tokenizer paths.';
      console.warn("LLM not ready yet:", errorMsg);
      setRuntimeErrorMessage(errorMsg);
    }
  }, [computedUseMock, llm, messages]);

  // Sync real LLM response into the pending AI message
  useEffect(() => {
    if (computedUseMock || !pendingNativeAiMessageIdRef.current || !llm?.response) {
      return;
    }

    if (llm.response === lastNativeResponseRef.current) return;
    lastNativeResponseRef.current = llm.response;

    const targetId = pendingNativeAiMessageIdRef.current;
    setMessages(prev =>
      prev.map(message =>
        message.id === targetId
          ? {
              ...message,
              text: llm.response ?? '',
            }
          : message
      )
    );

    if (!llm.isGenerating) {
      pendingNativeAiMessageIdRef.current = null;
      lastNativeResponseRef.current = '';
    }
  }, [llm?.response, llm?.isGenerating, computedUseMock]);

  useEffect(() => {
    if (!onMessagesChange) return;
    if (lastSyncedMessagesRef.current === messages) return;
    lastSyncedMessagesRef.current = messages;
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  return {
    messages,
    sendMessage,
    isThinking: computedUseMock ? mockIsGenerating : llm?.isGenerating,
    isMockMode: computedUseMock,
    errorMessage: runtimeErrorMessage ?? llm?.error?.message ?? null,
  };
}
