import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatHistoryProvider } from '@/hooks/ChatHistoryContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ModelProvider } from '@/hooks/ModelContext';
import { SettingsProvider, useSettings } from '@/hooks/SettingsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <RootLayoutContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { themeMode } = useSettings();
  const systemTheme = useColorScheme() ?? 'dark';
  const activeTheme = themeMode === 'system' ? systemTheme : themeMode;

  return (
    <ChatHistoryProvider>
      <ModelProvider>
        <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ModelProvider>
    </ChatHistoryProvider>
  );
}
