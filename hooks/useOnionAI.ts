import { useState, useCallback, useEffect, useMemo } from 'react';
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

// Try to import react-native-executorch, but don't crash if it's missing (Expo Go)
let useLLMHook: any;
try {
  const executorch = require('react-native-executorch');
  useLLMHook = executorch.useLLM;
} catch (e) {
  console.warn('react-native-executorch is not available. Falling back to mock mode.');
  useLLMHook = useMockLLM;
}

export interface UseOnionAIProps {
  useMock?: boolean;
  modelUri?: string | null;
  tokenizerUri?: string | null;
  tokenizerConfigUri?: string | null;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: "Hello. I am OnionAI, running locally on your hardware. My responses are private, secure, and require no internet connection. How can I assist your workflow today?",
  sender: 'ai',
  senderName: 'OnionAI',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function useOnionAI({ useMock: initialUseMock = false, modelUri, tokenizerUri, tokenizerConfigUri }: UseOnionAIProps = {}) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [activeTokenizerUri, setActiveTokenizerUri] = useState<string | null>(tokenizerUri ?? null);
  const [isTokenizerFallbackExhausted, setIsTokenizerFallbackExhausted] = useState(false);

  useEffect(() => {
    setActiveTokenizerUri(tokenizerUri ?? null);
    setIsTokenizerFallbackExhausted(false);
  }, [tokenizerUri, modelUri]);

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
  
  // If useLLM is not available (Expo Go), force mock mode
  const isNativeAvailable = useLLMHook !== useMockLLM;
  const useMock = initialUseMock || !isNativeAvailable || !modelUri || !activeTokenizerUri;

  useEffect(() => {
    if (useMock) {
      console.log('--- OnionAI Status ---');
      console.log('Mode: Mock');
      console.log('Reason:', !isNativeAvailable ? 'Native Module Missing (Expo Go?)' : (!modelUri ? 'Model URI Missing' : 'Tokenizer URI Missing'));
      console.log('ModelPath:', modelUri);
      console.log('TokenizerPath:', activeTokenizerUri);
      console.log('----------------------');
    } else {
      console.log('--- OnionAI Status ---');
      console.log('Mode: Native ExecuTorch');
      console.log('Model:', modelUri);
      console.log('Tokenizer:', activeTokenizerUri);
      console.log('Config:', tokenizerConfigUri);
      if (activeTokenizerUri?.endsWith('.model')) {
        console.warn('CAUTION: You are using a .model tokenizer. Llama 3.2 often requires .json.');
      }
      console.log('----------------------');
    }
  }, [useMock, isNativeAvailable, modelUri, activeTokenizerUri, tokenizerConfigUri]);

  // Real ExecuTorch Hook - must be called unconditionally if it's a hook
  const llm = useLLMHook({
    model: {
      modelName: 'llama-3.2-1b',
      modelSource: modelUri || '',
      tokenizerSource: activeTokenizerUri || '',
      tokenizerConfigSource: tokenizerConfigUri || '', 
    },
    preventLoad: !modelUri || !activeTokenizerUri || !tokenizerConfigUri,
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
  }, [
    llm?.error,
    useMock,
    isTokenizerFallbackExhausted,
    tokenizerCandidates,
    activeTokenizerUri,
  ]);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);

    if (useMock) {
      const response = await MockLLMService.generateResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        senderName: 'OnionAI',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);
    } else if (llm && llm.sendMessage) {
      try {
        await llm.sendMessage(text);
      } catch (err) {
        console.error("ExecuTorch Error:", err);
      }
    } else {
      console.warn("LLM not ready yet. Check logs for load errors.");
    }
  }, [useMock, llm]);

  // Sync real LLM response to messages
  useEffect(() => {
    if (!useMock && llm?.response) {
      const lastMessage = messages[messages.length - 1];
      
      // If the last message is from AI, update it (streaming)
      if (lastMessage && lastMessage.sender === 'ai' && lastMessage.id === 'llm-streaming') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: llm.response,
          };
          return updated;
        });
      } else if (!llm.isGenerating && llm.response) {
        // Final response received
        const aiMessage: Message = {
          id: 'llm-streaming',
          text: llm.response,
          sender: 'ai',
          senderName: 'OnionAI',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    }
  }, [llm?.response, llm?.isGenerating, useMock]);

  return {
    messages,
    sendMessage,
    isThinking: useMock ? false : llm?.isGenerating,
    isMockMode: useMock,
    errorMessage: llm?.error?.message ?? null,
  };
}
