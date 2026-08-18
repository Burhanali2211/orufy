import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface HeroSlide {
  id?: string;
  image?: string;
  topTitle?: string;
  titleMain: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  accentColor?: string;
  overlayOpacity?: number;
}

export interface StorefrontHero {
  layout?: 'carousel' | 'split' | 'minimal' | 'immersive';
  topTitle?: string;
  titleMain?: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
  slides?: HeroSlide[];
  intervalSeconds?: number;
  transitionEffect?: 'slide' | 'fade' | 'zoom' | 'parallax';
  fontFamily?: string;
  fontSizeScale?: 'compact' | 'standard' | 'large' | 'massive';
  contentAlign?: 'left' | 'center' | 'right';
  contentPosition?: 'center-left' | 'center' | 'bottom-left' | 'top-left';
  buttonShape?: 'sharp' | 'subtle' | 'rounded' | 'pill';
  buttonSize?: 'sm' | 'md' | 'lg' | 'xl';
  buttonStyle?: 'solid' | 'glass' | 'gradient' | 'outline' | 'tonal';
  overlayPreset?: 'dark_gradient' | 'light_gradient' | 'radial_spotlight' | 'glass_frost' | 'none';
  overlayOpacity?: number;
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light';
  pauseOnHover?: boolean;
}

export interface ThemeSection {
  id: string;
  name: string;
  enabled: boolean;
  icon?: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
}

export interface ThemeHeaderConfig {
  layout: 'standard' | 'centered' | 'minimal';
  logoHeight: number;
  sticky: boolean;
  showAnnouncement: boolean;
  announcementText: string;
  announcementBg: string;
  announcementTextCol: string;
}

export interface ThemeFooterConfig {
  aboutText: string;
  showNewsletter: boolean;
  showTrustBadges: boolean;
  copyrightText: string;
}

export interface StorefrontThemeStudio {
  sections: ThemeSection[];
  palette: ThemePalette;
  typography: ThemeTypography;
  header: ThemeHeaderConfig;
  footer: ThemeFooterConfig;
}

export interface StorefrontIdentity {
  id?: string;
  name: string;
  siteName: string;
  logo: string;
  favicon: string;
  announcementBar: string;
}

export interface StorefrontBranding {
  primary: string;
  accent: string;
  typography: string;
}

export interface StorefrontCommerce {
  currency: string;
  taxRatePct: number;
  shippingFeePaise: number;
  freeShippingThresholdPaise: number;
  razorpayReady: boolean;
}

export interface StorefrontContact {
  email: string;
  phone: string;
  address: string;
}

export interface StorefrontDomain {
  hostname: string;
  canonicalUrl: string;
}

export interface StorefrontConfig {
  identity: StorefrontIdentity;
  branding: StorefrontBranding;
  hero?: StorefrontHero;
  theme?: StorefrontThemeStudio;
  commerce: StorefrontCommerce;
  contact: StorefrontContact;
  domain: StorefrontDomain;
}

// Backward-compatible site settings item for legacy components
export interface SiteSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

export interface PublicSettings {
  siteSettings: SiteSetting[];
  config: StorefrontConfig;
}

interface SettingsContextType {
  settings: PublicSettings;
  config: StorefrontConfig;
  loading: boolean;
  storeNotFound: boolean;
  error: string | null;
  getSiteSetting: (key: string) => string | undefined;
  getSiteSettingsByCategory: (category: string) => SiteSetting[];
  refetch: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const DEFAULT_THEME_STUDIO: StorefrontThemeStudio = {
  sections: [
    { id: 'hero', name: 'Hero Banner', enabled: true, icon: 'Sparkles' },
    { id: 'category_chips', name: 'Category Avatar Chips', enabled: true, icon: 'LayoutGrid' },
    { id: 'featured_products', name: 'Featured Collection', enabled: true, icon: 'Star' },
    { id: 'bento_grid', name: 'Shop by Category Grid', enabled: true, icon: 'Layers' },
    { id: 'latest_arrivals', name: 'Fresh Releases', enabled: true, icon: 'Clock' },
    { id: 'promo_banner', name: 'Why Shop With Us Badges', enabled: true, icon: 'ShieldCheck' },
  ],
  palette: {
    id: 'classic_luxury',
    name: 'Classic Luxury',
    primary: '#09090b',
    accent: '#18181b',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#09090b',
    mutedText: '#71717a',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    headingWeight: '800',
  },
  header: {
    layout: 'standard',
    logoHeight: 38,
    sticky: true,
    showAnnouncement: true,
    announcementText: 'Complimentary shipping on orders above ₹499',
    announcementBg: '#1c1917',
    announcementTextCol: '#ffffff',
  },
  footer: {
    aboutText: 'Discover curated luxury essentials and artisanal collections.',
    showNewsletter: true,
    showTrustBadges: true,
    copyrightText: `© ${new Date().getFullYear()} Store. All rights reserved.`,
  }
};

const DEFAULT_CONFIG: StorefrontConfig = {
  identity: {
    name: 'Store',
    siteName: 'Store',
    logo: '',
    favicon: '',
    announcementBar: 'Complimentary shipping on orders above ₹499',
  },
  branding: {
    primary: '#8c7e5a',
    accent: '#bfa760',
    typography: 'Inter',
  },
  hero: {
    layout: 'carousel',
    topTitle: 'New Collection',
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your best products with beautiful, high-resolution imagery',
    cta: 'Shop Now',
    ctaLink: '/products',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
        topTitle: 'New Collection',
        titleMain: 'Premium Storefront',
        subtitle: 'Showcase your best products with beautiful, high-resolution imagery',
        cta: 'Shop Now',
        ctaLink: '/products',
      },
      {
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80',
        topTitle: 'Featured Items',
        titleMain: 'Exclusive Deals',
        subtitle: 'Highlight your top selling items and promotions right here',
        cta: 'View Offers',
        ctaLink: '/products',
      }
    ]
  },
  theme: DEFAULT_THEME_STUDIO,
  commerce: {
    currency: 'INR',
    taxRatePct: 18,
    shippingFeePaise: 0,
    freeShippingThresholdPaise: 49900,
    razorpayReady: true,
  },
  contact: {
    email: '',
    phone: '',
    address: '',
  },
  domain: {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'platform.local',
    canonicalUrl: '',
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function clearStorefrontSettingsCache() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('storefront_config_'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch (_) {}
}

export function injectGoogleFont(fontName: string) {
  if (typeof document === 'undefined' || !fontName || fontName === 'Inter') return;
  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CACHE_KEY = `storefront_config_${typeof window !== 'undefined' ? window.location.hostname : 'default'}`;
  const CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL for fast updates

  const readCache = (): StorefrontConfig | null => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const writeCache = (data: StorefrontConfig) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }));
    } catch {
      // Ignore sessionStorage issues
    }
  };

  const applyBrandTheme = (themeConfig?: StorefrontThemeStudio, fallbackPrimary?: string, fallbackAccent?: string) => {
    if (typeof document === 'undefined') return;
    const primary = themeConfig?.palette?.primary || fallbackPrimary || '#09090b';
    const accent = themeConfig?.palette?.accent || fallbackAccent || '#18181b';
    const background = themeConfig?.palette?.background || '#fafafa';
    const surface = themeConfig?.palette?.surface || '#ffffff';
    const headingFont = themeConfig?.typography?.headingFont || 'Inter';

    document.documentElement.style.setProperty('--brand-primary', primary);
    document.documentElement.style.setProperty('--brand-accent', accent);
    document.documentElement.style.setProperty('--brand-bg', background);
    document.documentElement.style.setProperty('--brand-surface', surface);
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-accent', accent);
    document.documentElement.style.setProperty('--brand-font-heading', headingFont);

    if (headingFont && headingFont !== 'Inter') {
      injectGoogleFont(headingFont);
      document.body.style.fontFamily = `'${headingFont}', Inter, sans-serif`;
    }
  };

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setConfig(cached);
        applyBrandTheme(cached.theme, cached.branding.primary, cached.branding.accent);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setStoreNotFound(false);

      const response = await fetch('/api/store/settings');

      if (response.status === 404) {
        setStoreNotFound(true);
        setError('Store not found on this domain');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const resolved: StorefrontConfig = {
          identity: {
            id: data.identity?.id,
            name: data.identity?.name || 'Store',
            siteName: data.identity?.siteName || data.identity?.name || 'Store',
            logo: data.identity?.logo || '',
            favicon: data.identity?.favicon || '',
            announcementBar: data.identity?.announcementBar || '',
          },
          branding: {
            primary: data.branding?.primary || '#09090b',
            accent: data.branding?.accent || '#18181b',
            typography: data.branding?.typography || 'Inter',
          },
          hero: data.hero || DEFAULT_CONFIG.hero,
          theme: data.theme || DEFAULT_THEME_STUDIO,
          commerce: {
            currency: data.commerce?.currency || 'INR',
            taxRatePct: data.commerce?.taxRatePct ?? 18,
            shippingFeePaise: data.commerce?.shippingFeePaise ?? 0,
            freeShippingThresholdPaise: data.commerce?.freeShippingThresholdPaise ?? 49900,
            razorpayReady: data.commerce?.razorpayReady ?? false,
          },
          contact: {
            email: data.contact?.email || '',
            phone: data.contact?.phone || '',
            address: data.contact?.address || '',
          },
          domain: {
            hostname: data.domain?.hostname || (typeof window !== 'undefined' ? window.location.hostname : 'platform.local'),
            canonicalUrl: data.domain?.canonicalUrl || '',
          },
        };

        setConfig(resolved);
        writeCache(resolved);
        applyBrandTheme(resolved.theme, resolved.branding.primary, resolved.branding.accent);

        if (typeof document !== 'undefined' && resolved.identity.siteName) {
          document.title = resolved.identity.siteName;
        }
      } else {
        throw new Error('Failed to load store settings');
      }
    } catch (err: any) {
      console.warn('Storefront settings fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch store settings when we are on a store subdomain, not the platform root domain.
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const baseDomain = import.meta.env.VITE_SITE_URL
      ? new URL(import.meta.env.VITE_SITE_URL).hostname
      : 'get-oru.com';

    const isPlatformRoot =
      host === baseDomain ||
      host === `www.${baseDomain}` ||
      host === 'localhost' ||
      host === '127.0.0.1';

    // On tenant subdomain or custom domain, always fetch dynamic store settings
    if (!isPlatformRoot) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [fetchSettings]);

  const getSiteSetting = useCallback((key: string): string | undefined => {
    switch (key) {
      case 'site_name':
      case 'siteName':
        return config.identity.siteName;
      case 'site_logo':
      case 'logo_url':
      case 'logo':
        return config.identity.logo;
      case 'announcement_bar':
        return config.identity.announcementBar;
      case 'brand_primary':
        return config.branding.primary;
      case 'brand_accent':
        return config.branding.accent;
      default:
        return undefined;
    }
  }, [config]);

  const getSiteSettingsByCategory = useCallback((category: string): SiteSetting[] => {
    return [];
  }, []);

  const refetch = useCallback(async () => {
    await fetchSettings(true);
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings: { siteSettings: [], config },
        config,
        loading,
        storeNotFound,
        error,
        getSiteSetting,
        getSiteSettingsByCategory,
        refetch,
        refreshSettings: refetch,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
