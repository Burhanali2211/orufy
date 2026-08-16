import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import {
  useAdvancedTheme,
  ThemeConfig,
  ThemePreferences,
  ThemeMode,
  ColorScheme,
  FontScale,
  BorderRadius,
  AnimationLevel
} from '../utils/advancedThemeSystem';

// Re-export types for convenience
export type {
  ThemeMode,
  ColorScheme,
  FontScale,
  BorderRadius,
  AnimationLevel,
  ThemeConfig,
  ThemePreferences
};

interface ThemeContextType {
  // Current theme configuration
  themeConfig: ThemeConfig;

  // User preferences
  preferences: ThemePreferences;

  // System preferences
  systemPreferences: {
    prefersDark: boolean;
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
  };

  // Theme controls
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontScale: (scale: FontScale) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setAnimationLevel: (level: AnimationLevel) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;

  // Utility functions
  updatePreferences: (updates: Partial<ThemePreferences>) => void;
  resetToDefaults: () => void;

  // Legacy compatibility
  theme: ThemeMode;
  actualTheme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeData = useAdvancedTheme();

  const {
    preferences,
    themeConfig,
    systemPreferences,
    updatePreferences,
    resetToDefaults
  } = themeData;

  // Theme control functions
  const setMode = (mode: ThemeMode) => updatePreferences({ mode });
  const setColorScheme = (colorScheme: ColorScheme) => updatePreferences({ colorScheme });
  const setFontScale = (fontScale: FontScale) => updatePreferences({ fontScale });
  const setBorderRadius = (borderRadius: BorderRadius) => updatePreferences({ borderRadius });
  const setAnimationLevel = (animationLevel: AnimationLevel) => updatePreferences({ animationLevel });
  const toggleHighContrast = () => updatePreferences({ highContrast: !preferences.highContrast });
  const toggleReducedMotion = () => updatePreferences({ reducedMotion: !preferences.reducedMotion });

  // Announce theme changes to screen readers
  useEffect(() => {
    const announcement = `Theme changed to ${themeConfig.mode} mode with ${themeConfig.colorScheme} color scheme`;

    // Create temporary announcement element
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  }, [themeConfig.mode, themeConfig.colorScheme]);

  const contextValue: ThemeContextType = {
    themeConfig,
    preferences,
    systemPreferences,
    setMode,
    setColorScheme,
    setFontScale,
    setBorderRadius,
    setAnimationLevel,
    toggleHighContrast,
    toggleReducedMotion,
    updatePreferences,
    resetToDefaults,

    // Legacy compatibility
    theme: themeConfig.mode,
    actualTheme: themeConfig.mode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
