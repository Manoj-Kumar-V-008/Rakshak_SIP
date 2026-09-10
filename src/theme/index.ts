import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { typography, fontSizes, fontWeights } from './typography';
import { spacing, borderRadius, layout } from './spacing';
import { shadows, getPlatformShadow } from './shadows';

/**
 * Configure fonts for React Native Paper (MD3Theme integration)
 */
const paperFontConfig = {
  displayLarge: {
    fontSize: fontSizes.display,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
  },
  titleLarge: {
    fontSize: fontSizes.h1,
    lineHeight: 32,
    fontWeight: fontWeights.semiBold,
  },
  titleMedium: {
    fontSize: fontSizes.h2,
    lineHeight: 26,
    fontWeight: fontWeights.semiBold,
  },
  titleSmall: {
    fontSize: fontSizes.h3,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
  },
  bodyLarge: {
    fontSize: fontSizes.bodyLarge,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    fontSize: fontSizes.bodyMedium,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontSize: fontSizes.bodySmall,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  },
  labelLarge: {
    fontSize: fontSizes.button,
    lineHeight: 20,
    fontWeight: fontWeights.bold,
  },
  labelSmall: {
    fontSize: fontSizes.caption,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
  },
};

type CustomFonts = typeof typography;

/**
 * Rakshak AI Light Theme
 * Merged with React Native Paper MD3 standard configurations.
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.light.primary,
    secondary: colors.light.secondary,
    background: colors.light.background,
    surface: colors.light.surface,
    error: colors.light.danger,
    outline: colors.light.border,
    
    // Custom non-MD3 parameters mapped to our design tokens
    surfaceContainer: colors.light.surfaceContainer,
    safe: colors.light.safe,
    safeContainer: colors.light.safeContainer,
    warning: colors.light.warning,
    warningContainer: colors.light.warningContainer,
    danger: colors.light.danger,
    dangerContainer: colors.light.dangerContainer,
    textPrimary: colors.light.textPrimary,
    textSecondary: colors.light.textSecondary,
    textMuted: colors.light.textMuted,
  },
  fonts: configureFonts({ config: paperFontConfig }) as any as CustomFonts & ReturnType<typeof configureFonts>,
  spacing,
  borderRadius,
  layout,
  shadows,
  getShadow: (level: keyof typeof shadows) => getPlatformShadow(level, colors.light.shadow),
  dark: false,
};

/**
 * Rakshak AI Dark Theme
 * Merged with React Native Paper MD3 standard configurations.
 */
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.dark.primary,
    secondary: colors.dark.secondary,
    background: colors.dark.background,
    surface: colors.dark.surface,
    error: colors.dark.danger,
    outline: colors.dark.border,
    
    // Custom non-MD3 parameters mapped to our design tokens
    surfaceContainer: colors.dark.surfaceContainer,
    safe: colors.dark.safe,
    safeContainer: colors.dark.safeContainer,
    warning: colors.dark.warning,
    warningContainer: colors.dark.warningContainer,
    danger: colors.dark.danger,
    dangerContainer: colors.dark.dangerContainer,
    textPrimary: colors.dark.textPrimary,
    textSecondary: colors.dark.textSecondary,
    textMuted: colors.dark.textMuted,
  },
  fonts: configureFonts({ config: paperFontConfig }) as any as CustomFonts & ReturnType<typeof configureFonts>,
  spacing,
  borderRadius,
  layout,
  shadows,
  getShadow: (level: keyof typeof shadows) => getPlatformShadow(level, colors.dark.shadow),
  dark: true,
};

export type AppTheme = typeof lightTheme;
export { colors, typography, spacing, borderRadius, layout, shadows };
export default { lightTheme, darkTheme };
export type { ColorPalette, ColorTheme } from './colors';
