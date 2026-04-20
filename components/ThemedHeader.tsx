import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface ThemedHeaderProps {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightIcons?: { name: keyof typeof MaterialIcons.glyphMap; onPress: () => void }[];
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({
  title,
  subtitle,
  showMenu = true,
  onMenuPress,
  rightIcons = [],
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showMenu && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <MaterialIcons name="menu" size={24} color={Colors.dark.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <View style={styles.subtitleContainer}>
                <View style={styles.pulseOrb} />
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {rightIcons.map((icon, index) => (
            <TouchableOpacity key={index} onPress={icon.onPress} style={styles.iconButton}>
              <MaterialIcons name={icon.name} size={24} color="#909090" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1b1b',
    zIndex: 50,
  },
  content: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif-medium',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pulseOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tertiary,
  },
});
