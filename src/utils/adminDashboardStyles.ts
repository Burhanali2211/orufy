/**
 * Admin Dashboard Styles Utility
 * Handles immediate style application and localStorage caching
 */

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

const STORAGE_KEY = 'admin_dashboard_settings';
const STYLE_ID = 'admin-dashboard-dynamic-styles';

/**
 * Save settings to localStorage
 */
export const saveSettingsToCache = (settings: DashboardSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      settings,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error saving settings to cache:', error);
  }
};

/**
 * Load settings from localStorage
 */
export const loadSettingsFromCache = (): DashboardSettings | null => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    // Cache is valid for 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed.settings;
  } catch (error) {
    console.error('Error loading settings from cache:', error);
    return null;
  }
};

/**
 * Clear cached settings
 */
export const clearSettingsCache = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing settings cache:', error);
  }
};

/**
 * Apply styles immediately to the page
 * This prevents the flash of old colors
 */
export const applyDashboardStyles = (settings: DashboardSettings): void => {
  // Remove existing style element if present
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  
  // Generate CSS with all dynamic styles
  const css = `
    /* Admin Dashboard Dynamic Styles */
    :root {
      --admin-bg-gradient-from: ${settings.background_gradient_from};
      --admin-bg-gradient-via: ${settings.background_gradient_via};
      --admin-bg-gradient-to: ${settings.background_gradient_to};
      --admin-primary-from: ${settings.primary_color_from};
      --admin-primary-to: ${settings.primary_color_to};
      --admin-secondary-from: ${settings.secondary_color_from};
      --admin-secondary-to: ${settings.secondary_color_to};
      --admin-sidebar-bg: ${settings.sidebar_background};
      --admin-header-bg: ${settings.header_background};
      --admin-glass-bg-opacity: ${settings.glass_background_opacity};
      --admin-glass-border-opacity: ${settings.glass_border_opacity};
    }

    /* Apply to main dashboard container */
    [data-admin-dashboard="true"] {
      background: linear-gradient(to bottom right, 
        var(--admin-bg-gradient-from), 
        var(--admin-bg-gradient-via), 
        var(--admin-bg-gradient-to)
      ) !important;
    }

    /* Apply to sidebar */
    [data-admin-sidebar="true"] {
      background-color: var(--admin-sidebar-bg) !important;
    }

    /* Apply to header */
    [data-admin-header="true"] {
      background-color: var(--admin-header-bg) !important;
    }

    /* Primary gradient utilities */
    [data-admin-primary-gradient="true"] {
      background: linear-gradient(to bottom right, 
        var(--admin-primary-from), 
        var(--admin-primary-to)
      ) !important;
    }

    [data-admin-primary-text="true"] {
      background: linear-gradient(to right, 
        var(--admin-primary-from), 
        var(--admin-primary-to)
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Secondary gradient utilities */
    [data-admin-secondary-gradient="true"] {
      background: linear-gradient(to bottom right, 
        var(--admin-secondary-from), 
        var(--admin-secondary-to)
      ) !important;
    }
  `;

  styleElement.textContent = css;
  document.head.appendChild(styleElement);

  // Also apply directly to root element for immediate effect
  const root = document.documentElement;
  root.style.setProperty('--admin-bg-gradient-from', settings.background_gradient_from);
  root.style.setProperty('--admin-bg-gradient-via', settings.background_gradient_via);
  root.style.setProperty('--admin-bg-gradient-to', settings.background_gradient_to);
  root.style.setProperty('--admin-primary-from', settings.primary_color_from);
  root.style.setProperty('--admin-primary-to', settings.primary_color_to);
  root.style.setProperty('--admin-secondary-from', settings.secondary_color_from);
  root.style.setProperty('--admin-secondary-to', settings.secondary_color_to);
  root.style.setProperty('--admin-sidebar-bg', settings.sidebar_background);
  root.style.setProperty('--admin-header-bg', settings.header_background);
};

/**
 * Initialize styles on page load from cache
 * This should be called as early as possible to prevent flash
 */
export const initializeDashboardStyles = (): DashboardSettings | null => {
  // Only run in browser
  if (typeof window === 'undefined') return null;
  
  const cached = loadSettingsFromCache();
  if (cached) {
    // Apply immediately, before React renders
    applyDashboardStyles(cached);
    
    // Also set on document ready if not already set
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyDashboardStyles(cached);
      });
    }
  }
  return cached;
};

/**
 * Update styles immediately (for use after saving)
 */
export const updateDashboardStyles = (settings: DashboardSettings): void => {
  // Save to cache first
  saveSettingsToCache(settings);
  
  // Apply immediately
  applyDashboardStyles(settings);
  
  // Force browser to repaint and clear any cached styles
  if (document.body) {
    // Trigger a reflow to ensure styles are applied
    void document.body.offsetHeight;
    
    // Clear any inline style cache by touching the elements
    const dashboardElements = document.querySelectorAll('[data-admin-dashboard], [data-admin-sidebar], [data-admin-header]');
    dashboardElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      // Force style recalculation
      void htmlEl.offsetHeight;
    });
  }
  
  // Dispatch custom event to notify other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('adminDashboardStylesUpdated', { 
      detail: settings 
    }));
  }
};

