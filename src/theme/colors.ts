/**
 * Rakshak AI Color Palette
 * Derived using HSL adjustments to secure optimal contrast ratios (WCAG 2.1 compliance)
 * and to communicate professional authority, trust, and protective safety.
 */

export const colors = {
  light: {
    background: '#F8FAFC',       // Clean Ice Silver canvas
    surface: '#FFFFFF',          // Pure White cards
    surfaceContainer: '#F1F5F9', // Elevated surface groupings
    
    // Core Brand Accents
    primary: '#1B4965',          // Guard Blue (Primary Brand Color)
    secondary: '#3A86C8',        // Accent Electric Cobalt
    primaryContainer: '#E0F2FE',  // Light Blue backdrop container
    
    // Semantic Status Indicators
    safe: '#10B981',             // Emerald Green
    safeContainer: '#D1FAE5',    // Soft Emerald backdrop
    warning: '#D97706',          // Darker Amber Orange for light theme readability
    warningContainer: '#FEF3C7',  // Soft Amber backdrop
    danger: '#DC2626',           // Coral/Dark Red for light theme readability
    dangerContainer: '#FEE2E2',  // Soft Coral backdrop
    
    // Typography Colors
    textPrimary: '#0F172A',      // Slate Dark Grey
    textSecondary: '#475569',    // Slate Medium Grey
    textMuted: '#94A3B8',        // Slate Light Grey
    
    // Borders & Dividers
    border: '#E2E8F0',           // Thin layout separation line
    borderFocus: '#3A86C8',      // Active focus border
    shadow: '#0F172A',
  },
  
  dark: {
    background: '#0B0F19',       // Deep night blue canvas
    surface: '#151D30',          // Muted dark panel background
    surfaceContainer: '#1E2942', // Inner elevated surface
    
    // Core Brand Accents
    primary: '#3F8CFF',          // Bright Shield Blue (Primary Brand Color)
    secondary: '#8884FF',        // Accent Electric Violet
    primaryContainer: '#1E293B',  // Muted blue-grey backdrop
    
    // Semantic Status Indicators
    safe: '#10B981',             // Emerald Green
    safeContainer: '#064E3B',    // Deep Emerald backdrop
    warning: '#F59E0B',          // Vibrant Amber Orange
    warningContainer: '#78350F',  // Deep Amber backdrop
    danger: '#EF4444',           // Coral Red
    dangerContainer: '#7F1D1D',  // Deep Red backdrop
    
    // Typography Colors
    textPrimary: '#F8FAFC',      // Crisp light grey body text
    textSecondary: '#94A3B8',    // Muted grey subheadings
    textMuted: '#64748B',        // Muted dark grey captions
    
    // Borders & Dividers
    border: '#2A3654',           // Slate Dark border
    borderFocus: '#3F8CFF',      // Active focus border
    shadow: '#000000',
  }
};

export type ColorPalette = typeof colors.light;
export type ColorTheme = keyof typeof colors;
