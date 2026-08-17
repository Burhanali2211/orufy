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
}

export interface StorefrontHero {
  layout: 'carousel' | 'split' | 'minimal' | 'immersive';
  topTitle?: string;
  titleMain?: string;
  subtitle?: string;
  cta?: string;
  ctaLink?: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
  slides?: HeroSlide[];
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
}

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

  const applyBrandTheme = (primaryColor: string, accentColor: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--brand-primary', primaryColor || '#8c7e5a');
      document.documentElement.style.setProperty('--brand-accent', accentColor || '#bfa760');
    }
  };

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setConfig(cached);
        applyBrandTheme(cached.branding.primary, cached.branding.accent);
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
            primary: data.branding?.primary || '#8c7e5a',
            accent: data.branding?.accent || '#bfa760',
            typography: data.branding?.typography || 'Inter',
          },
          hero: data.hero || DEFAULT_CONFIG.hero,
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
        applyBrandTheme(resolved.branding.primary, resolved.branding.accent);

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
