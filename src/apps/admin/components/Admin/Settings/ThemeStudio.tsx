import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache, injectGoogleFont, StorefrontThemeStudio, StorefrontHero, DEFAULT_THEME_STUDIO } from '@/shared/contexts/SettingsContext';
import {
  Smartphone,
  Tablet,
  Monitor,
  Save,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { InspectorPanel } from './ThemeStudio/components/InspectorPanel';
import { LivePreview } from './ThemeStudio/components/LivePreview';

type StudioTab = 'navigator' | 'design' | 'header' | 'footer';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type MobileViewTab = 'editor' | 'preview';

export const ThemeStudio: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StudioTab>('navigator');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [mobileViewTab, setMobileViewTab] = useState<MobileViewTab>('editor');
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [storeInfo, setStoreInfo] = useState({ name: '', logo_url: '', hostname: '' });
  const [theme, setTheme] = useState<StorefrontThemeStudio>(DEFAULT_THEME_STUDIO);
  const [hero, setHero] = useState<StorefrontHero>({
    layout: 'carousel',
    topTitle: 'New Collection',
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your finest products with high-resolution imagery and sleek typography',
    cta: 'Shop Now',
    ctaLink: '/products',
    secondaryCta: 'View Offers',
    secondaryCtaLink: '/products',
    backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
        topTitle: 'New Collection',
        titleMain: 'Premium Storefront',
        subtitle: 'Showcase your finest products with high-resolution imagery and sleek typography',
        cta: 'Shop Now',
        ctaLink: '/products',
      },
    ],
  });

  // Fetch initial theme settings
  const { data: initialSettings, isLoading } = useQuery({
    queryKey: ['admin-theme-studio-settings'],
    queryFn: async () => {
      const [brandingRes, heroRes] = await Promise.all([
        apiClient.get('/admin/settings/branding').catch(() => null),
        apiClient.get('/admin/settings/hero').catch(() => null),
      ]);
      return { branding: brandingRes, hero: heroRes };
    },
  });

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.branding) {
        const b = initialSettings.branding;
        setStoreInfo({
          name: b.name || '',
          logo_url: b.logo_url || '',
          hostname: b.hostname || '',
        });

        if (b.theme_studio && typeof b.theme_studio === 'object') {
          setTheme({
            ...DEFAULT_THEME_STUDIO,
            ...b.theme_studio,
          });
        }
      }

      if (initialSettings.hero) {
        const h = initialSettings.hero;
        setHero((prev) => ({
          ...prev,
          ...h,
          slides: h.slides?.length ? h.slides : prev.slides,
        }));
      }
    }
  }, [initialSettings]);

  // Publish changes mutation
  const publishMutation = useMutation({
    mutationFn: async (payload: { store: typeof storeInfo; hero: typeof hero; theme: typeof theme }) => {
      await Promise.all([
        apiClient.post('/admin/settings/branding', {
          name: payload.store.name,
          logo_url: payload.store.logo_url,
          announcement_bar: payload.theme.header.showAnnouncement ? payload.theme.header.announcementText : '',
          primary_color: payload.theme.palette.primary,
          accent_color: payload.theme.palette.accent,
          theme_studio: payload.theme,
        }),
        apiClient.post('/admin/settings/hero', payload.hero),
      ]);
    },
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Homepage theme & layout published live!');
      queryClient.invalidateQueries({ queryKey: ['admin-theme-studio-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-settings'] });
    },
    onError: (err: Error) => {
      showError(err?.message || 'Failed to publish changes');
    },
  });

  const handlePublish = () => {
    publishMutation.mutate({
      store: storeInfo,
      hero,
      theme,
    });
  };

  const selectFont = (fontName: string) => {
    injectGoogleFont(fontName);
    setTheme({
      ...theme,
      typography: {
        ...theme.typography,
        headingFont: fontName,
        bodyFont: fontName,
      },
    });
  };

  const selectSection = (id: string) => {
    setSelectedSectionId(id);
    if (window.innerWidth < 1024) setMobileViewTab('editor');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-16">
      {/* ── Responsive Top Bar ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-stone-900">Visual Page Builder</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
                Homepage
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Click any canvas section to edit properties in real-time.
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Mobile View Tab Switcher (< lg) */}
          <div className="flex lg:hidden items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setMobileViewTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileViewTab === 'editor' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Controls
            </button>
            <button
              type="button"
              onClick={() => setMobileViewTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileViewTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Desktop Device Switcher */}
          <div className="hidden lg:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'desktop' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Desktop 100%"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'tablet' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Tablet 768px"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Mobile 375px"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Publish Live CTA */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer ml-auto sm:ml-0"
          >
            {publishMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{publishMutation.isPending ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <InspectorPanel
          mobileViewTab={mobileViewTab}
          selectedSectionId={selectedSectionId}
          setSelectedSectionId={setSelectedSectionId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          setTheme={setTheme}
          hero={hero}
          setHero={setHero}
          storeInfo={storeInfo}
          setStoreInfo={setStoreInfo}
          activeSlideIndex={activeSlideIndex}
          setActiveSlideIndex={setActiveSlideIndex}
          setMobileViewTab={setMobileViewTab}
          setHoveredSectionId={setHoveredSectionId}
          selectFont={selectFont}
        />
        
        <LivePreview
          deviceMode={deviceMode}
          mobileViewTab={mobileViewTab}
          storeInfo={storeInfo}
          theme={theme}
          hero={hero}
          hoveredSectionId={hoveredSectionId}
          selectedSectionId={selectedSectionId}
          setHoveredSectionId={setHoveredSectionId}
          selectSection={selectSection}
          activeSlideIndex={activeSlideIndex}
        />
      </div>
    </div>
  );
};

export default ThemeStudio;
