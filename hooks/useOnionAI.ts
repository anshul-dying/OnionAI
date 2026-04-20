import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MockLLMService, Message } from '@/scripts/mock-llm';
import * as FileSystem from 'expo-file-system/legacy';

// Mock hook for when ExecuTorch is not available
const useMockLLM = () => ({
  response: '',
  isGenerating: false,
  sendMessage: async (text: string) => {
    console.warn('Real LLM not available, sendMessage ignored.');
  },
});

type NativeUseLLM = (options: {
  model: {
    modelName: string;
    modelSource: string;
    tokenizerSource: string;
    tokenizerConfigSource: string;
  };
  preventLoad: boolean;
}) => {
  response?: string;
  isGenerating?: boolean;
  sendMessage?: (text: string) => Promise<void>;
  error?: { message?: string; code?: number };
};

let cachedNativeUseLLM: NativeUseLLM | null | undefined;
let executorchInitialized = false;

function getNativeUseLLM(): NativeUseLLM | null {
  if (cachedNativeUseLLM !== undefined) {
    return cachedNativeUseLLM;
  }
  try {
    const executorch = require('react-native-executorch');
    const maybeUseLLM = executorch?.useLLM as NativeUseLLM | undefined;
    const initExecutorch = executorch?.initExecutorch as ((options?: unknown) => void) | undefined;

    if (initExecutorch && !executorchInitialized) {
      initExecutorch();
      executorchInitialized = true;
    }

    cachedNativeUseLLM = maybeUseLLM ?? null;
  } catch {
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
  text: "Hello. I am OnionAI, running locally on your hardware. My responses are private, secure, and require no internet connection. How can I assist your workflow today?",
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
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0 ? initialMessages : [WELCOME_MESSAGE]
  );
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
      'file:///storage/emulated/0/onionAI',
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
  const useMockRef = useRef<boolean>(computedUseMock);
  const useMock = useMockRef.current;
  const llm = useMock
    ? useMockLLM()
    : nativeUseLLM({
        model: {
          modelName: 'llama-3.2-1b',
          modelSource: modelUri || '',
          tokenizerSource: activeTokenizerUri || '',
          tokenizerConfigSource: tokenizerConfigUri || '',
        },
        preventLoad: false,
      });

  useEffect(() => {
    if (useMock || !llm?.error || isTokenizerFallbackExhausted) {
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
  }, [llm?.error, useMock, isTokenizerFallbackExhausted, tokenizerCandidates, activeTokenizerUri]);

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

    if (useMock) {
      const response = await MockLLMService.generateResponse(text);
      const aiMessage: Message = {
        id: createMessageId(),
        text: response,
        sender: 'ai',
        senderName: 'OnionAI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);
    } else if (llm && llm.sendMessage) {
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
        await llm.sendMessage(text);
      } catch (err) {
        console.error("ExecuTorch Error:", err);
      }
    } else {
      console.warn("LLM not ready yet. Check logs for load errors.");
    }
  }, [useMock, llm]);

  // Sync real LLM response into the pending AI message
  useEffect(() => {
    if (useMock || !pendingNativeAiMessageIdRef.current || !llm?.response) {
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
              text: llm.response,
            }
          : message
      )
    );

    if (!llm.isGenerating) {
      pendingNativeAiMessageIdRef.current = null;
      lastNativeResponseRef.current = '';
    }
  }, [llm?.response, llm?.isGenerating, useMock]);

  useEffect(() => {
    if (!onMessagesChange) return;
    if (lastSyncedMessagesRef.current === messages) return;
    lastSyncedMessagesRef.current = messages;
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  return {
    messages,
    sendMessage,
    isThinking: useMock ? false : llm?.isGenerating,
    isMockMode: useMock,
    errorMessage: llm?.error?.message ?? null,
  };
}
