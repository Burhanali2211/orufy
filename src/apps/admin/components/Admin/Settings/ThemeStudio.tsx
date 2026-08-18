import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache, injectGoogleFont, StorefrontThemeStudio, StorefrontHero, DEFAULT_THEME_STUDIO, HeroSlide } from '@/shared/contexts/SettingsContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Trash2,
  Type,
  Sliders,
  Store,
  Image as ImageIcon,
  Megaphone,
  Check,
  ExternalLink,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Truck,
  Headphones
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

/* ─── Curated Unsplash Luxury Imagery ─── */
const CURATED_IMAGES = [
  { title: 'Oud & Amber Luxury', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1600&q=80' },
  { title: 'Flagship Fragrance Atelier', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80' },
  { title: 'Luxury Minimalist Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80' },
  { title: 'Bespoke Bottle Display', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80' },
  { title: 'Golden Essences', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80' },
];

type StudioTab = 'sections' | 'hero' | 'palette' | 'typography' | 'header' | 'footer';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const ThemeStudio: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<StudioTab>('sections');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [storeInfo, setStoreInfo] = useState({ name: '', logo_url: '', hostname: '' });
  const [theme, setTheme] = useState<StorefrontThemeStudio>(DEFAULT_THEME_STUDIO);
  const [hero, setHero] = useState<StorefrontHero>({
    layout: 'carousel',
    topTitle: 'New Collection',
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your best products with beautiful, high-resolution imagery',
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
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-theme-studio'],
    queryFn: () => apiClient.get('/admin/settings/theme-studio'),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      if (data.store) setStoreInfo(data.store);
      if (data.theme) setTheme({ ...DEFAULT_THEME_STUDIO, ...data.theme });
      if (data.hero) setHero(data.hero);
    }
  }, [data]);

  // Dynamically load selected font in preview
  useEffect(() => {
    if (theme?.typography?.headingFont) {
      injectGoogleFont(theme.typography.headingFont);
    }
  }, [theme?.typography?.headingFont]);

  const publishMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admin/settings/theme-studio', payload),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Theme customization published live to storefront!');
      queryClient.invalidateQueries({ queryKey: ['admin-theme-studio'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hero-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to publish theme settings');
    }
  });

  const handlePublish = () => {
    publishMutation.mutate({
      store: storeInfo,
      hero,
      theme,
    });
  };

  const toggleSection = (id: string) => {
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
      topTitle: 'Artisanal Reserve',
      titleMain: 'Handcrafted Fragrances',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const currentSlide = hero.slides?.[activeSlideIndex] || hero.slides?.[0] || {
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your finest items with high-resolution imagery.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  };

  const storeInitial = (storeInfo.name || 'Store').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top Bar ── */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              Storefront Theme Studio
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900">
                Live Studio
              </span>
            </h1>
            <p className="text-stone-500 text-xs mt-0.5">Drag-and-drop block reordering, hero layouts, luxury palettes, and real-time live preview.</p>
          </div>
        </div>

        {/* Device Mode Switcher & Publish CTA */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deviceMode === 'desktop' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deviceMode === 'tablet' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                deviceMode === 'mobile' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-all shadow-md disabled:opacity-50"
          >
            {publishMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish Live
          </button>
        </div>
      </div>

      {/* ── Main Studio Grid (Inspector Left, Live Simulation Canvas Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Inspector Panel ── */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200">
            {[
              { id: 'sections', label: 'Blocks', icon: Layers },
              { id: 'hero', label: 'Hero', icon: Sparkles },
              { id: 'palette', label: 'Colors', icon: Palette },
              { id: 'typography', label: 'Fonts', icon: Type },
              { id: 'header', label: 'Header', icon: Layout },
              { id: 'footer', label: 'Footer', icon: Store },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="text-[10px] truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Sections Drag & Drop Reordering */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900">Homepage Section Order</h3>
                <p className="text-xs text-stone-500 mt-0.5">Drag blocks to reorder them on the storefront homepage. Click the eye to show or hide.</p>
              </div>

              <Reorder.Group
                axis="y"
                values={theme.sections}
                onReorder={handleReorderSections}
                className="space-y-2"
              >
                {theme.sections.map((section) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors ${
                      section.enabled
                        ? 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                        : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-stone-400" />
                      <span className="text-xs font-bold text-stone-800">{section.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.id);
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        section.enabled
                          ? 'text-stone-700 hover:bg-stone-100'
                          : 'text-stone-400 hover:bg-stone-200'
                      }`}
                      title={section.enabled ? 'Hide Section' : 'Show Section'}
                    >
                      {section.enabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}

          {/* TAB 2: Hero Layout & Content */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Hero Layout Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'carousel', label: 'Dynamic Carousel', icon: Layers },
                    { id: 'split', label: 'Split Showcase', icon: Columns },
                    { id: 'minimal', label: 'Editorial Minimal', icon: Layout },
                    { id: 'immersive', label: 'Full-Bleed Banner', icon: Maximize2 },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setHero({ ...hero, layout: style.id as any })}
                      className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                        hero.layout === style.id
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <style.icon className="w-4 h-4" />
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {hero.layout === 'carousel' ? (
                <div className="space-y-4 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">Slides ({hero.slides?.length || 0})</span>
                    <button
                      type="button"
                      onClick={addHeroSlide}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Slide
                    </button>
                  </div>

                  {/* Slide Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {(hero.slides || []).map((slide, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSlideIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                          activeSlideIndex === idx
                            ? 'bg-stone-900 text-white'
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
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Badge / Eyebrow</label>
                      <input
                        type="text"
                        value={currentSlide.topTitle || ''}
                        onChange={(e) => updateCurrentSlide('topTitle', e.target.value)}
                        placeholder="e.g. New Collection"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Headline Text</label>
                      <input
                        type="text"
                        value={currentSlide.titleMain || ''}
                        onChange={(e) => updateCurrentSlide('titleMain', e.target.value)}
                        placeholder="e.g. Pure Artisanal Fragrances"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Subtitle</label>
                      <textarea
                        rows={2}
                        value={currentSlide.subtitle || ''}
                        onChange={(e) => updateCurrentSlide('subtitle', e.target.value)}
                        placeholder="e.g. Handcrafted with rare botanical extracts."
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={currentSlide.image || ''}
                        onChange={(e) => updateCurrentSlide('image', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={hero.topTitle || ''}
                      onChange={(e) => setHero({ ...hero, topTitle: e.target.value })}
                      placeholder="e.g. Exclusive Edition"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Headline</label>
                    <input
                      type="text"
                      value={hero.titleMain || ''}
                      onChange={(e) => setHero({ ...hero, titleMain: e.target.value })}
                      placeholder="e.g. Discover Rare Perfumes"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Subtitle</label>
                    <textarea
                      rows={2}
                      value={hero.subtitle || ''}
                      onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                      placeholder="e.g. Designed for true connoisseurs."
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Background Image URL</label>
                    <input
                      type="text"
                      value={hero.backgroundImage || ''}
                      onChange={(e) => setHero({ ...hero, backgroundImage: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Curated Imagery Quick Picker */}
              <div className="pt-3 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-600 block mb-2">1-Click Curated Luxury Photos:</span>
                <div className="grid grid-cols-5 gap-2">
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
                      className="aspect-square rounded-xl overflow-hidden border border-stone-200 hover:ring-2 hover:ring-stone-900 transition-all"
                      title={img.title}
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Palette Studio */}
          {activeTab === 'palette' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Curated Luxury Color Schemes
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CURATED_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => selectPalette(pal)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        theme.palette.id === pal.id
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: pal.primary }} />
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: pal.accent }} />
                        <div className="w-4 h-4 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: pal.background }} />
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">{pal.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Hex Pickers */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">Custom Brand Palette</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.palette.primary}
                        onChange={(e) => setTheme({ ...theme, palette: { ...theme.palette, primary: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={theme.palette.primary}
                        onChange={(e) => setTheme({ ...theme, palette: { ...theme.palette, primary: e.target.value } })}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.palette.accent}
                        onChange={(e) => setTheme({ ...theme, palette: { ...theme.palette, accent: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={theme.palette.accent}
                        onChange={(e) => setTheme({ ...theme, palette: { ...theme.palette, accent: e.target.value } })}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Typography Studio */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Google Fonts Catalog
                </label>
                <div className="space-y-2">
                  {CURATED_FONTS.map((font) => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => selectFont(font.name)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        theme.typography.headingFont === font.name
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold block" style={{ fontFamily: font.name }}>{font.name}</span>
                        <span className={`text-[10px] ${theme.typography.headingFont === font.name ? 'text-stone-300' : 'text-stone-500'}`}>
                          {font.category}
                        </span>
                      </div>
                      {theme.typography.headingFont === font.name && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Header, Logo & Announcement Bar */}
          {activeTab === 'header' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Store Display Name
                </label>
                <input
                  type="text"
                  value={storeInfo.name}
                  onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                  placeholder="e.g. EasyIO Luxury"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Store Logo URL
                  </label>
                  {storeInfo.logo_url && (
                    <button
                      type="button"
                      onClick={() => setStoreInfo({ ...storeInfo, logo_url: '' })}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      Delete Logo (Use Monogram)
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={storeInfo.logo_url}
                  onChange={(e) => setStoreInfo({ ...storeInfo, logo_url: e.target.value })}
                  placeholder="https://... (Leave empty for clean monogram)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">Announcement Banner Strip</span>
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
                    placeholder="e.g. Free shipping on orders over ₹499"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Footer & Policies */}
          {activeTab === 'footer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  About Blurb Text
                </label>
                <textarea
                  rows={3}
                  value={theme.footer.aboutText}
                  onChange={(e) => setTheme({ ...theme, footer: { ...theme.footer, aboutText: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                  <span className="text-xs font-bold text-stone-800">Newsletter Subscription Form</span>
                  <input
                    type="checkbox"
                    checked={theme.footer.showNewsletter}
                    onChange={(e) => setTheme({ ...theme, footer: { ...theme.footer, showNewsletter: e.target.checked } })}
                    className="w-4 h-4 accent-stone-900"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                  <span className="text-xs font-bold text-stone-800">Trust & Security Badges</span>
                  <input
                    type="checkbox"
                    checked={theme.footer.showTrustBadges}
                    onChange={(e) => setTheme({ ...theme, footer: { ...theme.footer, showTrustBadges: e.target.checked } })}
                    className="w-4 h-4 accent-stone-900"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Canvas: Live Interactive Storefront Simulation ── */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-stone-700" /> Interactive Simulation Canvas
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {deviceMode === 'desktop' ? '100% Full View' : deviceMode === 'tablet' ? '768px View' : '375px Mobile View'}
            </span>
          </div>

          <div
            className={`w-full transition-all duration-300 rounded-3xl overflow-hidden border-4 border-stone-800 shadow-2xl bg-white ${
              deviceMode === 'mobile'
                ? 'max-w-[375px]'
                : deviceMode === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            {/* Browser / Device Chrome Header */}
            <div className="bg-stone-800 text-stone-400 px-4 py-2 flex items-center justify-between text-[11px] select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-[10px] truncate max-w-[200px]">
                https://{storeInfo.hostname || 'easyio.get-oru.com'}
              </span>
              <div className="w-4" />
            </div>

            {/* Simulated Live Storefront Body */}
            <div
              className="max-h-[620px] overflow-y-auto scrollbar-hide text-stone-900"
              style={{
                backgroundColor: theme.palette.background,
                fontFamily: `'${theme.typography.headingFont}', sans-serif`,
              }}
            >
              {/* 1. Announcement Bar */}
              {theme.header.showAnnouncement && (
                <div
                  className="py-2 px-3 text-center text-xs font-bold tracking-wide"
                  style={{
                    backgroundColor: theme.palette.primary,
                    color: '#ffffff',
                  }}
                >
                  {theme.header.announcementText}
                </div>
              )}

              {/* 2. Header */}
              <div className="bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {storeInfo.logo_url ? (
                    <img
                      src={storeInfo.logo_url}
                      alt="Logo"
                      className="h-8 w-auto max-w-[120px] object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center text-xs shadow-sm"
                      style={{ backgroundColor: theme.palette.primary }}
                    >
                      {storeInitial}
                    </div>
                  )}
                  <span className="font-extrabold text-sm tracking-tight text-stone-900">
                    {storeInfo.name || 'Store'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                  <span className="px-2 py-1 rounded-md bg-stone-100">Products</span>
                  <span className="px-2 py-1 rounded-md bg-stone-100">Categories</span>
                  <span className="px-2.5 py-1 rounded-full bg-stone-900 text-white font-bold text-[11px]">
                    Cart (0)
                  </span>
                </div>
              </div>

              {/* 3. Render Simulated Sections in Configured Order */}
              {theme.sections
                .filter((s) => s.enabled)
                .map((sec) => {
                  if (sec.id === 'hero') {
                    return (
                      <div key="sim-hero" className="border-b border-stone-200/60">
                        {hero.layout === 'minimal' && (
                          <div className="py-14 px-6 text-center space-y-3 bg-white">
                            {hero.topTitle && (
                              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-900 text-[10px] font-bold uppercase tracking-widest inline-block">
                                {hero.topTitle}
                              </span>
                            )}
                            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                              {hero.titleMain || 'Discover Curated Luxury'}
                            </h2>
                            <p className="text-stone-500 text-xs max-w-md mx-auto">{hero.subtitle}</p>
                            <div className="pt-2">
                              <span
                                className="px-5 py-2 rounded-full text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {hero.cta || 'Shop Now'} <ArrowRight className="w-3.5 h-3.5" />
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
                            <div className="relative z-10 space-y-2 max-w-sm">
                              {hero.topTitle && (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest">
                                  {hero.topTitle}
                                </span>
                              )}
                              <h2 className="text-xl sm:text-2xl font-black">{hero.titleMain || 'Immersive Flagship'}</h2>
                              <p className="text-stone-200 text-xs">{hero.subtitle}</p>
                              <div className="pt-1">
                                <span className="px-4 py-1.5 rounded-full bg-white text-stone-900 text-xs font-bold inline-flex items-center gap-1">
                                  {hero.cta || 'Explore'} <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {hero.layout === 'split' && (
                          <div className="p-6 grid grid-cols-2 gap-4 items-center bg-white">
                            <div className="space-y-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-900 text-[9px] font-bold uppercase tracking-widest inline-block">
                                {hero.topTitle || 'New'}
                              </span>
                              <h2 className="text-lg font-black text-stone-900">{hero.titleMain || 'Exclusive Pieces'}</h2>
                              <p className="text-stone-500 text-[11px] line-clamp-2">{hero.subtitle}</p>
                              <span
                                className="px-4 py-1.5 rounded-full text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {hero.cta || 'Shop Now'} <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            <div className="aspect-video rounded-xl overflow-hidden bg-stone-100">
                              <img src={hero.backgroundImage || currentSlide.image} alt="Hero" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}

                        {hero.layout === 'carousel' && (
                          <div className="p-6 grid grid-cols-2 gap-4 items-center bg-stone-50">
                            <div className="space-y-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-900 text-[9px] font-bold uppercase tracking-widest inline-block">
                                {currentSlide.topTitle || 'Featured'}
                              </span>
                              <h2 className="text-lg font-black text-stone-900 leading-tight">{currentSlide.titleMain}</h2>
                              <p className="text-stone-600 text-[11px] line-clamp-2">{currentSlide.subtitle}</p>
                              <span
                                className="px-4 py-1.5 rounded-full text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                                style={{ backgroundColor: theme.palette.primary }}
                              >
                                {currentSlide.cta || 'Shop Now'} <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            <div className="aspect-video rounded-xl overflow-hidden bg-stone-200">
                              <img src={currentSlide.image} alt="Hero" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (sec.id === 'category_chips') {
                    return (
                      <div key="sim-cat" className="px-4 py-4 bg-white border-b border-stone-100 flex gap-2 overflow-x-auto scrollbar-hide">
                        {['All Items', 'Perfumes', 'Attars', 'Gift Sets', 'Accessories'].map((cat, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                              i === 0 ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700'
                            }`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    );
                  }

                  if (sec.id === 'featured_products') {
                    return (
                      <div key="sim-featured" className="p-6 bg-stone-50 border-b border-stone-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold text-stone-900">Featured Essentials</h3>
                          <span className="text-[11px] font-bold text-stone-500">View All →</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Orufy Amber Essence', price: '₹2,499' },
                            { name: 'Gwendolyn Forbes Attar', price: '₹552' },
                          ].map((p, i) => (
                            <div key={i} className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm space-y-2">
                              <div className="aspect-square rounded-xl bg-stone-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80" alt="Product" className="w-full h-full object-cover" />
                              </div>
                              <h4 className="text-xs font-bold text-stone-900 truncate">{p.name}</h4>
                              <p className="text-xs font-extrabold text-stone-900">{p.price}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'bento_grid') {
                    return (
                      <div key="sim-bento" className="p-6 bg-white border-b border-stone-100 space-y-3">
                        <h3 className="text-sm font-extrabold text-stone-900">Shop by Category</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {['Luxury Perfumes', 'Rare Attars', 'Signature Essences', 'Gift Boxes'].map((c, i) => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-stone-100 p-3 flex flex-col justify-end border border-stone-200">
                              <span className="text-xs font-bold text-stone-900">{c}</span>
                              <span className="text-[10px] text-stone-500">Explore Collection →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'latest_arrivals') {
                    return (
                      <div key="sim-latest" className="p-6 bg-stone-50 border-b border-stone-100 space-y-3">
                        <h3 className="text-sm font-extrabold text-stone-900">Fresh Releases</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Mohammad Shaw Blend', price: '₹529' },
                            { name: 'Pure Rose Damascena', price: '₹1,899' },
                          ].map((p, i) => (
                            <div key={i} className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm space-y-1">
                              <div className="aspect-square rounded-xl bg-stone-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&q=80" alt="Product" className="w-full h-full object-cover" />
                              </div>
                              <h4 className="text-xs font-bold text-stone-900 truncate">{p.name}</h4>
                              <p className="text-xs font-extrabold text-stone-900">{p.price}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (sec.id === 'promo_banner') {
                    return (
                      <div key="sim-promo" className="p-6 bg-white border-b border-stone-100 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
                            <ShieldCheck className="w-4 h-4 text-stone-800 mb-1" />
                            <span className="text-[10px] font-bold text-stone-900">100% Authentic</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
                            <Truck className="w-4 h-4 text-stone-800 mb-1" />
                            <span className="text-[10px] font-bold text-stone-900">Fast Shipping</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col items-center">
                            <Headphones className="w-4 h-4 text-stone-800 mb-1" />
                            <span className="text-[10px] font-bold text-stone-900">Live Support</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

              {/* 4. Footer */}
              <div className="bg-stone-900 text-stone-300 p-6 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white text-stone-900 font-bold flex items-center justify-center text-[10px]">
                    {storeInitial}
                  </div>
                  <span className="font-bold text-white text-sm">{storeInfo.name || 'Store'}</span>
                </div>
                <p className="text-[11px] text-stone-400">{theme.footer.aboutText}</p>
                <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-500">
                  {theme.footer.copyrightText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeStudio;
