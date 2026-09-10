import { TextStyle } from 'react-native';

/**
 * Rakshak AI Typography Configuration
 * Tailored for high readability on varying screen densities.
 * Focuses on comfortable line-heights to support elderly users.
 */

export const fontSizes = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 18,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  caption: 10,
  button: 16,
};

export const lineHeights = {
  display: 40,
  h1: 32,
  h2: 26,
  h3: 24,
  bodyLarge: 22,
  bodyMedium: 20,
  bodySmall: 16,
  caption: 14,
  button: 20,
};

export const fontWeights = {
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export interface TypographyPreset {
  fontSize: number;
  lineHeight: number;
  fontWeight: typeof fontWeights[keyof typeof fontWeights];
}

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.bold,
  },
  h1: {
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.h1,
    fontWeight: fontWeights.semiBold,
  },
  h2: {
    fontSize: fontSizes.h2,
    lineHeight: lineHeights.h2,
    fontWeight: fontWeights.semiBold,
  },
  h3: {
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    fontWeight: fontWeights.medium,
  },
  bodyLarge: {
    fontSize: fontSizes.bodyLarge,
    lineHeight: lineHeights.bodyLarge,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    fontSize: fontSizes.bodyMedium,
    lineHeight: lineHeights.bodyMedium,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontSize: fontSizes.bodySmall,
    lineHeight: lineHeights.bodySmall,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.medium,
  },
  buttonText: {
    fontSize: fontSizes.button,
    lineHeight: lineHeights.button,
    fontWeight: fontWeights.bold,
  },
};
