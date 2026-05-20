import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MessageBubble } from '@/components/Chat/MessageBubble';
import { InputArea } from '@/components/Chat/InputArea';
import { SystemMonitor } from '@/components/Chat/SystemMonitor';
import { PrivacyGuard } from '@/components/Assurance/PrivacyGuard';
import { useTheme } from '@/hooks/use-theme-color';
import { StatusBar } from 'expo-status-bar';
import { useOnionAI, UseOnionAIProps } from '@/hooks/useOnionAI';
import { useChatHistory } from '@/hooks/ChatHistoryContext';
import { useModelContext } from '@/hooks/ModelContext';
import { useSettings } from '@/hooks/SettingsContext';
import { MaterialIcons } from '@expo/vector-icons';

const SYSTEM_PROMPT_PRESETS = [
  {
    name: 'Default',
    prompt: "You are a private and secure local-first AI assistant called OnionAI, running on on-device hardware. Provide clear, concise, and helpful answers."
  },
  {
    name: 'Brief/Concise',
    prompt: "Be extremely concise, brief, and straight to the point. Answer in one or two short sentences."
  },
  {
    name: 'Coding Expert',
    prompt: "You are an expert software developer. Write clean, optimal, and documented code blocks for the user."
  },
  {
    name: 'Creative Writer',
    prompt: "Be highly descriptive, imaginative, engaging, and creative in your responses."
  }
];

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
  initialMessages: UseOnionAIProps['initialMessages'];
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
  
  const { 
    systemPrompt, 
    temperature, 
    topp, 
    setSystemPrompt, 
    setTemperature, 
    setTopP 
  } = useSettings();
  
  const [inputValue, setInputValue] = useState('');
  const [showTuneHUD, setShowTuneHUD] = useState(false);
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
        rightIcons={[
          {
            name: 'tune',
            onPress: () => setShowTuneHUD(prev => !prev),
          }
        ]}
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

        {/* Collapsible monospaced parameters HUD drawer */}
        {showTuneHUD && (
          <View style={[styles.hudContainer, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
            <View style={styles.hudRow}>
              {/* Stepper for Temperature */}
              <View style={styles.hudStat}>
                <View style={styles.hudLabelRow}>
                  <Text style={[styles.hudLabel, { color: theme.outline }]}>TEMP:</Text>
                  <Text style={[styles.hudValue, { color: theme.primary }]}>{temperature.toFixed(1)}</Text>
                </View>
                <View style={styles.hudControls}>
                  <TouchableOpacity 
                    onPress={() => setTemperature(Math.max(0.0, Number((temperature - 0.1).toFixed(1))))}
                    style={[styles.hudButton, { borderColor: theme.outlineVariant }]}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={10} color={theme.onSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setTemperature(Math.min(2.0, Number((temperature + 0.1).toFixed(1))))}
                    style={[styles.hudButton, { borderColor: theme.outlineVariant }]}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={10} color={theme.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.hudDivider, { backgroundColor: theme.outlineVariant }]} />

              {/* Stepper for Top-P */}
              <View style={styles.hudStat}>
                <View style={styles.hudLabelRow}>
                  <Text style={[styles.hudLabel, { color: theme.outline }]}>TOP_P:</Text>
                  <Text style={[styles.hudValue, { color: theme.primary }]}>{topp.toFixed(2)}</Text>
                </View>
                <View style={styles.hudControls}>
                  <TouchableOpacity 
                    onPress={() => setTopP(Math.max(0.0, Number((topp - 0.05).toFixed(2))))}
                    style={[styles.hudButton, { borderColor: theme.outlineVariant }]}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={10} color={theme.onSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setTopP(Math.min(1.0, Number((topp + 0.05).toFixed(2))))}
                    style={[styles.hudButton, { borderColor: theme.outlineVariant }]}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={10} color={theme.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.hudDivider, { backgroundColor: theme.outlineVariant }]} />

              {/* Custom Settings Redirect */}
              <TouchableOpacity 
                onPress={() => {
                  setShowTuneHUD(false);
                  router.push('/settings');
                }}
                style={[styles.hudSettingsButton, { borderColor: theme.outlineVariant }]}
                activeOpacity={0.7}
              >
                <MaterialIcons name="settings" size={10} color={theme.primary} />
                <Text style={[styles.hudSettingsText, { color: theme.primary }]}>EDIT</Text>
              </TouchableOpacity>
            </View>

            {/* Persona Quick-Presets Row */}
            <View style={styles.presetsContainer}>
              <Text style={[styles.hudPresetsTitle, { color: theme.outline }]}>PERSONA:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.hudPresetsScroll}
              >
                {SYSTEM_PROMPT_PRESETS.map((preset) => {
                  const isActive = systemPrompt === preset.prompt;
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() => setSystemPrompt(preset.prompt)}
                      style={[
                        styles.hudPresetBadge,
                        { 
                          borderColor: isActive ? theme.primary : theme.outlineVariant,
                          backgroundColor: isActive ? 'rgba(57, 81, 181, 0.05)' : 'transparent'
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.hudPresetText, 
                        { color: isActive ? theme.primary : theme.onSurfaceVariant }
                      ]}>
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
        
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
  hudContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  hudStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hudLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  hudValue: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '800',
  },
  hudControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudButton: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudDivider: {
    width: 1,
    height: 10,
    marginHorizontal: 2,
  },
  hudSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  hudSettingsText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
  },
  presetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  hudPresetsTitle: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  hudPresetsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  hudPresetBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hudPresetText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
  },
});
