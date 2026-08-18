import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache, injectGoogleFont, StorefrontThemeStudio, StorefrontHero, DEFAULT_THEME_STUDIO, HeroSlide } from '@/shared/contexts/SettingsContext';
import { Reorder } from 'framer-motion';
import {
  Palette,
  Sparkles,
  Layout,
  Layers,
  Maximize2,
  Columns,
  Eye,
  EyeOff,
  GripVertical,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  RefreshCw,
  Plus,
  Type,
  Store,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones,
  ShoppingBag,
  Star,
  Mail,
  Grid,
  Zap,
  Edit3,
  SlidersHorizontal,
  FolderTree,
  Sliders
} from 'lucide-react';

/* ─── Luxury Preset Palettes ─── */
const CURATED_PALETTES = [
  {
    id: 'classic_luxury',
    name: 'Obsidian Flagship',
    primary: '#09090b',
    accent: '#18181b',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#09090b',
    mutedText: '#71717a',
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
    primary: '#09090b',
    accent: '#d4af37',
    background: '#09090b',
    surface: '#18181b',
    text: '#f4f4f5',
    mutedText: '#a1a1aa',
  },
  {
    id: 'emerald_reserve',
    name: 'Emerald Reserve',
    primary: '#064e3b',
    accent: '#10b981',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#064e3b',
    mutedText: '#047857',
  },
  {
    id: 'alabaster_clean',
    name: 'Alabaster Minimal',
    primary: '#18181b',
    accent: '#52525b',
    background: '#ffffff',
    surface: '#f4f4f5',
    text: '#18181b',
    mutedText: '#71717a',
  },
  {
    id: 'rose_champagne',
    name: 'Rose Champagne',
    primary: '#4a044e',
    accent: '#d946ef',
    background: '#fdf4ff',
    surface: '#ffffff',
    text: '#4a044e',
    mutedText: '#a21caf',
  },
  {
    id: 'ocean_sapphire',
    name: 'Ocean Sapphire',
    primary: '#0f172a',
    accent: '#0284c7',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    mutedText: '#475569',
  },
];

/* ─── Google Fonts Catalog ─── */
const CURATED_FONTS = [
  { name: 'Inter', category: 'Modern Sans' },
  { name: 'Plus Jakarta Sans', category: 'Geometric Sans' },
  { name: 'Playfair Display', category: 'Luxury Editorial Serif' },
  { name: 'Cinzel', category: 'Royal Classical Serif' },
  { name: 'Outfit', category: 'Clean Contemporary' },
  { name: 'DM Sans', category: 'Humanist Sans' },
  { name: 'Syne', category: 'Avant-Garde Display' },
];

/* ─── Curated Unsplash Photos ─── */
const CURATED_IMAGES = [
  { title: 'Oud & Amber Luxury', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1600&q=80' },
  { title: 'Flagship Fragrance Atelier', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80' },
  { title: 'Luxury Minimalist Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80' },
  { title: 'Bespoke Bottle Display', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80' },
  { title: 'Golden Essences', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80' },
];

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
    onError: (err: any) => {
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

  const toggleSectionVisibility = (id: string) => {
    const updated = theme.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setTheme({ ...theme, sections: updated });
  };

  const handleReorderSections = (newOrder: any[]) => {
    setTheme({ ...theme, sections: newOrder });
  };

  const selectPalette = (pal: typeof CURATED_PALETTES[0]) => {
    setTheme({
      ...theme,
      palette: {
        ...pal,
      },
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

  const addHeroSlide = () => {
    const newSlide: HeroSlide = {
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1600&q=80',
      topTitle: 'New Arrival',
      titleMain: 'Exclusive Handcrafted Pieces',
      subtitle: 'Pure organic essences distilled for timeless elegance.',
      cta: 'Shop Now',
      ctaLink: '/products',
    };
    const updated = [...(hero.slides || []), newSlide];
    setHero({ ...hero, slides: updated });
    setActiveSlideIndex(updated.length - 1);
  };

  const removeHeroSlide = (idx: number) => {
    const updated = (hero.slides || []).filter((_, i) => i !== idx);
    setHero({ ...hero, slides: updated });
    setActiveSlideIndex(Math.max(0, idx - 1));
  };

  const updateCurrentSlide = (field: keyof HeroSlide, val: string) => {
    const slides = [...(hero.slides || [])];
    if (slides[activeSlideIndex]) {
      slides[activeSlideIndex] = { ...slides[activeSlideIndex], [field]: val };
      setHero({ ...hero, slides });
    }
  };

  const currentSlide = hero.slides?.[activeSlideIndex] || hero.slides?.[0] || {
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your finest items with high-resolution imagery.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  };

  const selectedSection = theme.sections.find((s) => s.id === selectedSectionId);

  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'hero': return Sparkles;
      case 'features': return ShieldCheck;
      case 'categories': return FolderTree;
      case 'featured_products': return Grid;
      case 'promo_banner': return Zap;
      case 'latest_arrivals': return ShoppingBag;
      case 'reviews': return Star;
      case 'newsletter': return Mail;
      default: return Layers;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const storeInitial = (storeInfo.name || 'Store').charAt(0).toUpperCase();

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
        {/* ── Left Inspector Panel (380px) ── */}
        <div
          className={`lg:col-span-5 xl:col-span-4 bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[580px] ${
            mobileViewTab === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Inspector Header / Tabs */}
          {selectedSectionId ? (
            <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSectionId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Navigator</span>
              </button>
              <span className="text-xs font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                {selectedSection?.name || 'Section Inspector'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-4 p-1.5 bg-stone-100 border-b border-stone-200 gap-1">
              {[
                { id: 'navigator', label: 'Blocks', icon: Layers },
                { id: 'design', label: 'Colors & Fonts', icon: Palette },
                { id: 'header', label: 'Header', icon: Layout },
                { id: 'footer', label: 'Footer', icon: Store },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as StudioTab)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inspector Body */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[660px] space-y-5">
            {/* ── FOCUSED HERO INSPECTOR ── */}
            {selectedSectionId === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Hero Layout Variant
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'carousel', label: 'Dynamic Carousel', icon: Layers },
                      { id: 'split', label: 'Split Showcase', icon: Columns },
                      { id: 'minimal', label: 'Editorial Minimal', icon: Layout },
                      { id: 'immersive', label: 'Full Bleed', icon: Maximize2 },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setHero({ ...hero, layout: style.id as any })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          hero.layout === style.id
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <style.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {hero.layout === 'carousel' ? (
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">Slides ({hero.slides?.length || 0})</span>
                      <button
                        type="button"
                        onClick={addHeroSlide}
                        className="px-2 py-1 rounded-lg bg-stone-900 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Slide
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {(hero.slides || []).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            activeSlideIndex === idx
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Slide {idx + 1}
                          {(hero.slides || []).length > 1 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHeroSlide(idx);
                              }}
                              className="hover:text-red-300 ml-1"
                            >
                              &times;
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Badge Text</label>
                        <input
                          type="text"
                          value={currentSlide.topTitle || ''}
                          onChange={(e) => updateCurrentSlide('topTitle', e.target.value)}
                          placeholder="e.g. New Collection"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Headline</label>
                        <input
                          type="text"
                          value={currentSlide.titleMain || ''}
                          onChange={(e) => updateCurrentSlide('titleMain', e.target.value)}
                          placeholder="e.g. Pure Artisanal Fragrances"
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Subtitle</label>
                        <textarea
                          rows={2}
                          value={currentSlide.subtitle || ''}
                          onChange={(e) => updateCurrentSlide('subtitle', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Photo URL</label>
                        <input
                          type="text"
                          value={currentSlide.image || ''}
                          onChange={(e) => updateCurrentSlide('image', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Badge Text</label>
                      <input
                        type="text"
                        value={hero.topTitle || ''}
                        onChange={(e) => setHero({ ...hero, topTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Headline</label>
                      <input
                        type="text"
                        value={hero.titleMain || ''}
                        onChange={(e) => setHero({ ...hero, titleMain: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Subtitle</label>
                      <textarea
                        rows={2}
                        value={hero.subtitle || ''}
                        onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Background Photo URL</label>
                      <input
                        type="text"
                        value={hero.backgroundImage || ''}
                        onChange={(e) => setHero({ ...hero, backgroundImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Curated Photos Picker */}
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-700 block mb-1.5">Curated Luxury Photos:</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CURATED_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (hero.layout === 'carousel') {
                            updateCurrentSlide('image', img.url);
                          } else {
                            setHero({ ...hero, backgroundImage: img.url });
                          }
                        }}
                        className="aspect-square rounded-lg overflow-hidden border border-stone-200 hover:ring-2 hover:ring-stone-900 transition-all cursor-pointer"
                        title={img.title}
                      >
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Sections */}
            {selectedSectionId && selectedSectionId !== 'hero' && (
              <div className="space-y-4">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{selectedSection?.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(selectedSectionId)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white border border-stone-200 text-stone-700 cursor-pointer"
                    >
                      {selectedSection?.enabled ? 'Active' : 'Hidden'}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Live layout and presentation options for this block.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Section Title</label>
                  <input
                    type="text"
                    defaultValue={selectedSection?.name}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* ── TAB 1: SECTION NAVIGATOR ── */}
            {!selectedSectionId && activeTab === 'navigator' && (
              <div className="space-y-3">
                <div className="border-b border-stone-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Page Blocks</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">Drag to reorder. Click section to edit.</p>
                </div>

                <Reorder.Group
                  axis="y"
                  values={theme.sections}
                  onReorder={handleReorderSections}
                  className="space-y-2"
                >
                  {theme.sections.map((section) => {
                    const SectionIcon = getSectionIcon(section.id);
                    return (
                      <Reorder.Item
                        key={section.id}
                        value={section}
                        onMouseEnter={() => setHoveredSectionId(section.id)}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          section.enabled
                            ? 'bg-white border-stone-200 hover:border-stone-400 shadow-xs'
                            : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 flex-1 min-w-0"
                          onClick={() => {
                            setSelectedSectionId(section.id);
                            if (window.innerWidth < 1024) setMobileViewTab('editor');
                          }}
                        >
                          <GripVertical className="w-4 h-4 text-stone-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                          <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                            <SectionIcon className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-bold text-stone-900 truncate">{section.name}</span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSectionVisibility(section.id);
                            }}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              section.enabled ? 'text-stone-700 hover:bg-stone-100' : 'text-stone-400 hover:bg-stone-200'
                            }`}
                            title={section.enabled ? 'Hide Section' : 'Show Section'}
                          >
                            {section.enabled ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSectionId(section.id);
                              if (window.innerWidth < 1024) setMobileViewTab('editor');
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Edit Properties"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            )}

            {/* ── TAB 2: COLORS & FONTS ── */}
            {!selectedSectionId && activeTab === 'design' && (
              <div className="space-y-5">
                {/* Palettes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Curated Color Palettes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_PALETTES.map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => selectPalette(pal)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          theme.palette.id === pal.id
                            ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: pal.primary }} />
                          <div className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: pal.accent }} />
                          <div className="w-3 h-3 rounded-full border border-stone-200 shadow-xs" style={{ backgroundColor: pal.background }} />
                        </div>
                        <span className="text-[11px] font-bold text-stone-900 block truncate">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Engine */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Typography Pairings
                  </label>
                  <div className="space-y-1.5">
                    {CURATED_FONTS.map((font) => (
                      <button
                        key={font.name}
                        type="button"
                        onClick={() => selectFont(font.name)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          theme.typography.headingFont === font.name
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold leading-tight" style={{ fontFamily: `'${font.name}', sans-serif` }}>
                            {font.name}
                          </p>
                          <p className={`text-[10px] ${theme.typography.headingFont === font.name ? 'text-stone-300' : 'text-stone-400'}`}>
                            {font.category}
                          </p>
                        </div>
                        {theme.typography.headingFont === font.name && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: HEADER ── */}
            {!selectedSectionId && activeTab === 'header' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
                  />
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Announcement Bar</span>
                    <input
                      type="checkbox"
                      checked={theme.header.showAnnouncement}
                      onChange={(e) => setTheme({ ...theme, header: { ...theme.header, showAnnouncement: e.target.checked } })}
                      className="w-4 h-4 cursor-pointer accent-stone-900"
                    />
                  </div>
                  {theme.header.showAnnouncement && (
                    <input
                      type="text"
                      value={theme.header.announcementText}
                      onChange={(e) => setTheme({ ...theme, header: { ...theme.header, announcementText: e.target.value } })}
                      placeholder="e.g. Complimentary shipping on orders above ₹499"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: FOOTER ── */}
            {!selectedSectionId && activeTab === 'footer' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    About Brand Narrative
                  </label>
                  <textarea
                    rows={3}
                    value={theme.footer.aboutText}
                    onChange={(e) => setTheme({ ...theme, footer: { ...theme.footer, aboutText: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs resize-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                    <span className="text-xs font-bold text-stone-800">Newsletter Subscription Form</span>
                    <input
                      type="checkbox"
                      checked={theme.footer.showNewsletter}
                      onChange={(e) => setTheme({ ...theme, footer: { ...theme.footer, showNewsletter: e.target.checked } })}
                      className="w-4 h-4 accent-stone-900"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Canvas: Responsive Live Preview ── */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col items-center w-full ${
            mobileViewTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Canvas Bezel */}
          <div
            className={`w-full transition-all duration-300 rounded-2xl overflow-hidden border border-stone-300 shadow-lg bg-white ${
              deviceMode === 'mobile'
                ? 'max-w-[375px]'
                : deviceMode === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            {/* Device Header */}
            <div className="bg-stone-900 text-stone-400 px-3.5 py-2 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-[10px] text-stone-300 truncate max-w-[200px]">
                https://{storeInfo.hostname || 'easyio.get-oru.com'}
              </span>
              <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
                {deviceMode}
              </div>
            </div>

            {/* Live Preview Storefront Content */}
            <div
              className="max-h-[640px] overflow-y-auto scrollbar-hide text-stone-900"
              style={{
                backgroundColor: theme.palette.background,
                fontFamily: `'${theme.typography.headingFont}', sans-serif`,
              }}
            >
              {/* 1. Announcement Bar */}
              {theme.header.showAnnouncement && (
                <div
                  className="py-1.5 px-3 text-center text-xs font-bold tracking-wide transition-colors"
                  style={{
                    backgroundColor: theme.palette.primary,
                    color: '#ffffff',
                  }}
                >
                  {theme.header.announcementText}
                </div>
              )}

              {/* 2. Header */}
              <div className="bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                  {storeInfo.logo_url ? (
                    <img
                      src={storeInfo.logo_url}
                      alt="Logo"
                      className="h-7 w-auto max-w-[100px] object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-xs"
                      style={{ backgroundColor: theme.palette.primary }}
                    >
                      {storeInitial}
                    </div>
                  )}
                  <span className="font-extrabold text-xs tracking-tight text-stone-900">
                    {storeInfo.name || 'Store'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px]">Products</span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px]">Categories</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-white font-bold text-[11px]">
                    Cart (0)
                  </span>
                </div>
              </div>

              {/* 3. Render Simulated Sections */}
              {theme.sections
                .filter((s) => s.enabled)
                .map((sec) => {
                  const isHovered = hoveredSectionId === sec.id;
                  const isSelected = selectedSectionId === sec.id;

                  if (sec.id === 'hero') {
                    return (
                      <div
                        key="sim-hero"
                        onClick={() => {
                          setSelectedSectionId('hero');
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId('hero')}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`relative transition-all cursor-pointer group ${
                          isSelected
                            ? 'ring-2 ring-stone-900 ring-offset-2'
                            : isHovered
                            ? 'ring-2 ring-stone-400/80'
                            : ''
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <Edit3 className="w-2.5 h-2.5" /> Edit Hero Section
                        </div>

                        {hero.layout === 'minimal' && (
                          <div className="py-12 px-5 text-center space-y-2.5 bg-white">
                            {hero.topTitle && (
                              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-900 text-[9px] font-bold uppercase tracking-widest inline-block">
                                {hero.topTitle}
                              </span>
                            )}
                            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                              {hero.titleMain || 'Discover Curated Luxury'}
                            </h2>
                            <p className="text-stone-500 text-[11px] max-w-md mx-auto">{hero.subtitle}</p>
                            <div className="pt-1">
                              <span
                                className="px-4 py-1.5 rounded-full text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {hero.cta || 'Shop Now'} <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        )}

                        {hero.layout === 'immersive' && (
                          <div className="relative min-h-[220px] p-6 text-center text-white flex flex-col items-center justify-center overflow-hidden">
                            <img
                              src={hero.backgroundImage || currentSlide.image}
                              alt="Hero"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50" />
                            <div className="relative z-10 space-y-1.5 max-w-sm">
                              {hero.topTitle && (
                                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-widest">
                                  {hero.topTitle}
                                </span>
                              )}
                              <h2 className="text-lg sm:text-xl font-black">{hero.titleMain || 'Immersive Flagship'}</h2>
                              <p className="text-stone-200 text-[11px]">{hero.subtitle}</p>
                              <div className="pt-1">
                                <span className="px-4 py-1 rounded-full bg-white text-stone-900 text-xs font-bold inline-flex items-center gap-1">
                                  {hero.cta || 'Explore'} <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {hero.layout === 'split' && (
                          <div className="p-5 grid grid-cols-2 gap-4 items-center bg-white">
                            <div className="space-y-2">
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-900 text-[8px] font-bold uppercase tracking-widest inline-block">
                                {hero.topTitle || 'New'}
                              </span>
                              <h2 className="text-base font-black text-stone-900">{hero.titleMain || 'Exclusive Pieces'}</h2>
                              <p className="text-stone-500 text-[10px] line-clamp-2">{hero.subtitle}</p>
                              <span
                                className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {hero.cta || 'Shop Now'} <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                              <img src={hero.backgroundImage || currentSlide.image} alt="Hero" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}

                        {hero.layout === 'carousel' && (
                          <div className="p-5 grid grid-cols-2 gap-4 items-center bg-stone-50/80 border-b border-stone-200/60">
                            <div className="space-y-2">
                              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-900 text-[8px] font-bold uppercase tracking-widest inline-block">
                                {currentSlide.topTitle || 'Featured'}
                              </span>
                              <h2 className="text-base font-black text-stone-900 leading-tight">{currentSlide.titleMain}</h2>
                              <p className="text-stone-600 text-[10px] line-clamp-2">{currentSlide.subtitle}</p>
                              <span
                                className="px-4 py-1.5 rounded-full text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {currentSlide.cta || 'Shop Now'} <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            <div className="aspect-video rounded-xl overflow-hidden bg-stone-200 border border-stone-200 shadow-xs">
                              <img src={currentSlide.image} alt="Hero" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (sec.id === 'features') {
                    return (
                      <div
                        key="sim-features"
                        onClick={() => {
                          setSelectedSectionId('features');
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId('features')}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-4 border-b border-stone-200/60 bg-white grid grid-cols-3 gap-2 text-center cursor-pointer relative group ${
                          isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : isHovered ? 'ring-2 ring-stone-400/80' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <Truck className="w-4 h-4 text-stone-800 mb-0.5" />
                          <p className="text-[10px] font-bold text-stone-900">Complimentary Shipping</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <ShieldCheck className="w-4 h-4 text-stone-800 mb-0.5" />
                          <p className="text-[10px] font-bold text-stone-900">100% Authentic</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <Headphones className="w-4 h-4 text-stone-800 mb-0.5" />
                          <p className="text-[10px] font-bold text-stone-900">Concierge Support</p>
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'categories') {
                    return (
                      <div
                        key="sim-categories"
                        onClick={() => {
                          setSelectedSectionId('categories');
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId('categories')}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-4 border-b border-stone-200/60 bg-white space-y-3 cursor-pointer relative group ${
                          isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : isHovered ? 'ring-2 ring-stone-400/80' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">Curated Collections</h3>
                          <span className="text-[10px] font-bold text-stone-500">View All</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {['Attar Oils', 'Eau de Parfum', 'Home Scents', 'Gift Sets'].map((cat, i) => (
                            <div key={i} className="rounded-lg overflow-hidden border border-stone-200 bg-stone-50 p-1.5 text-center space-y-0.5">
                              <div className="aspect-square rounded-md bg-stone-200 overflow-hidden">
                                <img src={CURATED_IMAGES[i % CURATED_IMAGES.length].url} alt={cat} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[9px] font-bold text-stone-800 truncate">{cat}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'featured_products' || sec.id === 'latest_arrivals') {
                    return (
                      <div
                        key={`sim-${sec.id}`}
                        onClick={() => {
                          setSelectedSectionId(sec.id);
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId(sec.id)}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-4 border-b border-stone-200/60 bg-white space-y-3 cursor-pointer relative group ${
                          isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : isHovered ? 'ring-2 ring-stone-400/80' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">{sec.name}</h3>
                          <span className="text-[10px] font-bold text-stone-500">Catalog</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: 'Royal Oud Reserve', price: '₹4,999' },
                            { name: 'Velvet Ambergris', price: '₹3,499' },
                            { name: 'Mysore Sandalwood', price: '₹2,899' },
                          ].map((item, i) => (
                            <div key={i} className="rounded-xl border border-stone-200 bg-white p-1.5 space-y-1 shadow-xs">
                              <div className="aspect-square rounded-lg bg-stone-100 overflow-hidden">
                                <img src={CURATED_IMAGES[i % CURATED_IMAGES.length].url} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[10px] font-bold text-stone-900 truncate">{item.name}</p>
                              <p className="text-[10px] font-black text-stone-900">{item.price}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'promo_banner') {
                    return (
                      <div
                        key="sim-promo"
                        onClick={() => {
                          setSelectedSectionId('promo_banner');
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId('promo_banner')}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-6 bg-stone-900 text-white text-center space-y-1.5 cursor-pointer relative group ${
                          isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : isHovered ? 'ring-2 ring-stone-400/80' : ''
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-widest inline-block">
                          Exclusive Offer
                        </span>
                        <h3 className="text-sm font-black">20% Off Your First Purchase</h3>
                        <p className="text-[11px] text-stone-300">Use code PRIVILEGE at checkout for instant savings.</p>
                      </div>
                    );
                  }

                  if (sec.id === 'newsletter') {
                    return (
                      <div
                        key="sim-newsletter"
                        onClick={() => {
                          setSelectedSectionId('newsletter');
                          if (window.innerWidth < 1024) setMobileViewTab('editor');
                        }}
                        onMouseEnter={() => setHoveredSectionId('newsletter')}
                        onMouseLeave={() => setHoveredSectionId(null)}
                        className={`p-5 bg-stone-100 text-center space-y-1.5 cursor-pointer relative group ${
                          isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : isHovered ? 'ring-2 ring-stone-400/80' : ''
                        }`}
                      >
                        <h3 className="text-xs font-black text-stone-900">Join the Private Atelier Club</h3>
                        <p className="text-[10px] text-stone-500">Receive private release announcements & bespoke offers.</p>
                        <div className="max-w-xs mx-auto flex gap-1 pt-1">
                          <input
                            type="text"
                            placeholder="Enter your email"
                            disabled
                            className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs"
                          />
                          <button
                            type="button"
                            className="px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-bold"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

              {/* 4. Footer */}
              <div className="bg-white border-t border-stone-200 p-4 space-y-2 text-xs text-stone-500">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">{storeInfo.name || 'Store'}</span>
                  <span className="text-[10px]">&copy; {new Date().getFullYear()}</span>
                </div>
                <p className="text-[10px] text-stone-400">{theme.footer.aboutText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeStudio;
