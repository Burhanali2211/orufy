import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Save,
  Type,
  Layers,
  Palette,
  Sliders,
  Play,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { apiClient } from '@/shared/lib/apiClient';
import { extractPaletteFromImage, ExtractedPalette } from '@/shared/utils/colorExtractor';

export interface HeroSlideConfig {
  id?: string;
  image: string;
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

export interface HeroFullConfig {
  layout: 'carousel' | 'split' | 'immersive' | 'minimal';
  slides: HeroSlideConfig[];
  intervalSeconds: number;
  transitionEffect: 'slide' | 'fade' | 'zoom' | 'parallax';
  fontFamily: string;
  fontSizeScale: 'compact' | 'standard' | 'large' | 'massive';
  contentAlign: 'left' | 'center' | 'right';
  contentPosition: 'center-left' | 'center' | 'bottom-left' | 'top-left';
  buttonShape: 'sharp' | 'subtle' | 'rounded' | 'pill';
  buttonSize: 'sm' | 'md' | 'lg' | 'xl';
  buttonStyle: 'solid' | 'glass' | 'gradient' | 'outline' | 'tonal';
  overlayPreset: 'dark_gradient' | 'light_gradient' | 'radial_spotlight' | 'glass_frost' | 'none';
  overlayOpacity: number;
  blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light';
  pauseOnHover: boolean;
}

const STOCK_PRESETS = [
  {
    name: 'Luxury Fragrance & Gold',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80',
  },
  {
    name: 'Artisanal Amber & Glass',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80',
  },
  {
    name: 'Minimalist Boutique Flagship',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  },
  {
    name: 'Modern Noir & Silk',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&q=80',
  },
];

const FONT_OPTIONS = [
  { id: 'Playfair Display', label: 'Playfair Display (Editorial Serif)', type: 'serif' },
  { id: 'Cinzel', label: 'Cinzel (Luxury Roman)', type: 'serif' },
  { id: 'Cormorant Garamond', label: 'Cormorant Garamond (High Fashion)', type: 'serif' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Clean Modern)', type: 'sans' },
  { id: 'Inter', label: 'Inter (Precision Neutral)', type: 'sans' },
  { id: 'Outfit', label: 'Outfit (Bold Geometric)', type: 'sans' },
  { id: 'Montserrat', label: 'Montserrat (Classic Sans)', type: 'sans' },
];

export const HeroStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { config, refreshSettings } = useSettings();
  const { showSuccess, showError, showInfo } = useNotification();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Studio State ──
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'slides' | 'typography' | 'buttons' | 'overlay'>('slides');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<ExtractedPalette | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Initialize hero settings from config or sensible luxury defaults
  const [heroConfig, setHeroConfig] = useState<HeroFullConfig>(() => {
    const rawHero = (config?.hero || {}) as any;
    const defaultSlides: HeroSlideConfig[] = [
      {
        id: 'slide-1',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80',
        topTitle: 'New Haute Collection',
        titleMain: `${config?.identity?.siteName || 'Orufy'} Curated Essentials`,
        subtitle: 'Hand-crafted perfumes and distinctive luxury fragrances formulated for the discerning.',
        cta: 'Explore Collection',
        ctaLink: '/products',
        secondaryCta: 'View Lookbook',
        secondaryCtaLink: '/products?sort=newest',
        buttonBgColor: '#09090b',
        buttonTextColor: '#ffffff',
      },
      {
        id: 'slide-2',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80',
        topTitle: 'Artisanal Craftsmanship',
        titleMain: 'Pure Amber & Rare Oud',
        subtitle: 'Immerse in timeless olfactory mastery with pure organic extractions.',
        cta: 'Shop Exclusive',
        ctaLink: '/products',
        buttonBgColor: '#09090b',
        buttonTextColor: '#ffffff',
      }
    ];

    return {
      layout: rawHero.layout || 'carousel',
      slides: rawHero.slides && rawHero.slides.length > 0 ? rawHero.slides : defaultSlides,
      intervalSeconds: rawHero.intervalSeconds || 6,
      transitionEffect: rawHero.transitionEffect || 'slide',
      fontFamily: rawHero.fontFamily || 'Playfair Display',
      fontSizeScale: rawHero.fontSizeScale || 'standard',
      contentAlign: rawHero.contentAlign || 'left',
      contentPosition: rawHero.contentPosition || 'center-left',
      buttonShape: rawHero.buttonShape || 'pill',
      buttonSize: rawHero.buttonSize || 'md',
      buttonStyle: rawHero.buttonStyle || 'solid',
      overlayPreset: rawHero.overlayPreset || 'dark_gradient',
      overlayOpacity: rawHero.overlayOpacity ?? 45,
      blendMode: rawHero.blendMode || 'normal',
      pauseOnHover: rawHero.pauseOnHover ?? true,
    };
  });

  const currentSlide = heroConfig.slides[activeSlideIdx] || heroConfig.slides[0];

  // ── Analyze Current Slide Image for AI Palette ──
  useEffect(() => {
    if (currentSlide?.image) {
      setAnalyzingImage(true);
      extractPaletteFromImage(currentSlide.image)
        .then((palette) => {
          setExtractedPalette(palette);
        })
        .finally(() => {
          setAnalyzingImage(false);
        });
    }
  }, [currentSlide?.image]);

  // ── Auto Apply AI Palette ──
  const handleApplyAiPalette = () => {
    if (!extractedPalette) return;

    const updatedSlides = [...heroConfig.slides];
    updatedSlides[activeSlideIdx] = {
      ...updatedSlides[activeSlideIdx],
      buttonBgColor: extractedPalette.buttonBgColor,
      buttonTextColor: extractedPalette.buttonTextColor,
      accentColor: extractedPalette.accentColor,
    };

    setHeroConfig({
      ...heroConfig,
      slides: updatedSlides,
      overlayOpacity: extractedPalette.recommendedOverlayOpacity,
    });

    showSuccess('AI Palette Applied', `Auto-matched button color (${extractedPalette.accentColor}) & high-contrast text.`);
  };

  // ── Slide Actions ──
  const handleAddSlide = () => {
    const newSlide: HeroSlideConfig = {
      id: `slide-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
      topTitle: 'Limited Edition',
      titleMain: 'Signature Masterpiece',
      subtitle: 'Showcase your headline product release with high visual impact.',
      cta: 'Shop Now',
      ctaLink: '/products',
      buttonBgColor: '#09090b',
      buttonTextColor: '#ffffff',
    };
    setHeroConfig(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideIdx(heroConfig.slides.length);
  };

  const handleDuplicateSlide = (idx: number) => {
    const target = heroConfig.slides[idx];
    const duplicated: HeroSlideConfig = {
      ...target,
      id: `slide-${Date.now()}`,
      titleMain: `${target.titleMain} (Copy)`,
    };
    const updated = [...heroConfig.slides];
    updated.splice(idx + 1, 0, duplicated);
    setHeroConfig(prev => ({ ...prev, slides: updated }));
    setActiveSlideIdx(idx + 1);
  };

  const handleDeleteSlide = (idx: number) => {
    if (heroConfig.slides.length <= 1) {
      showError('Cannot delete', 'You must maintain at least one slide in your hero banner.');
      return;
    }
    const updated = heroConfig.slides.filter((_, i) => i !== idx);
    setHeroConfig(prev => ({ ...prev, slides: updated }));
    setActiveSlideIdx(Math.max(0, idx - 1));
  };

  const handleUpdateCurrentSlide = (patch: Partial<HeroSlideConfig>) => {
    const updated = [...heroConfig.slides];
    updated[activeSlideIdx] = {
      ...updated[activeSlideIdx],
      ...patch,
    };
    setHeroConfig(prev => ({ ...prev, slides: updated }));
  };

  // ── Image Upload ──
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid file', 'Please select an image file (JPG, PNG, WebP).');
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      handleUpdateCurrentSlide({ image: dataUrl });
      showSuccess('Image Uploaded', 'Slide image updated successfully.');
    } catch {
      showError('Upload failed', 'Could not read selected image.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // ── Save & Publish ──
  const handleSaveAndPublish = async () => {
    try {
      setIsSaving(true);
      const res = await apiClient.post<any>('/admin/settings/hero', heroConfig);
      if (res?.success) {
        await refreshSettings();
        showSuccess('Published Live', 'Hero carousel and visual settings are now live on your store!');
      } else {
        throw new Error(res?.error || 'Failed to save hero settings');
      }
    } catch (err: any) {
      showError('Save failed', err?.message || 'Could not publish hero settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Viewport Bezel Widths ──
  const viewportWidthClass =
    deviceViewport === 'desktop'
      ? 'w-full max-w-6xl'
      : deviceViewport === 'tablet'
      ? 'w-[768px] max-w-full'
      : 'w-[375px] max-w-full';

  // ── Font Size Scale Mapper ──
  const headlineSizeClass =
    heroConfig.fontSizeScale === 'compact'
      ? 'text-2xl sm:text-4xl'
      : heroConfig.fontSizeScale === 'large'
      ? 'text-4xl sm:text-6xl lg:text-7xl'
      : heroConfig.fontSizeScale === 'massive'
      ? 'text-5xl sm:text-7xl lg:text-8xl'
      : 'text-3xl sm:text-5xl lg:text-6xl';

  // ── Button Radius Mapper ──
  const buttonRadiusClass =
    heroConfig.buttonShape === 'sharp'
      ? 'rounded-none'
      : heroConfig.buttonShape === 'subtle'
      ? 'rounded-lg'
      : heroConfig.buttonShape === 'rounded'
      ? 'rounded-2xl'
      : 'rounded-full';

  // ── Button Size Mapper ──
  const buttonSizeClass =
    heroConfig.buttonSize === 'sm'
      ? 'px-5 py-2.5 text-xs'
      : heroConfig.buttonSize === 'lg'
      ? 'px-9 py-4 text-base font-bold'
      : heroConfig.buttonSize === 'xl'
      ? 'px-11 py-4.5 text-lg font-bold'
      : 'px-7 py-3 text-sm font-semibold';

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] text-stone-100 flex flex-col font-sans overflow-hidden select-none">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TOP STUDIO APP BAR (FIGMA / ELEMENTOR PRO STYLE) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header className="h-14 bg-[#18181b] border-b border-stone-800 px-4 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left: Exit & Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/settings/theme-studio')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-stone-700/60"
            title="Return to Settings"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Studio</span>
          </button>

          <div className="h-4 w-px bg-stone-700/60 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-200 tracking-wide font-serif">
              Hero Section Visual Studio
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Canvas
            </span>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-stone-900/90 rounded-xl p-1 border border-stone-800">
          <button
            type="button"
            onClick={() => setDeviceViewport('desktop')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceViewport === 'desktop' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceViewport('tablet')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceViewport === 'tablet' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceViewport('mobile')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceViewport === 'mobile' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: AI Match & Publish Action */}
        <div className="flex items-center gap-2.5">
          {extractedPalette && (
            <button
              onClick={handleApplyAiPalette}
              disabled={analyzingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 cursor-pointer"
              title="Auto-match colors from image"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">AI Match Colors</span>
            </button>
          )}

          <button
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                Publishing...
              </span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-stone-900" />
                <span>Save & Publish</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TWO-PANEL WORKSPACE (INSPECTOR CONTROLS + LIVE CANVAS) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ── LEFT PANEL: CUSTOMIZER INSPECTOR (420px) ── */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <aside className="w-full sm:w-[400px] lg:w-[440px] bg-[#18181b] border-r border-stone-800 flex flex-col flex-shrink-0 z-20 overflow-hidden">
          {/* Tabs Navigator */}
          <div className="grid grid-cols-4 p-2 bg-stone-900/90 border-b border-stone-800 gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('slides')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'slides' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Slides</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'typography' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Typography</span>
            </button>

            <button
              onClick={() => setActiveTab('buttons')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'buttons' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Buttons</span>
            </button>

            <button
              onClick={() => setActiveTab('overlay')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'overlay' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Overlay</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-stone-300">
            {/* ── TAB 1: SLIDES & MEDIA ── */}
            {activeTab === 'slides' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      Slide Carousel ({heroConfig.slides.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="inline-flex items-center gap-1 text-xs font-bold text-stone-200 bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg border border-stone-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slide</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {heroConfig.slides.map((slide, idx) => {
                      const isActive = idx === activeSlideIdx;
                      return (
                        <div
                          key={slide.id || idx}
                          onClick={() => setActiveSlideIdx(idx)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-stone-800 border-stone-500 shadow-md ring-1 ring-stone-400/20'
                              : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 border border-stone-700">
                              <img src={slide.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-100 truncate">
                                {slide.titleMain || `Slide ${idx + 1}`}
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                {slide.topTitle || 'Banner slide'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateSlide(idx);
                              }}
                              className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-700/60 transition-colors"
                              title="Duplicate Slide"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlide(idx);
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-stone-700/60 transition-colors"
                              title="Delete Slide"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Slide Image Upload */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200">
                      Active Slide Image (Slide {activeSlideIdx + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-stone-300" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="aspect-[16/9] rounded-xl overflow-hidden border border-stone-700 bg-stone-800 relative group">
                    <img src={currentSlide.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-white/90 text-stone-900 text-xs font-bold shadow-lg"
                      >
                        Replace Image
                      </button>
                    </div>
                  </div>

                  {/* Stock Luxury Presets */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-2">
                      Or Pick Curated Luxury Image:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STOCK_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleUpdateCurrentSlide({ image: preset.url })}
                          className={`p-2 rounded-xl border text-left text-[11px] font-medium transition-all truncate flex items-center gap-2 cursor-pointer ${
                            currentSlide.image === preset.url
                              ? 'bg-stone-800 border-stone-400 text-white'
                              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          <img src={preset.url} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Carousel Timing & Transitions */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-200">Carousel Dynamics</h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Slide Auto-Rotation Speed</span>
                      <span className="font-bold text-stone-100">{heroConfig.intervalSeconds} seconds</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="1"
                      value={heroConfig.intervalSeconds}
                      onChange={(e) => setHeroConfig({ ...heroConfig, intervalSeconds: Number(e.target.value) })}
                      className="w-full accent-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Transition Effect
                      </label>
                      <select
                        value={heroConfig.transitionEffect}
                        onChange={(e) => setHeroConfig({ ...heroConfig, transitionEffect: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="slide">Smooth Slide</option>
                        <option value="fade">Cross Fade</option>
                        <option value="zoom">Cinematic Zoom</option>
                        <option value="parallax">Parallax Drift</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Hero Layout Mode
                      </label>
                      <select
                        value={heroConfig.layout}
                        onChange={(e) => setHeroConfig({ ...heroConfig, layout: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="carousel">Carousel Presentation</option>
                        <option value="split">Side-by-Side Split</option>
                        <option value="immersive">Immersive Full-Bleed</option>
                        <option value="minimal">Minimal Editorial</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: TYPOGRAPHY & CONTENT ── */}
            {activeTab === 'typography' && (
              <div className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-200 block mb-1.5">
                      Top Eyebrow Badge (Slide {activeSlideIdx + 1})
                    </label>
                    <input
                      type="text"
                      value={currentSlide.topTitle || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ topTitle: e.target.value })}
                      placeholder="e.g. New Collection 2026"
                      className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:border-stone-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-200 block mb-1.5">
                      Main Display Headline
                    </label>
                    <textarea
                      rows={2}
                      value={currentSlide.titleMain || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ titleMain: e.target.value })}
                      placeholder="e.g. Rare Essence & Distinction"
                      className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:border-stone-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-200 block mb-1.5">
                      Subtitle / Narrative Description
                    </label>
                    <textarea
                      rows={3}
                      value={currentSlide.subtitle || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ subtitle: e.target.value })}
                      placeholder="Enter supporting brand copy..."
                      className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:border-stone-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Font Family Selector */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-200">Typography Suite</h4>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      Headline Font Family
                    </label>
                    <select
                      value={heroConfig.fontFamily}
                      onChange={(e) => setHeroConfig({ ...heroConfig, fontFamily: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Headline Size Scale
                      </label>
                      <select
                        value={heroConfig.fontSizeScale}
                        onChange={(e) => setHeroConfig({ ...heroConfig, fontSizeScale: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="compact">Compact</option>
                        <option value="standard">Standard</option>
                        <option value="large">Display Large</option>
                        <option value="massive">Massive Hero</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Content Alignment
                      </label>
                      <select
                        value={heroConfig.contentAlign}
                        onChange={(e) => setHeroConfig({ ...heroConfig, contentAlign: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="left">Align Left</option>
                        <option value="center">Align Center</option>
                        <option value="right">Align Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: BUTTONS & CTAS ── */}
            {activeTab === 'buttons' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-200">Primary Call-to-Action</h4>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={currentSlide.cta || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ cta: e.target.value })}
                      placeholder="e.g. Shop Now"
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={currentSlide.ctaLink || '/products'}
                      onChange={(e) => handleUpdateCurrentSlide({ ctaLink: e.target.value })}
                      placeholder="/products"
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200">Secondary Action (Optional)</h4>
                    <input
                      type="checkbox"
                      checked={Boolean(currentSlide.secondaryCta)}
                      onChange={(e) => {
                        handleUpdateCurrentSlide({
                          secondaryCta: e.target.checked ? 'View Catalog' : '',
                          secondaryCtaLink: e.target.checked ? '/products' : ''
                        });
                      }}
                      className="w-4 h-4 accent-white"
                    />
                  </div>

                  {currentSlide.secondaryCta && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                          Secondary Button Label
                        </label>
                        <input
                          type="text"
                          value={currentSlide.secondaryCta}
                          onChange={(e) => handleUpdateCurrentSlide({ secondaryCta: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                          Secondary Destination Link
                        </label>
                        <input
                          type="text"
                          value={currentSlide.secondaryCtaLink || '/products'}
                          onChange={(e) => handleUpdateCurrentSlide({ secondaryCtaLink: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-stone-100 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Shape & Sizing */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-200">Button Shape & Sizing</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Corner Radius (Shape)
                      </label>
                      <select
                        value={heroConfig.buttonShape}
                        onChange={(e) => setHeroConfig({ ...heroConfig, buttonShape: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="pill">Full Pill (9999px)</option>
                        <option value="rounded">Rounded (16px)</option>
                        <option value="subtle">Subtle (8px)</option>
                        <option value="sharp">Sharp (0px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                        Button Size
                      </label>
                      <select
                        value={heroConfig.buttonSize}
                        onChange={(e) => setHeroConfig({ ...heroConfig, buttonSize: e.target.value as any })}
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Button Background
                      </label>
                      <div className="flex items-center gap-2 bg-stone-800 p-1.5 rounded-xl border border-stone-700">
                        <input
                          type="color"
                          value={currentSlide.buttonBgColor || '#09090b'}
                          onChange={(e) => handleUpdateCurrentSlide({ buttonBgColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[11px] font-mono text-stone-200 uppercase">
                          {currentSlide.buttonBgColor || '#09090b'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Button Text Color
                      </label>
                      <div className="flex items-center gap-2 bg-stone-800 p-1.5 rounded-xl border border-stone-700">
                        <input
                          type="color"
                          value={currentSlide.buttonTextColor || '#ffffff'}
                          onChange={(e) => handleUpdateCurrentSlide({ buttonTextColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[11px] font-mono text-stone-200 uppercase">
                          {currentSlide.buttonTextColor || '#ffffff'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: OVERLAY, BLEND & AI PALETTE ── */}
            {activeTab === 'overlay' && (
              <div className="space-y-5">
                {/* AI Palette Extractor Card */}
                {extractedPalette && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-stone-900 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-300">
                          AI Image Color Extractor
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-semibold uppercase">Active Slide</span>
                    </div>

                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Extracted harmonious tones directly from this photo to prevent color clash & ensure readability.
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md border border-stone-600"
                          style={{ backgroundColor: extractedPalette.dominantColor }}
                          title={`Dominant: ${extractedPalette.dominantColor}`}
                        />
                        <div
                          className="w-5 h-5 rounded-md border border-stone-600"
                          style={{ backgroundColor: extractedPalette.accentColor }}
                          title={`Accent: ${extractedPalette.accentColor}`}
                        />
                      </div>
                      <button
                        onClick={handleApplyAiPalette}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Apply AI Matched Colors
                      </button>
                    </div>
                  </div>
                )}

                {/* Overlay Preset */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-200">Overlay & Atmospheric Blend</h4>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      Vignette Style
                    </label>
                    <select
                      value={heroConfig.overlayPreset}
                      onChange={(e) => setHeroConfig({ ...heroConfig, overlayPreset: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                    >
                      <option value="dark_gradient">Dark Gradient Vignette (Recommended)</option>
                      <option value="light_gradient">Light Subtle Tint</option>
                      <option value="radial_spotlight">Radial Spotlight Focus</option>
                      <option value="glass_frost">Glass Frost Backdrop</option>
                      <option value="none">No Overlay (Raw Image)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Overlay Opacity</span>
                      <span className="font-bold text-stone-100">{heroConfig.overlayOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={heroConfig.overlayOpacity}
                      onChange={(e) => setHeroConfig({ ...heroConfig, overlayOpacity: Number(e.target.value) })}
                      className="w-full accent-white"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      Image Blend Mode
                    </label>
                    <select
                      value={heroConfig.blendMode}
                      onChange={(e) => setHeroConfig({ ...heroConfig, blendMode: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 outline-none"
                    >
                      <option value="normal">Normal (Standard)</option>
                      <option value="multiply">Multiply (Deeper Contrast)</option>
                      <option value="overlay">Overlay (Vibrant Fusion)</option>
                      <option value="soft-light">Soft Light (Velvet Smooth)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ── RIGHT PANEL: LIVE INTERACTIVE CANVAS PREVIEW ── */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto relative">
          {/* Canvas Viewport Frame */}
          <div
            className={`transition-all duration-300 bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-800 relative ${viewportWidthClass}`}
            style={{
              fontFamily: heroConfig.fontFamily,
              minHeight: deviceViewport === 'mobile' ? '600px' : '520px',
            }}
          >
            {/* Live Store Hero Banner Simulator */}
            <div className="relative w-full h-[580px] overflow-hidden bg-stone-50 flex flex-col justify-center">
              {/* Background Image Slide with configured blend & overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.titleMain}
                  style={{ mixBlendMode: heroConfig.blendMode }}
                  className="w-full h-full object-cover transition-all duration-500"
                />

                {/* Configured Overlay */}
                {heroConfig.overlayPreset === 'dark_gradient' && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent"
                    style={{ opacity: heroConfig.overlayOpacity / 100 }}
                  />
                )}
                {heroConfig.overlayPreset === 'light_gradient' && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent"
                    style={{ opacity: heroConfig.overlayOpacity / 100 }}
                  />
                )}
                {heroConfig.overlayPreset === 'radial_spotlight' && (
                  <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black/90"
                    style={{ opacity: heroConfig.overlayOpacity / 100 }}
                  />
                )}
                {heroConfig.overlayPreset === 'glass_frost' && (
                  <div
                    className="absolute inset-0 backdrop-blur-xs bg-black/30"
                    style={{ opacity: heroConfig.overlayOpacity / 100 }}
                  />
                )}
              </div>

              {/* Text & Action Layer */}
              <div className="relative z-10 max-w-4xl px-8 sm:px-14 py-12">
                <div
                  className={`space-y-5 ${
                    heroConfig.contentAlign === 'center'
                      ? 'text-center mx-auto items-center flex flex-col'
                      : heroConfig.contentAlign === 'right'
                      ? 'text-right ml-auto items-end flex flex-col'
                      : 'text-left'
                  }`}
                >
                  {/* Top Badge */}
                  {currentSlide.topTitle && (
                    <span
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 text-white"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{currentSlide.topTitle}</span>
                    </span>
                  )}

                  {/* Headline */}
                  <h1
                    className={`font-bold tracking-tight text-white leading-[1.08] drop-shadow-md max-w-2xl ${headlineSizeClass}`}
                  >
                    {currentSlide.titleMain || 'Headline Display'}
                  </h1>

                  {/* Subtitle */}
                  {currentSlide.subtitle && (
                    <p className="text-sm sm:text-base text-stone-200 font-normal leading-relaxed max-w-xl drop-shadow-sm">
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {currentSlide.cta && (
                      <button
                        type="button"
                        style={{
                          backgroundColor: currentSlide.buttonBgColor || '#09090b',
                          color: currentSlide.buttonTextColor || '#ffffff',
                        }}
                        className={`inline-flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${buttonRadiusClass} ${buttonSizeClass}`}
                      >
                        <span>{currentSlide.cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {currentSlide.secondaryCta && (
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 transition-transform active:scale-95 ${buttonRadiusClass} ${buttonSizeClass}`}
                      >
                        <span>{currentSlide.secondaryCta}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide Dots / Pagination */}
              {heroConfig.slides.length > 1 && (
                <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2">
                  {heroConfig.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlideIdx(i)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        i === activeSlideIdx ? 'w-8 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Prev / Next Slide Arrows */}
              {heroConfig.slides.length > 1 && (
                <div className="absolute inset-y-0 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={() => setActiveSlideIdx((activeSlideIdx - 1 + heroConfig.slides.length) % heroConfig.slides.length)}
                    className="p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md pointer-events-auto transition-colors cursor-pointer border border-white/10"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveSlideIdx((activeSlideIdx + 1) % heroConfig.slides.length)}
                    className="p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md pointer-events-auto transition-colors cursor-pointer border border-white/10"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HeroStudioPage;
