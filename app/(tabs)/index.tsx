import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MessageBubble } from '@/components/Chat/MessageBubble';
import { InputArea } from '@/components/Chat/InputArea';
import { SystemMonitor } from '@/components/Chat/SystemMonitor';
import { PrivacyGuard } from '@/components/Assurance/PrivacyGuard';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useOnionAI } from '@/hooks/useOnionAI';
import { useModelContext } from '@/hooks/ModelContext';

export default function HomeScreen() {
  const { modelUri, tokenizerUri, tokenizerConfigUri, isLoadingAssets } = useModelContext();
  const { messages, sendMessage, isThinking, isMockMode, errorMessage } = useOnionAI({ 
    useMock: false,
    modelUri,
    tokenizerUri,
    tokenizerConfigUri
  });
  const [inputValue, setInputValue] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  if (isLoadingAssets) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Preparing local models...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ThemedHeader 
        title="OnionAI" 
        subtitle={isMockMode ? 'Mock Mode' : (modelUri?.split('/').pop() ?? 'Local Mode')}
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
            <View style={styles.dateIndicator}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          }
          ListFooterComponent={
            isThinking ? (
              <View style={styles.thinkingContainer}>
                <Text style={styles.thinkingText}>OnionAI is thinking...</Text>
                <ActivityIndicator color={Colors.dark.tertiary} size="small" />
              </View>
            ) : null
          }
        />

        <InputArea 
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  listContent: {
    paddingBottom: 24, 
    paddingTop: 16,
  },
  dateIndicator: {
    alignSelf: 'center',
    backgroundColor: Colors.dark.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  dateText: {
    color: Colors.dark.onSurfaceVariant,
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
    color: Colors.dark.tertiary,
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
    color: Colors.dark.onSurface,
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});
