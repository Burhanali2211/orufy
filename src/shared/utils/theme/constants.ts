import { ColorScheme, ColorPalette, FontScale, TypographyConfig, BorderRadius } from './types';

export const COLOR_SCHEMES: Record<ColorScheme, Partial<ColorPalette>> = {
  neutral: {
    primary: { 50: '#f8fafc', 100: '#f1f5f9', 500: '#475569', 600: '#334155', 700: '#1e293b', 900: '#020617' },
    secondary: { 50: '#fafaf9', 100: '#f5f5f4', 500: '#78716c', 600: '#57534e', 700: '#44403c', 900: '#1c1917' }
  },
  warm: {
    primary: { 50: '#fef7ed', 100: '#fdedd3', 500: '#ea580c', 600: '#dc2626', 700: '#b91c1c', 900: '#7c2d12' },
    secondary: { 50: '#fefce8', 100: '#fef3c7', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 900: '#713f12' }
  },
  cool: {
    primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
    secondary: { 50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 900: '#134e4a' }
  },
  vibrant: {
    primary: { 50: '#fdf4ff', 100: '#fae8ff', 500: '#a855f7', 600: '#9333ea', 700: '#7c3aed', 900: '#581c87' },
    secondary: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 900: '#7f1d1d' }
  },
  monochrome: {
    primary: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 900: '#111827' },
    secondary: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 900: '#111827' }
  }
};

export const TYPOGRAPHY_SCALES: Record<FontScale, TypographyConfig> = {
  compact: {
    fontFamily: { sans: ['Roboto', 'Inter', 'sans-serif'], serif: ['Playfair Display', 'serif'], mono: ['JetBrains Mono', 'monospace'], display: ['Cormorant Garamond', 'serif'] },
    fontSize: { xs: { size: '0.75rem', lineHeight: '1rem' }, sm: { size: '0.875rem', lineHeight: '1.25rem' }, base: { size: '1rem', lineHeight: '1.5rem' }, lg: { size: '1.125rem', lineHeight: '1.75rem' }, xl: { size: '1.25rem', lineHeight: '1.75rem' }, '2xl': { size: '1.5rem', lineHeight: '2rem' }, '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, '4xl': { size: '2.25rem', lineHeight: '2.5rem' } },
    fontWeight: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 }
  },
  comfortable: {
    fontFamily: { sans: ['Roboto', 'Inter', 'sans-serif'], serif: ['Playfair Display', 'serif'], mono: ['JetBrains Mono', 'monospace'], display: ['Cormorant Garamond', 'serif'] },
    fontSize: { xs: { size: '0.8125rem', lineHeight: '1.125rem' }, sm: { size: '0.9375rem', lineHeight: '1.375rem' }, base: { size: '1.0625rem', lineHeight: '1.625rem' }, lg: { size: '1.1875rem', lineHeight: '1.875rem' }, xl: { size: '1.3125rem', lineHeight: '1.875rem' }, '2xl': { size: '1.5625rem', lineHeight: '2.125rem' }, '3xl': { size: '1.9375rem', lineHeight: '2.375rem' }, '4xl': { size: '2.3125rem', lineHeight: '2.625rem' } },
    fontWeight: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 }
  },
  spacious: {
    fontFamily: { sans: ['Roboto', 'Inter', 'sans-serif'], serif: ['Playfair Display', 'serif'], mono: ['JetBrains Mono', 'monospace'], display: ['Cormorant Garamond', 'serif'] },
    fontSize: { xs: { size: '0.875rem', lineHeight: '1.25rem' }, sm: { size: '1rem', lineHeight: '1.5rem' }, base: { size: '1.125rem', lineHeight: '1.75rem' }, lg: { size: '1.25rem', lineHeight: '2rem' }, xl: { size: '1.375rem', lineHeight: '2rem' }, '2xl': { size: '1.625rem', lineHeight: '2.25rem' }, '3xl': { size: '2rem', lineHeight: '2.5rem' }, '4xl': { size: '2.375rem', lineHeight: '2.75rem' } },
    fontWeight: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 }
  }
};

export const BORDER_RADIUS_CONFIGS: Record<BorderRadius, Record<string, string>> = {
  none: { sm: '0px', default: '0px', md: '0px', lg: '0px', xl: '0px', full: '0px' },
  small: { sm: '2px', default: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
  medium: { sm: '4px', default: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  large: { sm: '6px', default: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px' },
  full: { sm: '9999px', default: '9999px', md: '9999px', lg: '9999px', xl: '9999px', full: '9999px' }
};
