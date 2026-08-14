import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemePreferences, ThemeConfig } from './types';
import { COLOR_SCHEMES, TYPOGRAPHY_SCALES, BORDER_RADIUS_CONFIGS } from './constants';
import { loadThemePreferences, detectSystemPreferences, generateColorPalette, generateSpacingSizes, generateCustomProperties, applyThemeToDOM, saveThemePreferences, getDefaultPreferences } from './utils';

export const useAdvancedTheme = () => {
  const [preferences, setPreferences] = useState<ThemePreferences>(loadThemePreferences);
  const [systemPreferences, setSystemPreferences] = useState(detectSystemPreferences);

  const themeConfig = useMemo((): ThemeConfig => {
    const actualMode = 'light'; // Force light mode
    const baseColors = COLOR_SCHEMES[preferences.colorScheme] || COLOR_SCHEMES.neutral;
    const typography = TYPOGRAPHY_SCALES[preferences.fontScale] || TYPOGRAPHY_SCALES.comfortable;
    const borderRadius = BORDER_RADIUS_CONFIGS[preferences.borderRadius] || BORDER_RADIUS_CONFIGS.medium;
    const colors = generateColorPalette(baseColors, actualMode, preferences.highContrast);

    return {
      mode: actualMode, colorScheme: preferences.colorScheme, colors, typography,
      spacing: {
        scale: preferences.fontScale === 'compact' ? 0.875 : preferences.fontScale === 'spacious' ? 1.125 : 1,
        base: 16, sizes: generateSpacingSizes(preferences.fontScale)
      },
      borderRadius: preferences.borderRadius, fontScale: preferences.fontScale,
      animationLevel: preferences.reducedMotion ? 'none' : preferences.animationLevel,
      customProperties: generateCustomProperties(colors, typography, borderRadius)
    };
  }, [preferences, systemPreferences]);

  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      saveThemePreferences(next);
      return next;
    });
  }, []);

  useEffect(() => { applyThemeToDOM(themeConfig); }, [themeConfig]);

  useEffect(() => {
    const handle = () => setSystemPreferences(detectSystemPreferences());
    const mqs = [window.matchMedia('(prefers-color-scheme: dark)'), window.matchMedia('(prefers-reduced-motion: reduce)'), window.matchMedia('(prefers-contrast: high)')];
    mqs.forEach(mq => mq.addEventListener('change', handle));
    return () => mqs.forEach(mq => mq.removeEventListener('change', handle));
  }, []);

  return {
    preferences, themeConfig, systemPreferences, updatePreferences,
    resetToDefaults: () => updatePreferences(getDefaultPreferences())
  };
};
