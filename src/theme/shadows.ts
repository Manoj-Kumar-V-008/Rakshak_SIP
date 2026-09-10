import { Platform, ViewStyle } from 'react-native';

/**
 * Rakshak AI Elevations & Shadows
 * Custom elevation scales designed to represent depth on both iOS and Android.
 * Leverages native shadows to preserve screen refresh rates and render speed.
 */

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ShadowPreset,
  
  low: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 2, // Android elevation
  } as ShadowPreset,
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6.27,
    elevation: 4, // Android elevation
  } as ShadowPreset,
  
  high: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10.32,
    elevation: 8, // Android elevation
  } as ShadowPreset,
};

/**
 * Helper to generate platform-specific shadow configurations
 * iOS maps shadow options while Android maps elevation numbers.
 */
export const getPlatformShadow = (
  level: keyof typeof shadows,
  shadowColorOverride?: string,
): ViewStyle => {
  const preset = shadows[level];
  if (Platform.OS === 'android') {
    return {
      elevation: preset.elevation,
    };
  }
  
  return {
    shadowColor: shadowColorOverride || preset.shadowColor,
    shadowOffset: preset.shadowOffset,
    shadowOpacity: preset.shadowOpacity,
    shadowRadius: preset.shadowRadius,
  };
};
export type ShadowPresetScale = typeof shadows;
