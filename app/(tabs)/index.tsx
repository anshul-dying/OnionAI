import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MessageBubble } from '@/components/Chat/MessageBubble';
import { InputArea } from '@/components/Chat/InputArea';
import { SystemMonitor } from '@/components/Chat/SystemMonitor';
import { PrivacyGuard } from '@/components/Assurance/PrivacyGuard';
import { useTheme } from '@/hooks/use-theme-color';
import { StatusBar } from 'expo-status-bar';
import { useOnionAI } from '@/hooks/useOnionAI';
import { useChatHistory } from '@/hooks/ChatHistoryContext';
import { useModelContext } from '@/hooks/ModelContext';

export default function HomeScreen() {
  const theme = useTheme();
  const { modelUri, tokenizerUri, tokenizerConfigUri, isLoadingAssets } = useModelContext();
  const { activeSession, isLoading: isLoadingHistory } = useChatHistory();
  const shouldUseMock = !modelUri || !tokenizerUri || !tokenizerConfigUri;

  if (isLoadingAssets || isLoadingHistory || !activeSession) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.onSurface }]}>Preparing workspace...</Text>
      </View>
    );
  }

  return (
    <ChatRuntime
      key={activeSession.id}
      modelUri={modelUri}
      tokenizerUri={tokenizerUri}
      tokenizerConfigUri={tokenizerConfigUri}
      useMock={shouldUseMock}
      initialMessages={activeSession.messages}
    />
  );
}

function ChatRuntime({
  modelUri,
  tokenizerUri,
  tokenizerConfigUri,
  useMock,
  initialMessages,
}: {
  modelUri: string | null;
  tokenizerUri: string | null;
  tokenizerConfigUri: string | null;
  useMock: boolean;
  initialMessages: Parameters<typeof useOnionAI>[0]['initialMessages'];
}) {
  const router = useRouter();
  const theme = useTheme();
  const { updateActiveSessionMessages } = useChatHistory();
  const { messages, sendMessage, isThinking, isMockMode, errorMessage } = useOnionAI({
    useMock,
    modelUri,
    tokenizerUri,
    tokenizerConfigUri,
    initialMessages,
    onMessagesChange: updateActiveSessionMessages,
  });
  const [inputValue, setInputValue] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.background === '#fcf8f8' ? 'dark' : 'light'} />
      <ThemedHeader 
        title="OnionAI" 
        subtitle={isMockMode ? 'Mock Mode' : (modelUri?.split('/').pop() ?? 'Local Mode')}
        menuIcon="history"
        onMenuPress={() => router.push('/history')}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SystemMonitor 
          isMockMode={isMockMode}
          isThinking={Boolean(isThinking)}
          hasModel={Boolean(modelUri)}
          hasTokenizer={Boolean(tokenizerUri)}
          errorMessage={errorMessage}
        />

        <PrivacyGuard />
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble 
              text={item.text}
              sender={item.sender}
              senderName={item.senderName}
              timestamp={item.timestamp}
            />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={[styles.dateIndicator, { backgroundColor: theme.surfaceContainerHigh }]}>
              <Text style={[styles.dateText, { color: theme.onSurfaceVariant }]}>
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          }
          ListFooterComponent={
            isThinking ? (
              <View style={styles.thinkingContainer}>
                <Text style={[styles.thinkingText, { color: theme.tertiary }]}>OnionAI is thinking...</Text>
                <ActivityIndicator color={theme.tertiary} size="small" />
              </View>
            ) : null
          }
        />

        <InputArea 
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
          disabled={Boolean(isThinking)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24, 
    paddingTop: 16,
  },
  dateIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 20,
    marginTop: 8,
  },
  thinkingText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});
