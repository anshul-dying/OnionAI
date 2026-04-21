import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ThemedHeader } from '@/components/ThemedHeader';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface ToggleSetting {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  enabled: boolean;
  accent: 'primary' | 'tertiary';
}

interface ActionSetting {
  id: string;
  icon: IconName;
  title: string;
}

const MODEL_PREFERENCES: ToggleSetting[] = [
  {
    id: 'gpu-acceleration',
    icon: 'memory',
    title: 'GPU Acceleration',
    subtitle: 'Use hardware acceleration if available',
    enabled: true,
    accent: 'tertiary',
  },
  {
    id: 'privacy-guard',
    icon: 'security',
    title: 'Privacy Guard',
    subtitle: 'Encrypt local weights and history',
    enabled: true,
    accent: 'tertiary',
  },
];

const APPEARANCE_SETTINGS: ToggleSetting[] = [
  {
    id: 'holographic-theme',
    icon: 'palette',
    title: 'Holographic Theme',
    subtitle: 'Enable premium visual effects',
    enabled: true,
    accent: 'primary',
  },
];

const PROJECT_ACTIONS: ActionSetting[] = [
  { id: 'about', icon: 'info', title: 'About Version 1.0.4' },
  { id: 'updates', icon: 'update', title: 'Check for Updates' },
];

export default function SettingsScreen() {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <ThemedHeader 
        title="Settings" 
        showMenu={false}
      />
      
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Preferences</Text>
          <View style={styles.card}>
            {MODEL_PREFERENCES.map((setting, index) => (
              <React.Fragment key={setting.id}>
                <SettingItem setting={setting} />
                {index < MODEL_PREFERENCES.length - 1 ? <SettingDivider /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            {APPEARANCE_SETTINGS.map((setting) => (
              <SettingItem key={setting.id} setting={setting} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project onionAI</Text>
          <View style={styles.card}>
            {PROJECT_ACTIONS.map((action, index) => (
              <React.Fragment key={action.id}>
                <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
                  <MaterialIcons name={action.icon} size={24} color={Colors.dark.outline} style={styles.itemIcon} />
                  <Text style={styles.itemTitle}>{action.title}</Text>
                </TouchableOpacity>
                {index < PROJECT_ACTIONS.length - 1 ? <SettingDivider /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ setting }: { setting: ToggleSetting }) {
  const activeTrackColor =
    setting.accent === 'primary' ? Colors.dark.primaryContainer : Colors.dark.tertiaryContainer;
  const activeThumbColor = setting.accent === 'primary' ? Colors.dark.primary : Colors.dark.tertiary;

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <MaterialIcons
          name={setting.icon}
          size={24}
          color={setting.accent === 'primary' ? Colors.dark.primary : Colors.dark.tertiary}
          style={styles.itemIcon}
        />
        <View>
          <Text style={styles.itemTitle}>{setting.title}</Text>
          <Text style={styles.itemSub}>{setting.subtitle}</Text>
        </View>
      </View>
      <Switch 
        value={setting.enabled} 
        trackColor={{ false: '#353534', true: activeTrackColor }}
        thumbColor={setting.enabled ? activeThumbColor : '#8f909e'}
        disabled
      />
    </View>
  );
}

const SettingDivider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.dark.outline,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.dark.surfaceContainerLow,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: Colors.dark.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSub: {
    color: Colors.dark.onSurfaceVariant,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
  },
});
