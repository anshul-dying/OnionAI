import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedHeader } from '@/components/ThemedHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-color';
import { useSettings } from '@/hooks/SettingsContext';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface SettingItemProps {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  theme: ReturnType<typeof useTheme>;
  styles: any;
}

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

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const {
    themeMode,
    gpuEnabled,
    privacyEnabled,
    systemPrompt,
    temperature,
    topp,
    setThemeMode,
    setGpuEnabled,
    setPrivacyEnabled,
    setSystemPrompt,
    setTemperature,
    setTopP,
  } = useSettings();

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
      onValueChange: setGpuEnabled,
    },
    {
      id: 'privacy-guard',
      icon: 'security' as const,
      title: 'Privacy Guard',
      subtitle: 'Encrypt local weights and history',
      value: privacyEnabled,
      onValueChange: setPrivacyEnabled,
    },
  ];

  const APPEARANCE_SETTINGS = [
    {
      id: 'dark-mode',
      icon: 'dark-mode' as const,
      title: 'Dark Mode',
      subtitle: 'Use dark appearance across the application',
      value: themeMode === 'dark',
      onValueChange: (val: boolean) => setThemeMode(val ? 'dark' : 'light'),
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Model Preferences</Text>
            <Text style={styles.sectionSubTitle}>COMPILATION CONFIG</Text>
          </View>
          
          <View style={styles.card}>
            {MODEL_PREFERENCES.map((setting, index) => (
              <React.Fragment key={setting.id}>
                <SettingItem 
                  icon={setting.icon}
                  title={setting.title}
                  subtitle={setting.subtitle}
                  value={setting.value}
                  onValueChange={setting.onValueChange}
                  theme={theme}
                  styles={styles}
                />
                {index < MODEL_PREFERENCES.length - 1 ? <SettingDivider styles={styles} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Dynamic Inference Parameters (Sliders / Steppers) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Inference Parameters</Text>
            <Text style={styles.sectionSubTitle}>SAMPLING CONFIG</Text>
          </View>
          
          <View style={styles.card}>
            {/* Temperature Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperHeader}>
                <View style={styles.stepperTitleRow}>
                  <MaterialIcons name="thermostat" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.itemTitle}>Temperature</Text>
                </View>
                <Text style={styles.stepperValue}>{temperature.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemSub}>Controls randomness (0.0 = deterministic, 2.0 = creative)</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity 
                  onPress={() => setTemperature(Math.max(0.0, Number((temperature - 0.1).toFixed(1))))}
                  style={styles.stepButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={14} color={theme.text} />
                </TouchableOpacity>
                
                <Text style={styles.visualTrack}>
                  {Array.from({ length: 11 }).map((_, i) => {
                    const valRatio = temperature / 2.0;
                    const activeIndex = Math.round(valRatio * 10);
                    return i === activeIndex ? '█' : '─';
                  }).join('')}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => setTemperature(Math.min(2.0, Number((temperature + 0.1).toFixed(1))))}
                  style={styles.stepButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={14} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <SettingDivider styles={styles} />

            {/* Top-P Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperHeader}>
                <View style={styles.stepperTitleRow}>
                  <MaterialIcons name="blur-on" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.itemTitle}>Top-P (Nucleus)</Text>
                </View>
                <Text style={styles.stepperValue}>{topp.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemSub}>Only samples from top cumulative probability tokens</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity 
                  onPress={() => setTopP(Math.max(0.0, Number((topp - 0.05).toFixed(2))))}
                  style={styles.stepButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={14} color={theme.text} />
                </TouchableOpacity>
                
                <Text style={styles.visualTrack}>
                  {Array.from({ length: 11 }).map((_, i) => {
                    const valRatio = topp / 1.0;
                    const activeIndex = Math.round(valRatio * 10);
                    return i === activeIndex ? '█' : '─';
                  }).join('')}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => setTopP(Math.min(1.0, Number((topp + 0.05).toFixed(2))))}
                  style={styles.stepButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={14} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* AI System Instructions Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>System Instructions</Text>
            <Text style={styles.sectionSubTitle}>BASE AI PERSONA</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.promptContainer}>
              <Text style={styles.itemSub}>Defines the model&apos;s core behavior, rules, and personality.</Text>
              
              <TextInput
                style={styles.promptInput}
                multiline
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="Type custom system instructions..."
                placeholderTextColor={theme.outline}
                textAlignVertical="top"
              />

              {/* Quick Presets Badge Row */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.presetsScroll}
              >
                {SYSTEM_PROMPT_PRESETS.map((preset) => {
                  const isActive = systemPrompt === preset.prompt;
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() => setSystemPrompt(preset.prompt)}
                      style={[
                        styles.presetBadge,
                        isActive && styles.activePresetBadge,
                        { borderColor: isActive ? theme.primary : theme.outlineVariant }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.presetText, 
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionSubTitle}>THEMING</Text>
          </View>
          
          <View style={styles.card}>
            {APPEARANCE_SETTINGS.map((setting) => (
              <SettingItem 
                key={setting.id}
                icon={setting.icon}
                title={setting.title}
                subtitle={setting.subtitle}
                value={setting.value}
                onValueChange={setting.onValueChange}
                theme={theme}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Project onionAI</Text>
            <Text style={styles.sectionSubTitle}>BUILD INFO</Text>
          </View>
          
          <View style={styles.card}>
            {PROJECT_ACTIONS.map((action, index) => (
              <React.Fragment key={action.id}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => handleAction(action.id)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconWrapper}>
                      <MaterialIcons name={action.icon} size={18} color={theme.outline} />
                    </View>
                    <Text style={styles.itemTitle}>{action.title}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={theme.outline} />
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
  theme, 
  styles 
}: SettingItemProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={icon}
            size={18}
            color={theme.primary}
          />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemSub}>{subtitle}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceContainerHighest, true: theme.primaryContainer }}
        thumbColor={value ? theme.primary : theme.outline}
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: theme.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSubTitle: {
    color: theme.outline,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.outlineVariant || 'rgba(0, 0, 0, 0.1)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: theme.surfaceContainerHighest,
  },
  itemTitle: {
    color: theme.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSub: {
    color: theme.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.outlineVariant || 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  stepperContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepperTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperValue: {
    color: theme.primary,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: theme.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: theme.surfaceContainerHighest,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  visualTrack: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 2,
  },
  promptContainer: {
    padding: 16,
  },
  promptInput: {
    backgroundColor: theme.surfaceContainerHighest,
    borderColor: theme.outlineVariant,
    borderWidth: 1,
    borderRadius: 8,
    color: theme.onSurface,
    fontFamily: 'monospace',
    fontSize: 11,
    minHeight: 80,
    maxHeight: 120,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  presetsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  presetBadge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.surfaceContainerLow,
  },
  activePresetBadge: {
    backgroundColor: 'rgba(57, 81, 181, 0.05)',
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
