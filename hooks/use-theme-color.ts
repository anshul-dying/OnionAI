/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/hooks/SettingsContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  let themeMode: 'light' | 'dark' | 'system' = 'dark';
  try {
    const settings = useSettings();
    themeMode = settings.themeMode;
  } catch (e) {
    // Fallback if rendered outside of provider (e.g., during tests or static compilation)
    themeMode = 'dark';
  }

  const systemTheme = useColorScheme() ?? 'light';
  const activeTheme = themeMode === 'system' ? systemTheme : themeMode;
  const colorFromProps = props[activeTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[activeTheme][colorName];
  }
}

export function useTheme() {
  let themeMode: 'light' | 'dark' | 'system' = 'dark';
  try {
    const settings = useSettings();
    themeMode = settings.themeMode;
  } catch (e) {
    // Fallback if rendered outside of provider
    themeMode = 'dark';
  }

  const systemTheme = useColorScheme() ?? 'dark';
  const activeTheme = themeMode === 'system' ? systemTheme : themeMode;
  return Colors[activeTheme];
}
