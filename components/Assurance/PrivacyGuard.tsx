import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export const PrivacyGuard: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <MaterialIcons name="shield" size={12} color={Colors.dark.tertiary} />
        <Text style={styles.badgeText}>100% On-Device</Text>
      </View>
      <View style={styles.badge}>
        <MaterialIcons name="lock" size={12} color={Colors.dark.primary} />
        <Text style={styles.badgeText}>Zero-Data Leak</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    color: Colors.dark.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
