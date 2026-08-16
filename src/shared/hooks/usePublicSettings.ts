import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';

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

const EMPTY_SETTINGS: PublicSettings = {
  siteSettings: [],
  socialMedia: [],
  contactInfo: [],
  footerLinks: [],
  businessHours: [],
};

export const usePublicSettings = () => {
  const { data, isLoading, error } = useQuery<PublicSettings>({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const result = await apiClient.get('/settings/public');
      return result || EMPTY_SETTINGS;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const settings = data || EMPTY_SETTINGS;

  const getSiteSetting = (key: string): string | undefined => {
    return settings.siteSettings.find(s => s.setting_key === key)?.setting_value;
  };

  const getSiteSettingsByCategory = (category: string): SiteSetting[] => {
    return settings.siteSettings.filter(s => s.category === category);
  };

  return {
    ...settings,
    loading: isLoading,
    error: error ? String(error) : null,
    getSiteSetting,
    getSiteSettingsByCategory,
  };
};