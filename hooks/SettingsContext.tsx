import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsContextType {
  themeMode: ThemeMode;
  gpuEnabled: boolean;
  privacyEnabled: boolean;
  holographicEnabled: boolean;
  systemPrompt: string;
  temperature: number;
  topp: number;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setGpuEnabled: (enabled: boolean) => Promise<void>;
  setPrivacyEnabled: (enabled: boolean) => Promise<void>;
  setHolographicEnabled: (enabled: boolean) => Promise<void>;
  setSystemPrompt: (prompt: string) => Promise<void>;
  setTemperature: (temp: number) => Promise<void>;
  setTopP: (tp: number) => Promise<void>;
}

const SETTINGS_FILE_PATH = `${FileSystem.documentDirectory}app-settings.json`;

const DEFAULT_SYSTEM_PROMPT = "You are a private and secure local-first AI assistant called OnionAI, running on on-device hardware. Provide clear, concise, and helpful answers.";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [gpuEnabled, setGpuEnabledState] = useState(true);
  const [privacyEnabled, setPrivacyEnabledState] = useState(true);
  const [holographicEnabled, setHolographicEnabledState] = useState(false);
  const [systemPrompt, setSystemPromptState] = useState(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperatureState] = useState(0.7);
  const [topp, setTopPState] = useState(0.9);

  useEffect(() => {
    async function loadSettings() {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
          const parsed = JSON.parse(fileContent);
          if (parsed) {
            if (typeof parsed.themeMode === 'string') {
              setThemeModeState(parsed.themeMode as ThemeMode);
            } else if (typeof parsed.holographicEnabled === 'boolean' && !parsed.holographicEnabled) {
              setThemeModeState('light');
            }
            if (typeof parsed.gpuEnabled === 'boolean') setGpuEnabledState(parsed.gpuEnabled);
            if (typeof parsed.privacyEnabled === 'boolean') setPrivacyEnabledState(parsed.privacyEnabled);
            if (typeof parsed.holographicEnabled === 'boolean') setHolographicEnabledState(parsed.holographicEnabled);
            if (typeof parsed.systemPrompt === 'string') setSystemPromptState(parsed.systemPrompt);
            if (typeof parsed.temperature === 'number') setTemperatureState(parsed.temperature);
            if (typeof parsed.topp === 'number') setTopPState(parsed.topp);
          }
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async (
    theme: ThemeMode,
    gpu: boolean,
    privacy: boolean,
    holographic: boolean,
    prompt: string,
    temp: number,
    tp: number
  ) => {
    try {
      const settings = {
        themeMode: theme,
        gpuEnabled: gpu,
        privacyEnabled: privacy,
        holographicEnabled: holographic,
        systemPrompt: prompt,
        temperature: temp,
        topp: tp,
      };
      await FileSystem.writeAsStringAsync(SETTINGS_FILE_PATH, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveSettings(mode, gpuEnabled, privacyEnabled, holographicEnabled, systemPrompt, temperature, topp);
  };

  const setGpuEnabled = async (enabled: boolean) => {
    setGpuEnabledState(enabled);
    await saveSettings(themeMode, enabled, privacyEnabled, holographicEnabled, systemPrompt, temperature, topp);
  };

  const setPrivacyEnabled = async (enabled: boolean) => {
    setPrivacyEnabledState(enabled);
    await saveSettings(themeMode, gpuEnabled, enabled, holographicEnabled, systemPrompt, temperature, topp);
  };

  const setHolographicEnabled = async (enabled: boolean) => {
    setHolographicEnabledState(enabled);
    await saveSettings(themeMode, gpuEnabled, privacyEnabled, enabled, systemPrompt, temperature, topp);
  };

  const setSystemPrompt = async (prompt: string) => {
    setSystemPromptState(prompt);
    await saveSettings(themeMode, gpuEnabled, privacyEnabled, holographicEnabled, prompt, temperature, topp);
  };

  const setTemperature = async (temp: number) => {
    setTemperatureState(temp);
    await saveSettings(themeMode, gpuEnabled, privacyEnabled, holographicEnabled, systemPrompt, temp, topp);
  };

  const setTopP = async (tp: number) => {
    setTopPState(tp);
    await saveSettings(themeMode, gpuEnabled, privacyEnabled, holographicEnabled, systemPrompt, temperature, tp);
  };

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        gpuEnabled,
        privacyEnabled,
        holographicEnabled,
        systemPrompt,
        temperature,
        topp,
        setThemeMode,
        setGpuEnabled,
        setPrivacyEnabled,
        setHolographicEnabled,
        setSystemPrompt,
        setTemperature,
        setTopP,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
