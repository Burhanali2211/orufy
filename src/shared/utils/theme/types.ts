export type ThemeMode = 'light' | 'dark' | 'auto' | 'high-contrast' | 'custom';
export type ColorScheme = 'neutral' | 'warm' | 'cool' | 'vibrant' | 'monochrome';
export type FontScale = 'compact' | 'comfortable' | 'spacious';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type AnimationLevel = 'none' | 'reduced' | 'normal' | 'enhanced';

export interface ColorPalette {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  neutral: Record<string, string>;
  semantic: {
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    info: Record<string, string>;
  };
  background: {
    primary: string; secondary: string; tertiary: string; overlay: string;
  };
  text: {
    primary: string; secondary: string; tertiary: string; inverse: string; disabled: string;
  };
  border: {
    subtle: string; default: string; strong: string; interactive: string;
  };
}

export interface TypographyConfig {
  fontFamily: { sans: string[]; serif: string[]; mono: string[]; display: string[]; };
  fontSize: Record<string, { size: string; lineHeight: string; letterSpacing?: string }>;
  fontWeight: Record<string, number>;
}

export interface SpacingConfig {
  scale: number; base: number; sizes: Record<string, string>;
}

export interface ThemeConfig {
  mode: ThemeMode; colorScheme: ColorScheme; colors: ColorPalette; typography: TypographyConfig;
  spacing: SpacingConfig; borderRadius: BorderRadius; animationLevel: AnimationLevel;
  fontScale: FontScale; customProperties: Record<string, string>;
}

export interface ThemePreferences {
  mode: ThemeMode; colorScheme: ColorScheme; fontScale: FontScale; borderRadius: BorderRadius;
  animationLevel: AnimationLevel; highContrast: boolean; reducedMotion: boolean;
  customColors?: Partial<ColorPalette>; customTypography?: Partial<TypographyConfig>;
}
