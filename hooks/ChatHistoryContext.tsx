import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import type { Message } from '@/scripts/mock-llm';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface ChatHistoryContextType {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  activeSessionId: string | null;
  isLoading: boolean;
  selectSession: (sessionId: string) => void;
  createNewSession: () => string;
  deleteSession: (sessionId: string) => void;
  updateActiveSessionMessages: (messages: Message[]) => void;
}

interface PersistedChatHistory {
  activeSessionId: string | null;
  sessions: ChatSession[];
}

const STORAGE_PATH = `${FileSystem.documentDirectory}chat-sessions.json`;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWelcomeMessage(): Message {
  return {
    id: `welcome-${createId()}`,
    text: 'Hello. I am OnionAI, running locally on your hardware. My responses are private, secure, and require no internet connection. How can I assist your workflow today?',
    sender: 'ai',
    senderName: 'OnionAI',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function createSession(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: 'New Chat',
    createdAt: now,
    updatedAt: now,
    messages: [createWelcomeMessage()],
  };
}

function deriveTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.sender === 'user' && message.text.trim().length > 0);
  if (!firstUserMessage) return 'New Chat';
  const compact = firstUserMessage.text.replace(/\s+/g, ' ').trim();
  return compact.length > 56 ? `${compact.slice(0, 56)}...` : compact;
}

const ChatHistoryContext = createContext<ChatHistoryContextType>({
  sessions: [],
  activeSession: null,
  activeSessionId: null,
  isLoading: true,
  selectSession: () => {},
  createNewSession: () => '',
  deleteSession: () => {},
  updateActiveSessionMessages: () => {},
});

export function ChatHistoryProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const info = await FileSystem.getInfoAsync(STORAGE_PATH);
        if (!info.exists) {
          const defaultSession = createSession();
          setSessions([defaultSession]);
          setActiveSessionId(defaultSession.id);
          setHasLoaded(true);
          return;
        }

        const raw = await FileSystem.readAsStringAsync(STORAGE_PATH);
        const parsed = JSON.parse(raw) as PersistedChatHistory;
        const loadedSessions = Array.isArray(parsed?.sessions) ? parsed.sessions : [];

        if (!loadedSessions.length) {
          const defaultSession = createSession();
          setSessions([defaultSession]);
          setActiveSessionId(defaultSession.id);
          setHasLoaded(true);
          return;
        }

        const activeExists = loadedSessions.some((session) => session.id === parsed?.activeSessionId);
        setSessions(loadedSessions);
        setActiveSessionId(activeExists ? parsed.activeSessionId : loadedSessions[0].id);
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        const defaultSession = createSession();
        setSessions([defaultSession]);
        setActiveSessionId(defaultSession.id);
        setHasLoaded(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const payload: PersistedChatHistory = { activeSessionId, sessions };
    const timer = setTimeout(() => {
      FileSystem.writeAsStringAsync(STORAGE_PATH, JSON.stringify(payload)).catch((error) => {
        console.error('Failed to persist chat history:', error);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [sessions, activeSessionId, hasLoaded]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId((current) => (sessions.some((session) => session.id === sessionId) ? sessionId : current));
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const session = createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    return session.id;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((session) => session.id !== sessionId);
      if (remaining.length === 0) {
        const replacement = createSession();
        setActiveSessionId(replacement.id);
        return [replacement];
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }

      return remaining;
    });
  }, [activeSessionId]);

  const updateActiveSessionMessages = useCallback((messages: Message[]) => {
    if (!activeSessionId) return;

    setSessions((prev) => {
      let hasChanged = false;
      const next = prev.map((session) => {
        if (session.id !== activeSessionId) return session;
        if (session.messages === messages) return session;

        hasChanged = true;
        return {
          ...session,
          messages,
          title: deriveTitle(messages),
          updatedAt: new Date().toISOString(),
        };
      });

      return hasChanged ? next : prev;
    });
  }, [activeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const value: ChatHistoryContextType = useMemo(
    () => ({
      sessions,
      activeSession,
      activeSessionId,
      isLoading,
      selectSession,
      createNewSession,
      deleteSession,
      updateActiveSessionMessages,
    }),
    [sessions, activeSession, activeSessionId, isLoading, selectSession, createNewSession, deleteSession, updateActiveSessionMessages]
  );

  return <ChatHistoryContext.Provider value={value}>{children}</ChatHistoryContext.Provider>;
}

export function useChatHistory() {
  return useContext(ChatHistoryContext);
}
