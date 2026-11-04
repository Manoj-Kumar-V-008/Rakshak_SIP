/**
 * Rakshak AI Color Palette
 * Modern, accessible design system with slate/navy foundation.
 * Dark mode is deep but not oppressive; light mode is clean and crisp.
 */

export const colors = {
  light: {
    background: '#F8FAFC',       // Clean ice silver
    surface: '#FFFFFF',          // Pure white cards
    surfaceContainer: '#F1F5F9', // Elevated surface groupings

    // Core Brand Accents - Modern blue
    primary: '#2563EB',          // Guard Blue (Primary Brand Color)
    primaryHover: '#1D4ED8',
    secondary: '#64748B',        // Slate secondary
    primaryContainer: '#EFF6FF', // Light blue backdrop container

    // Semantic Status Indicators
    safe: '#10B981',             // Emerald Green
    safeContainer: '#D1FAE5',    // Soft Emerald backdrop
    warning: '#D97706',          // Amber for light theme
    warningContainer: '#FEF3C7', // Soft Amber backdrop
    danger: '#DC2626',           // Red for light theme
    dangerContainer: '#FEE2E2',  // Soft Coral backdrop

    // Typography Colors
    textPrimary: '#0F172A',      // Slate Dark Grey
    textSecondary: '#475569',    // Slate Medium Grey
    textMuted: '#94A3B8',        // Slate Light Grey
    textInverse: '#FFFFFF',      // White text on dark surfaces

    // Borders & Dividers
    border: '#E2E8F0',           // Thin layout separation line
    borderFocus: '#2563EB',      // Active focus border
    shadow: '#0F172A',
  },

  dark: {
    background: '#0F172A',       // Slate 900 - deep but readable
    surface: '#1E293B',          // Slate 800 - card backgrounds
    surfaceContainer: '#334155', // Slate 700 - inner elevated surfaces

    // Core Brand Accents - Brighter for dark mode
    primary: '#3B82F6',          // Bright Shield Blue
    primaryHover: '#60A5FA',
    secondary: '#94A3B8',        // Slate secondary
    primaryContainer: '#1E3A8A', // Deep blue-grey backdrop

    // Semantic Status Indicators
    safe: '#34D399',             // Brighter Emerald for dark mode
    safeContainer: '#064E3B',    // Deep Emerald backdrop
    warning: '#FBBF24',          // Brighter Amber for dark mode
    warningContainer: '#78350F', // Deep Amber backdrop
    danger: '#F87171',           // Brighter Red for dark mode
    dangerContainer: '#7F1D1D',  // Deep Red backdrop

    // Typography Colors
    textPrimary: '#F8FAFC',      // Crisp light grey
    textSecondary: '#CBD5E1',    // Muted slate
    textMuted: '#64748B',        // Muted dark grey captions
    textInverse: '#0F172A',      // Dark text on light surfaces

    // Borders & Dividers
    border: '#334155',           // Slate 700 border
    borderFocus: '#3B82F6',      // Active focus border
    shadow: '#000000',
  },
};

export type ColorPalette = typeof colors.light;
export type ColorTheme = keyof typeof colors;
