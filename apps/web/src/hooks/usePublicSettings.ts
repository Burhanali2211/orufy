import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

interface SiteSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

interface SocialMediaAccount {
  platform: string;
  platform_name: string;
  url: string;
  username: string;
  icon_name: string;
  follower_count: number;
  description: string;
}

interface ContactInfo {
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  icon_name: string;
  additional_info: any;
}

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  opens_new_tab: boolean;
}

interface BusinessHours {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  is_24_hours: boolean;
  notes: string;
}

export interface PublicSettings {
  siteSettings: SiteSetting[];
  socialMedia: SocialMediaAccount[];
  contactInfo: ContactInfo[];
  footerLinks: FooterLink[];
  businessHours: BusinessHours[];
}

export const usePublicSettings = () => {
  const [settings, setSettings] = useState<PublicSettings>({
    siteSettings: [],
    socialMedia: [],
    contactInfo: [],
    footerLinks: [],
    businessHours: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all public settings from API
      const data = await apiClient.get<any>('/shop/tenant');

      if (data) {
        setSettings({
          siteSettings: data.siteSettings || [],
          socialMedia: data.socialMedia || [],
          contactInfo: data.contactInfo || [],
          footerLinks: data.footerLinks || [],
          businessHours: data.businessHours || []
        });
      }
    } catch (err: any) {
      console.error('Error fetching public settings:', err);
      setError(err.message || 'Failed to fetch public settings');
      // Set empty defaults on error
      setSettings({
        siteSettings: [],
        socialMedia: [],
        contactInfo: [],
        footerLinks: [],
        businessHours: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicSettings();

    // Listen for settings updates from admin panel
    const handleSettingsUpdate = () => {
      fetchPublicSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [fetchPublicSettings]);

  // Helper functions to get specific settings
  const getSiteSetting = (key: string): string | undefined => {
    const setting = settings.siteSettings.find(s => s.setting_key === key);
    return setting?.setting_value;
  };

  const getSiteSettingsByCategory = (category: string): SiteSetting[] => {
    return settings.siteSettings.filter(s => s.category === category);
  };

  return {
    ...settings,
    loading,
    error,
    getSiteSetting,
    getSiteSettingsByCategory
  };
};
