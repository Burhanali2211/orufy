import { useState, useEffect, useCallback, useMemo } from 'react';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto' | 'high-contrast' | 'custom';
export type ColorScheme = 'neutral' | 'warm' | 'cool' | 'vibrant' | 'monochrome';
export type FontScale = 'compact' | 'comfortable' | 'spacious';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type AnimationLevel = 'none' | 'reduced' | 'normal' | 'enhanced';

// Color palette structure
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
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    interactive: string;
  };
}

// Typography configuration
export interface TypographyConfig {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
    display: string[];
  };
  fontSize: Record<string, { size: string; lineHeight: string; letterSpacing?: string }>;
  fontWeight: Record<string, number>;
}

// Spacing configuration
export interface SpacingConfig {
  scale: number;
  base: number;
  sizes: Record<string, string>;
}

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  borderRadius: BorderRadius;
  animationLevel: AnimationLevel;
  fontScale: FontScale;
  customProperties: Record<string, string>;
}

// Theme preferences
export interface ThemePreferences {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontScale: FontScale;
  borderRadius: BorderRadius;
  animationLevel: AnimationLevel;
  highContrast: boolean;
  reducedMotion: boolean;
  customColors?: Partial<ColorPalette>;
  customTypography?: Partial<TypographyConfig>;
}

// Predefined color schemes
export const COLOR_SCHEMES: Record<ColorScheme, Partial<ColorPalette>> = {
  neutral: {
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#475569',
      600: '#334155',
      700: '#1e293b',
      900: '#020617'
    },
    secondary: {
      50: '#fafaf9',
      100: '#f5f5f4',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      900: '#1c1917'
    }
  },
  warm: {
    primary: {
      50: '#fef7ed',
      100: '#fdedd3',
      500: '#ea580c',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7c2d12'
    },
    secondary: {
      50: '#fefce8',
      100: '#fef3c7',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      900: '#713f12'
    }
  },
  cool: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      900: '#134e4a'
    }
  },
  vibrant: {
    primary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      900: '#581c87'
    },
    secondary: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d'
    }
  },
  monochrome: {
    primary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      900: '#111827'
    },
    secondary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      900: '#111827'
    }
  }
};

// Typography scales
export const TYPOGRAPHY_SCALES: Record<FontScale, TypographyConfig> = {
  compact: {
    fontFamily: {
      sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      display: ['Cormorant Garamond', 'Playfair Display', 'serif']
    },
    fontSize: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' }
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  comfortable: {
    fontFamily: {
      sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      display: ['Cormorant Garamond', 'Playfair Display', 'serif']
    },
    fontSize: {
      xs: { size: '0.8125rem', lineHeight: '1.125rem' },
      sm: { size: '0.9375rem', lineHeight: '1.375rem' },
      base: { size: '1.0625rem', lineHeight: '1.625rem' },
      lg: { size: '1.1875rem', lineHeight: '1.875rem' },
      xl: { size: '1.3125rem', lineHeight: '1.875rem' },
      '2xl': { size: '1.5625rem', lineHeight: '2.125rem' },
      '3xl': { size: '1.9375rem', lineHeight: '2.375rem' },
      '4xl': { size: '2.3125rem', lineHeight: '2.625rem' }
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacious: {
    fontFamily: {
      sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      display: ['Cormorant Garamond', 'Playfair Display', 'serif']
    },
    fontSize: {
      xs: { size: '0.875rem', lineHeight: '1.25rem' },
      sm: { size: '1rem', lineHeight: '1.5rem' },
      base: { size: '1.125rem', lineHeight: '1.75rem' },
      lg: { size: '1.25rem', lineHeight: '2rem' },
      xl: { size: '1.375rem', lineHeight: '2rem' },
      '2xl': { size: '1.625rem', lineHeight: '2.25rem' },
      '3xl': { size: '2rem', lineHeight: '2.5rem' },
      '4xl': { size: '2.375rem', lineHeight: '2.75rem' }
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

// Border radius configurations
export const BORDER_RADIUS_CONFIGS: Record<BorderRadius, Record<string, string>> = {
  none: {
    sm: '0px',
    default: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
    full: '0px'
  },
  small: {
    sm: '2px',
    default: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  medium: {
    sm: '4px',
    default: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  large: {
    sm: '6px',
    default: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px'
  },
  full: {
    sm: '9999px',
    default: '9999px',
    md: '9999px',
    lg: '9999px',
    xl: '9999px',
    full: '9999px'
  }
};

/**
 * Advanced theme system hook
 */
export const useAdvancedTheme = () => {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    if (typeof window === 'undefined') {
      return {
        mode: 'light',
        colorScheme: 'neutral',
        fontScale: 'comfortable',
        borderRadius: 'medium',
        animationLevel: 'normal',
        highContrast: false,
        reducedMotion: false
      };
    }

    return loadThemePreferences();
  });

  const [systemPreferences, setSystemPreferences] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        prefersDark: false,
        prefersReducedMotion: false,
        prefersHighContrast: false
      };
    }

    return detectSystemPreferences();
  });

  // Generate theme configuration - force light mode only
  const themeConfig = useMemo((): ThemeConfig => {
    const actualMode = 'light'; // Force light mode only

    // Defensive checks to prevent undefined errors
    const baseColors = COLOR_SCHEMES[preferences.colorScheme] || COLOR_SCHEMES.neutral;
    const typography = TYPOGRAPHY_SCALES[preferences.fontScale] || TYPOGRAPHY_SCALES.comfortable;
    const borderRadius = BORDER_RADIUS_CONFIGS[preferences.borderRadius] || BORDER_RADIUS_CONFIGS.medium;

    // Generate complete color palette
    const colors = generateColorPalette(baseColors, actualMode, preferences.highContrast);

    return {
      mode: actualMode,
      colorScheme: preferences.colorScheme,
      colors,
      typography,
      spacing: {
        scale: preferences.fontScale === 'compact' ? 0.875 : 
               preferences.fontScale === 'spacious' ? 1.125 : 1,
        base: 16,
        sizes: generateSpacingSizes(preferences.fontScale)
      },
      borderRadius: preferences.borderRadius,
      animationLevel: preferences.reducedMotion ? 'none' : preferences.animationLevel,
      fontScale: preferences.fontScale,
      customProperties: generateCustomProperties(colors, typography, borderRadius)
    };
  }, [preferences, systemPreferences]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      saveThemePreferences(newPreferences);
      return newPreferences;
    });
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    applyThemeToDOM(themeConfig);
  }, [themeConfig]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    const handleChange = () => {
      setSystemPreferences(detectSystemPreferences());
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  return {
    preferences,
    themeConfig,
    systemPreferences,
    updatePreferences,
    resetToDefaults: () => updatePreferences({
      mode: 'auto',
      colorScheme: 'neutral',
      fontScale: 'comfortable',
      borderRadius: 'medium',
      animationLevel: 'normal',
      highContrast: false,
      reducedMotion: false
    })
  };
};

/**
 * Load theme preferences from localStorage
 */
function loadThemePreferences(): ThemePreferences {
  try {
    const saved = localStorage.getItem('theme_preferences');
    if (saved) {
      return { ...getDefaultPreferences(), ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load theme preferences:', error);
  }

  return getDefaultPreferences();
}

/**
 * Save theme preferences to localStorage
 */
function saveThemePreferences(preferences: ThemePreferences): void {
  try {
    localStorage.setItem('theme_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save theme preferences:', error);
  }
}

/**
 * Get default theme preferences
 */
function getDefaultPreferences(): ThemePreferences {
  return {
    mode: 'auto',
    colorScheme: 'neutral',
    fontScale: 'comfortable',
    borderRadius: 'medium',
    animationLevel: 'normal',
    highContrast: false,
    reducedMotion: false
  };
}

/**
 * Detect system preferences
 */
function detectSystemPreferences() {
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches ||
                        window.matchMedia('(-ms-high-contrast: active)').matches ||
                        window.matchMedia('(forced-colors: active)').matches
  };
}

/**
 * Generate complete color palette
 */
function generateColorPalette(
  baseColors: Partial<ColorPalette> | undefined,
  mode: ThemeMode,
  highContrast: boolean
): ColorPalette {
  // This is a simplified implementation
  // In a real application, you would have more sophisticated color generation
  const isDark = false; // Force light mode only

  // Defensive fallback to neutral scheme if baseColors is undefined
  const safeBaseColors = baseColors || COLOR_SCHEMES.neutral;

  return {
    primary: safeBaseColors.primary || COLOR_SCHEMES.neutral.primary!,
    secondary: safeBaseColors.secondary || COLOR_SCHEMES.neutral.secondary!,
    accent: safeBaseColors.primary || COLOR_SCHEMES.neutral.primary!,
    neutral: COLOR_SCHEMES.neutral.primary!,
    semantic: {
      success: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d'
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309'
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c'
      },
      info: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      }
    },
    background: {
      primary: isDark ? '#0f172a' : '#ffffff',
      secondary: isDark ? '#1e293b' : '#f8fafc',
      tertiary: isDark ? '#334155' : '#f1f5f9',
      overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'
    },
    text: {
      primary: isDark ? '#f8fafc' : '#0f172a',
      secondary: isDark ? '#cbd5e1' : '#475569',
      tertiary: isDark ? '#94a3b8' : '#64748b',
      inverse: isDark ? '#0f172a' : '#f8fafc',
      disabled: isDark ? '#64748b' : '#94a3b8'
    },
    border: {
      subtle: isDark ? '#334155' : '#e2e8f0',
      default: isDark ? '#475569' : '#cbd5e1',
      strong: isDark ? '#64748b' : '#94a3b8',
      interactive: isDark ? '#3b82f6' : '#2563eb'
    }
  };
}

/**
 * Generate spacing sizes based on font scale
 */
function generateSpacingSizes(fontScale: FontScale): Record<string, string> {
  const multiplier = fontScale === 'compact' ? 0.875 : 
                    fontScale === 'spacious' ? 1.125 : 1;

  const base = 16 * multiplier;
  
  return {
    xs: `${base * 0.25}px`,
    sm: `${base * 0.5}px`,
    md: `${base * 1}px`,
    lg: `${base * 1.5}px`,
    xl: `${base * 2}px`,
    '2xl': `${base * 3}px`,
    '3xl': `${base * 4}px`,
    '4xl': `${base * 6}px`
  };
}

/**
 * Generate CSS custom properties
 */
function generateCustomProperties(
  colors: ColorPalette,
  typography: TypographyConfig,
  borderRadius: Record<string, string>
): Record<string, string> {
  const properties: Record<string, string> = {};

  // Color properties
  Object.entries(colors.background).forEach(([key, value]) => {
    properties[`--color-background-${key}`] = value;
  });

  Object.entries(colors.text).forEach(([key, value]) => {
    properties[`--color-text-${key}`] = value;
  });

  Object.entries(colors.border).forEach(([key, value]) => {
    properties[`--color-border-${key}`] = value;
  });

  // Typography properties
  properties['--font-family-sans'] = typography.fontFamily.sans.join(', ');
  properties['--font-family-serif'] = typography.fontFamily.serif.join(', ');
  properties['--font-family-mono'] = typography.fontFamily.mono.join(', ');

  // Border radius properties
  Object.entries(borderRadius).forEach(([key, value]) => {
    properties[`--border-radius-${key}`] = value;
  });

  return properties;
}

/**
 * Apply theme to DOM
 */
function applyThemeToDOM(themeConfig: ThemeConfig): void {
  const root = document.documentElement;

  // Apply custom properties
  Object.entries(themeConfig.customProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Apply theme class
  root.className = root.className.replace(/theme-\w+/g, '');
  root.classList.add(`theme-${themeConfig.mode}`);
  root.classList.add(`color-scheme-${themeConfig.colorScheme}`);
  root.classList.add(`font-scale-${themeConfig.fontScale}`);
  root.classList.add(`border-radius-${themeConfig.borderRadius}`);
  root.classList.add(`animation-${themeConfig.animationLevel}`);

  // Set color scheme for browser - force light mode
  root.style.colorScheme = 'light';
}
