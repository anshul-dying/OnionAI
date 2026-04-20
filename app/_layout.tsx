import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ModelProvider } from '@/hooks/ModelContext';

// Initialize ExecuTorch for offline inference if available
try {
  const { initExecutorch } = require('react-native-executorch');
  const { ExpoResourceFetcher } = require('react-native-executorch-expo-resource-fetcher');
  initExecutorch({ resourceFetcher: ExpoResourceFetcher });
} catch (e) {
  console.warn('ExecuTorch could not be initialized (might be Expo Go or missing native module).');
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ModelProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ModelProvider>
    </SafeAreaProvider>
  );
}
