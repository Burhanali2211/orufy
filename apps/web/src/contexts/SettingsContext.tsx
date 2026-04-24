import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { transformKeysToCamel } from '../lib/dataTransform';
import { PublicSettings, SettingsContextType, SiteSetting, ApiResponse } from '../types';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>({
    siteSettings: [],
    socialMedia: [],
    contactInfo: [],
    footerLinks: [],
    businessHours: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CACHE_KEY = 'public_settings_cache';
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const readCache = (): PublicSettings | null => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) { sessionStorage.removeItem(CACHE_KEY); return null; }
      return data;
    } catch { return null; }
  };

  const writeCache = (data: PublicSettings) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }));
    } catch { /* sessionStorage full — skip */ }
  };

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setSettings(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.get<ApiResponse<any>>('/shop/tenant');
      const settingsData = transformKeysToCamel<any>(res.data);

      if (settingsData) {
        const resolved: PublicSettings = {
          siteSettings: settingsData.siteSettings || [],
          socialMedia: settingsData.socialMedia || [],
          contactInfo: settingsData.contactInfo || [],
          footerLinks: settingsData.footerLinks || [],
          businessHours: settingsData.businessHours || []
        };
        setSettings(resolved);
        writeCache(resolved);
      }
    } catch (err: any) {
      console.error('Error fetching public settings:', err);
      setError(err.message || 'Failed to fetch public settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdate = () => {
      sessionStorage.removeItem(CACHE_KEY);
      fetchSettings(true);
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [fetchSettings]);

  const getSiteSetting = useCallback((key: string): string | undefined => {
    const setting = settings.siteSettings.find(s => s.settingKey === key);
    return setting?.settingValue;
  }, [settings.siteSettings]);

  const getSiteSettingsByCategory = useCallback((category: string): SiteSetting[] => {
    return settings.siteSettings.filter(s => s.category === category);
  }, [settings.siteSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    getSiteSetting,
    getSiteSettingsByCategory,
    refetch: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
