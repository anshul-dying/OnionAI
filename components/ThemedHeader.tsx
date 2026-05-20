import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-color';

interface ThemedHeaderProps {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  menuIcon?: keyof typeof MaterialIcons.glyphMap;
  onMenuPress?: () => void;
  rightIcons?: { name: keyof typeof MaterialIcons.glyphMap; onPress: () => void }[];
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({
  title,
  subtitle,
  showMenu = true,
  menuIcon = 'menu',
  onMenuPress,
  rightIcons = [],
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Premium micro-animation: dynamic pulse loop
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.surfaceContainerLow }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showMenu && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <MaterialIcons name={menuIcon} size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.primary }]}>{title}</Text>
            {subtitle && (
              <View style={styles.subtitleContainer}>
                <Animated.View style={[styles.pulseOrb, { backgroundColor: theme.tertiary, opacity: pulseAnim }]} />
                <Text style={[styles.subtitle, { color: theme.tertiary }]}>{subtitle}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {rightIcons.map((icon, index) => (
            <TouchableOpacity key={index} onPress={icon.onPress} style={styles.iconButton}>
              <MaterialIcons name={icon.name} size={24} color={theme.outline} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pulseOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
