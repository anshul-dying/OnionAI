import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { ThemedHeader } from '@/components/ThemedHeader';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
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
            <SettingItem 
              icon="memory" 
              title="GPU Acceleration" 
              subtitle="Use hardware acceleration if available" 
              value={true} 
            />
            <SettingDivider />
            <SettingItem 
              icon="security" 
              title="Privacy Guard" 
              subtitle="Encrypt local weights and history" 
              value={true} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialIcons name="palette" size={24} color={Colors.dark.primary} style={styles.itemIcon} />
                <View>
                  <Text style={styles.itemTitle}>Holographic Theme</Text>
                  <Text style={styles.itemSub}>Enable premium visual effects</Text>
                </View>
              </View>
              <Switch 
                value={true} 
                trackColor={{ false: '#353534', true: Colors.dark.primaryContainer }}
                thumbColor={true ? Colors.dark.primary : '#8f909e'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project onionAI</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="info" size={24} color={Colors.dark.outline} style={styles.itemIcon} />
              <Text style={styles.itemTitle}>About Version 1.0.4</Text>
            </TouchableOpacity>
            <SettingDivider />
            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="update" size={24} color={Colors.dark.outline} style={styles.itemIcon} />
              <Text style={styles.itemTitle}>Check for Updates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const SettingItem = ({ icon, title, subtitle, value }: any) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLabel}>
      <MaterialIcons name={icon} size={24} color={Colors.dark.tertiary} style={styles.itemIcon} />
      <View>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{subtitle}</Text>
      </View>
    </View>
    <Switch 
      value={value} 
      trackColor={{ false: '#353534', true: Colors.dark.tertiaryContainer }}
      thumbColor={value ? Colors.dark.tertiary : '#8f909e'}
    />
  </View>
);

const SettingDivider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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
