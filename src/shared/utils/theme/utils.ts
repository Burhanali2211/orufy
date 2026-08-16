import { ColorPalette, ThemeMode, FontScale, TypographyConfig, ThemeConfig, ThemePreferences } from './types';
import { COLOR_SCHEMES } from './constants';

export const detectSystemPreferences = () => {
  if (typeof window === 'undefined') return { prefersDark: false, prefersReducedMotion: false, prefersHighContrast: false };
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches || window.matchMedia('(forced-colors: active)').matches
  };
};

export const generateColorPalette = (baseColors: Partial<ColorPalette> | undefined, _mode: ThemeMode, _highContrast: boolean): ColorPalette => {
  const isDark = false; // Force light mode
  const safeBase = baseColors || COLOR_SCHEMES.neutral;
  const neutral = COLOR_SCHEMES.neutral.primary!;
  return {
    primary: safeBase.primary || neutral, secondary: safeBase.secondary || neutral, accent: safeBase.primary || neutral, neutral,
    semantic: {
      success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
      warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      error: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
      info: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' }
    },
    background: { primary: isDark ? '#0f172a' : '#ffffff', secondary: isDark ? '#1e293b' : '#f8fafc', tertiary: isDark ? '#334155' : '#f1f5f9', overlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' },
    text: { primary: isDark ? '#f8fafc' : '#0f172a', secondary: isDark ? '#cbd5e1' : '#475569', tertiary: isDark ? '#94a3b8' : '#64748b', inverse: isDark ? '#0f172a' : '#f8fafc', disabled: isDark ? '#64748b' : '#94a3b8' },
    border: { subtle: isDark ? '#334155' : '#e2e8f0', default: isDark ? '#475569' : '#cbd5e1', strong: isDark ? '#64748b' : '#94a3b8', interactive: isDark ? '#3b82f6' : '#2563eb' }
  };
};

export const generateSpacingSizes = (scale: FontScale): Record<string, string> => {
  const m = scale === 'compact' ? 0.875 : scale === 'spacious' ? 1.125 : 1;
  const b = 16 * m;
  return { xs: `${b*0.25}px`, sm: `${b*0.5}px`, md: `${b}px`, lg: `${b*1.5}px`, xl: `${b*2}px`, '2xl': `${b*3}px`, '3xl': `${b*4}px`, '4xl': `${b*6}px` };
};

export const generateCustomProperties = (colors: ColorPalette, typography: TypographyConfig, borderRadius: Record<string, string>): Record<string, string> => {
  const props: Record<string, string> = {};
  Object.entries(colors.background).forEach(([k, v]) => props[`--color-background-${k}`] = v);
  Object.entries(colors.text).forEach(([k, v]) => props[`--color-text-${k}`] = v);
  Object.entries(colors.border).forEach(([k, v]) => props[`--color-border-${k}`] = v);
  props['--font-family-sans'] = typography.fontFamily.sans.join(', ');
  props['--font-family-serif'] = typography.fontFamily.serif.join(', ');
  props['--font-family-mono'] = typography.fontFamily.mono.join(', ');
  Object.entries(borderRadius).forEach(([k, v]) => props[`--border-radius-${k}`] = v);
  return props;
};

export const applyThemeToDOM = (config: ThemeConfig): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(config.customProperties).forEach(([p, v]) => root.style.setProperty(p, v));
  root.className = root.className.replace(/theme-\w+|color-scheme-\w+|font-scale-\w+|border-radius-\w+|animation-\w+/g, '').trim();
  root.classList.add(`theme-${config.mode}`, `color-scheme-${config.colorScheme}`, `font-scale-${config.fontScale}`, `border-radius-${config.borderRadius}`, `animation-${config.animationLevel}`);
  root.style.colorScheme = 'light';
};

export const getDefaultPreferences = (): ThemePreferences => ({ mode: 'auto', colorScheme: 'neutral', fontScale: 'comfortable', borderRadius: 'medium', animationLevel: 'normal', highContrast: false, reducedMotion: false });

export const loadThemePreferences = (): ThemePreferences => {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme_preferences') : null;
    return saved ? { ...getDefaultPreferences(), ...JSON.parse(saved) } : getDefaultPreferences();
  } catch { return getDefaultPreferences(); }
};

export const saveThemePreferences = (prefs: ThemePreferences): void => {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('theme_preferences', JSON.stringify(prefs)); }
  catch (e) { console.warn('Save theme fail', e); }
};
