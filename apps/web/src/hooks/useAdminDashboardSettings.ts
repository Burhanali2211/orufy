import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import {
  loadSettingsFromCache,
  saveSettingsToCache,
  applyDashboardStyles,
  initializeDashboardStyles
} from '@/utils/adminDashboardStyles';

interface DashboardSettings {
  dashboard_name: string;
  dashboard_logo_url: string;
  background_gradient_from: string;
  background_gradient_via: string;
  background_gradient_to: string;
  primary_color_from: string;
  primary_color_to: string;
  secondary_color_from: string;
  secondary_color_to: string;
  glass_background_opacity: string;
  glass_border_opacity: string;
  backdrop_blur: string;
  sidebar_background: string;
  header_background: string;
}

const defaultSettings: DashboardSettings = {
  dashboard_name: 'Admin Panel',
  dashboard_logo_url: '',
  background_gradient_from: '#0f172a',
  background_gradient_via: '#581c87',
  background_gradient_to: '#0f172a',
  primary_color_from: '#fbbf24',
  primary_color_to: '#f97316',
  secondary_color_from: '#a855f7',
  secondary_color_to: '#6366f1',
  glass_background_opacity: '0.95',
  glass_border_opacity: '0.1',
  backdrop_blur: 'xl',
  sidebar_background: 'rgba(15, 23, 42, 0.95)',
  header_background: 'rgba(15, 23, 42, 0.8)'
};

export const useAdminDashboardSettings = () => {
  // Load from cache first for instant display
  const cachedSettings = initializeDashboardStyles();
  const [settings, setSettings] = useState<DashboardSettings>(cachedSettings || defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch dashboard settings from tenant settings API
        const data = await apiClient.get<any>('/shop/tenant');

        if (data) {
          // Extract dashboard-related settings from response
          const settingsObj: Partial<DashboardSettings> = {};

          if (data.settings && typeof data.settings === 'object') {
            Object.entries(data.settings).forEach(([key, value]) => {
              if (key.startsWith('dashboard_') && key in defaultSettings) {
                (settingsObj as any)[key] = value || (defaultSettings as any)[key];
              }
            });
          }

          const loadedSettings = { ...defaultSettings, ...settingsObj };

          // Update state
          setSettings(loadedSettings);

          // Save to cache and apply styles
          saveSettingsToCache(loadedSettings);
          applyDashboardStyles(loadedSettings);
        } else {
          // No settings found, use defaults
          setSettings(defaultSettings);
          applyDashboardStyles(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching dashboard settings:', error);
        // Use cached or defaults on error
        if (cachedSettings) {
          setSettings(cachedSettings);
          applyDashboardStyles(cachedSettings);
        } else {
          setSettings(defaultSettings);
          applyDashboardStyles(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Listen for style updates from other components (e.g., settings page)
    const handleStyleUpdate = (event: CustomEvent) => {
      const newSettings = event.detail as DashboardSettings;
      setSettings(newSettings);
      applyDashboardStyles(newSettings);
    };

    window.addEventListener('adminDashboardStylesUpdated', handleStyleUpdate as EventListener);

    return () => {
      window.removeEventListener('adminDashboardStylesUpdated', handleStyleUpdate as EventListener);
    };
  }, []);

  return { settings, loading };
};
