/**
 * Rakshak AI Spacing & Layout Tokens
 * Built upon a strict 4px grid system.
 * Governs layout margins, padding steps, border radius constants, and touch targets.
 */

export const spacing = {
  none: 0,
  xxs: 4,      // Visual fine adjustments
  xs: 8,       // List margins, inner badges
  sm: 12,      // Component group separations
  md: 16,      // Primary screen canvas margin, inner card margins
  lg: 24,      // Large section layout padding
  xl: 32,      // Major header spacers
  xxl: 48,     // Extended bottom-screen alignments
  xxxl: 64,    // Specialized splash and onboarding spacer
};

export const layout = {
  screenMargin: spacing.md,
  cardPadding: spacing.md,
  sectionGap: spacing.lg,
  
  // Mobile Interaction Dimensions (Accessibility Standards)
  minTouchTargetSize: 48,
  defaultInputHeight: 52,
  defaultButtonHeight: 50,
};

export const borderRadius = {
  none: 0,
  small: 4,    // Small buttons, badges
  medium: 8,   // Main action buttons, inputs
  large: 12,   // Card modules, dialog panels
  extraLarge: 16, // Top-sheet alerts, onboarding content blocks
  full: 9999,  // Circular avatars, fully rounded badges
};

export type SpacingScale = typeof spacing;
export type BorderRadiusScale = typeof borderRadius;
