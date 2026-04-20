/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const palette = {
  primary: '#bac3ff',
  onPrimary: '#08218a',
  primaryContainer: '#3f51b5',
  onPrimaryContainer: '#cacfff',
  secondary: '#c8c6c5',
  onSecondary: '#303030',
  secondaryContainer: '#474746',
  onSecondaryContainer: '#b7b5b4',
  tertiary: '#00daf3',
  onTertiary: '#00363d',
  tertiaryContainer: '#006470',
  onTertiaryContainer: '#31e6ff',
  background: '#131313',
  onBackground: '#e5e2e1',
  surface: '#131313',
  onSurface: '#e5e2e1',
  surfaceVariant: '#353534',
  onSurfaceVariant: '#c5c5d4',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353534',
  outline: '#8f909e',
  outlineVariant: '#454652',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
};

export const Colors = {
  light: {
    ...palette,
    text: palette.onBackground,
    tint: palette.primary,
    icon: palette.outline,
    tabIconDefault: palette.outline,
    tabIconSelected: palette.primary,
  },
  dark: {
    ...palette,
    text: palette.onBackground,
    tint: palette.primary,
    icon: palette.outline,
    tabIconDefault: palette.outline,
    tabIconSelected: palette.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
