import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/hooks/use-theme-color';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface SettingItemProps {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  accent: 'primary' | 'tertiary';
  theme: ReturnType<typeof useTheme>;
  styles: any;
}

const SETTINGS_FILE_PATH = `${FileSystem.documentDirectory}app-settings.json`;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(true);
  const [holographicEnabled, setHolographicEnabled] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
          const parsed = JSON.parse(fileContent);
          if (parsed) {
            if (typeof parsed.gpuEnabled === 'boolean') setGpuEnabled(parsed.gpuEnabled);
            if (typeof parsed.privacyEnabled === 'boolean') setPrivacyEnabled(parsed.privacyEnabled);
            if (typeof parsed.holographicEnabled === 'boolean') setHolographicEnabled(parsed.holographicEnabled);
          }
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async (gpu: boolean, privacy: boolean, holographic: boolean) => {
    try {
      const settings = {
        gpuEnabled: gpu,
        privacyEnabled: privacy,
        holographicEnabled: holographic,
      };
      await FileSystem.writeAsStringAsync(SETTINGS_FILE_PATH, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  const handleToggleGpu = (value: boolean) => {
    setGpuEnabled(value);
    saveSettings(value, privacyEnabled, holographicEnabled);
  };

  const handleTogglePrivacy = (value: boolean) => {
    setPrivacyEnabled(value);
    saveSettings(gpuEnabled, value, holographicEnabled);
  };

  const handleToggleHolographic = (value: boolean) => {
    setHolographicEnabled(value);
    saveSettings(gpuEnabled, privacyEnabled, value);
  };

  const handleAction = (id: string) => {
    if (id === 'about') {
      router.push('/explore');
    } else if (id === 'updates') {
      Alert.alert('Check for Updates', 'onionAI is up to date! Version 1.0.4 is the latest version.');
    }
  };

  const MODEL_PREFERENCES = [
    {
      id: 'gpu-acceleration',
      icon: 'memory' as const,
      title: 'GPU Acceleration',
      subtitle: 'Use hardware acceleration if available',
      value: gpuEnabled,
      onValueChange: handleToggleGpu,
      accent: 'tertiary' as const,
    },
    {
      id: 'privacy-guard',
      icon: 'security' as const,
      title: 'Privacy Guard',
      subtitle: 'Encrypt local weights and history',
      value: privacyEnabled,
      onValueChange: handleTogglePrivacy,
      accent: 'tertiary' as const,
    },
  ];

  const APPEARANCE_SETTINGS = [
    {
      id: 'holographic-theme',
      icon: 'palette' as const,
      title: 'Holographic Theme',
      subtitle: 'Enable premium visual effects',
      value: holographicEnabled,
      onValueChange: handleToggleHolographic,
      accent: 'primary' as const,
    },
  ];

  const PROJECT_ACTIONS = [
    { id: 'about', icon: 'info' as const, title: 'About Version 1.0.4' },
    { id: 'updates', icon: 'update' as const, title: 'Check for Updates' },
  ];

  return (
    <View style={styles.container}>
      <ThemedHeader 
        title="Settings" 
        showMenu={false}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Preferences</Text>
          <View style={styles.card}>
            {MODEL_PREFERENCES.map((setting, index) => (
              <React.Fragment key={setting.id}>
                <SettingItem 
                  icon={setting.icon}
                  title={setting.title}
                  subtitle={setting.subtitle}
                  value={setting.value}
                  onValueChange={setting.onValueChange}
                  accent={setting.accent}
                  theme={theme}
                  styles={styles}
                />
                {index < MODEL_PREFERENCES.length - 1 ? <SettingDivider styles={styles} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            {APPEARANCE_SETTINGS.map((setting) => (
              <SettingItem 
                key={setting.id}
                icon={setting.icon}
                title={setting.title}
                subtitle={setting.subtitle}
                value={setting.value}
                onValueChange={setting.onValueChange}
                accent={setting.accent}
                theme={theme}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project onionAI</Text>
          <View style={styles.card}>
            {PROJECT_ACTIONS.map((action, index) => (
              <React.Fragment key={action.id}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  accessibilityRole="button"
                  onPress={() => handleAction(action.id)}
                >
                  <MaterialIcons name={action.icon} size={24} color={theme.outline} style={styles.itemIcon} />
                  <Text style={styles.itemTitle}>{action.title}</Text>
                </TouchableOpacity>
                {index < PROJECT_ACTIONS.length - 1 ? <SettingDivider styles={styles} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onValueChange, 
  accent, 
  theme, 
  styles 
}: SettingItemProps) {
  const activeTrackColor =
    accent === 'primary' ? theme.primaryContainer : theme.tertiaryContainer;
  const activeThumbColor = accent === 'primary' ? theme.primary : theme.tertiary;

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <MaterialIcons
          name={icon}
          size={24}
          color={accent === 'primary' ? theme.primary : theme.tertiary}
          style={styles.itemIcon}
        />
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemSub}>{subtitle}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceContainerHighest, true: activeTrackColor }}
        thumbColor={value ? activeThumbColor : theme.outline}
      />
    </View>
  );
}

const SettingDivider = ({ styles }: { styles: any }) => <View style={styles.divider} />;

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: theme.outline,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemTitle: {
    color: theme.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSub: {
    color: theme.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.outlineVariant || 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
  },
});
