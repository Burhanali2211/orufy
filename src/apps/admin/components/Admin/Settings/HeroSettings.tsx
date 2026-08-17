import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache } from '@/shared/contexts/SettingsContext';
import {
  Sparkles,
  Layout,
  Layers,
  Maximize2,
  Columns,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';

interface HeroSlide {
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

interface HeroSettingsData {
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

const DEFAULT_HERO_SETTINGS: HeroSettingsData = {
  layout: 'carousel',
  topTitle: 'New Collection',
  titleMain: 'Curated Essentials',
  subtitle: 'Showcase your best products with beautiful, high-resolution imagery',
  cta: 'Shop Now',
  ctaLink: '/products',
  secondaryCta: 'View Catalog',
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
};

export const HeroSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HeroSettingsData>(DEFAULT_HERO_SETTINGS);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-hero-settings'],
    queryFn: () => apiClient.get('/admin/settings/hero'),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setForm({
        ...DEFAULT_HERO_SETTINGS,
        ...data,
        slides: data.slides && data.slides.length > 0 ? data.slides : DEFAULT_HERO_SETTINGS.slides
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: HeroSettingsData) => apiClient.post('/admin/settings/hero', payload),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Hero section settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-hero-settings'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to save hero section settings');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80',
      topTitle: 'Special Edition',
      titleMain: 'Bespoke Collection',
      subtitle: 'Handpicked products crafted for timeless quality.',
      cta: 'Explore',
      ctaLink: '/products',
    };
    const updatedSlides = [...(form.slides || []), newSlide];
    setForm({ ...form, slides: updatedSlides });
    setActiveSlideIndex(updatedSlides.length - 1);
  };

  const removeSlide = (index: number) => {
    const updated = (form.slides || []).filter((_, i) => i !== index);
    setForm({ ...form, slides: updated });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const updateCurrentSlide = (field: keyof HeroSlide, value: string) => {
    const slides = [...(form.slides || [])];
    if (slides[activeSlideIndex]) {
      slides[activeSlideIndex] = { ...slides[activeSlideIndex], [field]: value };
      setForm({ ...form, slides });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const currentSlide = form.slides?.[activeSlideIndex] || form.slides?.[0] || DEFAULT_HERO_SETTINGS.slides![0];

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Hero Section Customizer</h1>
            <p className="text-stone-500 text-sm mt-0.5">Customize your storefront top banner layout, headlines, slides, and call-to-actions.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition-all shadow-md disabled:opacity-50"
        >
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* 1. Layout Style Selector */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-stone-700" /> Choose Hero Layout Style
          </h2>
          <p className="text-stone-500 text-sm mt-1">Select how your brand is introduced to visiting customers.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { id: 'carousel', label: 'Dynamic Carousel', icon: Layers, desc: 'Multi-slide presentation with animated transitions & dots.' },
            { id: 'split', label: 'Split Showcase', icon: Columns, desc: 'Headline on the left, prominent visual showcase on the right.' },
            { id: 'minimal', label: 'Editorial Minimal', icon: Layout, desc: 'Clean typography, centered focus, distraction-free elegance.' },
            { id: 'immersive', label: 'Immersive Full-Bleed', icon: Maximize2, desc: 'Full-screen visual backdrop with bold headline overlay.' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setForm({ ...form, layout: item.id as any })}
              className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                form.layout === item.id
                  ? 'border-stone-900 bg-stone-50/80 ring-2 ring-stone-900/10'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${form.layout === item.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">{item.label}</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              {form.layout === item.id && (
                <span className="mt-3 text-[11px] font-bold text-stone-900 uppercase tracking-widest">Active Style</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Slide Manager (For Carousel) or Content Fields (For Other Layouts) */}
      {form.layout === 'carousel' ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Carousel Slides</h2>
              <p className="text-stone-500 text-sm mt-0.5">Manage slides rotated on the homepage.</p>
            </div>

            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-900 font-bold text-xs hover:bg-stone-200 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Slide
            </button>
          </div>

          {/* Slide Tab Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(form.slides || []).map((slide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSlideIndex === idx
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>Slide {idx + 1}: {slide.titleMain || 'Untitled'}</span>
                {(form.slides || []).length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(idx);
                    }}
                    className="hover:text-red-300 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Edit Current Slide Fields */}
          {currentSlide && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Eyebrow / Badge Text
                  </label>
                  <input
                    type="text"
                    value={currentSlide.topTitle || ''}
                    onChange={(e) => updateCurrentSlide('topTitle', e.target.value)}
                    placeholder="e.g. New Collection / Summer Exclusive"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Main Headline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentSlide.titleMain || ''}
                    onChange={(e) => updateCurrentSlide('titleMain', e.target.value)}
                    placeholder="e.g. Artisanal Fragrances & Rare Attars"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Subtitle / Supporting Copy
                  </label>
                  <textarea
                    rows={3}
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => updateCurrentSlide('subtitle', e.target.value)}
                    placeholder="e.g. Handcrafted with authentic botanical essences."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Background Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSlide.image || ''}
                      onChange={(e) => updateCurrentSlide('image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                    />
                  </div>
                  {currentSlide.image && (
                    <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                      <img src={currentSlide.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Primary CTA Text
                    </label>
                    <input
                      type="text"
                      value={currentSlide.cta || ''}
                      onChange={(e) => updateCurrentSlide('cta', e.target.value)}
                      placeholder="Shop Now"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Primary CTA Link
                    </label>
                    <input
                      type="text"
                      value={currentSlide.ctaLink || ''}
                      onChange={(e) => updateCurrentSlide('ctaLink', e.target.value)}
                      placeholder="/products"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Static Banner Fields for Split, Minimal, or Immersive */
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900">Hero Content & Copy</h2>
            <p className="text-stone-500 text-sm mt-0.5">Customize the text and imagery displayed in your {form.layout} hero.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Eyebrow / Badge Text
                </label>
                <input
                  type="text"
                  value={form.topTitle || ''}
                  onChange={(e) => setForm({ ...form, topTitle: e.target.value })}
                  placeholder="e.g. NEW ARRIVALS 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={form.titleMain || ''}
                  onChange={(e) => setForm({ ...form, titleMain: e.target.value })}
                  placeholder="e.g. Discover Pure Timeless Elegance"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Subtitle / Description
                </label>
                <textarea
                  rows={3}
                  value={form.subtitle || ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g. Artisanal creations curated for discerning customers worldwide."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Background / Visual Image URL
                </label>
                <input
                  type="text"
                  value={form.backgroundImage || ''}
                  onChange={(e) => setForm({ ...form, backgroundImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                />
                {form.backgroundImage && (
                  <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img src={form.backgroundImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={form.cta || ''}
                    onChange={(e) => setForm({ ...form, cta: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={form.ctaLink || ''}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    placeholder="/products"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Secondary Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.secondaryCta || ''}
                    onChange={(e) => setForm({ ...form, secondaryCta: e.target.value })}
                    placeholder="View Catalog"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={form.secondaryCtaLink || ''}
                    onChange={(e) => setForm({ ...form, secondaryCtaLink: e.target.value })}
                    placeholder="/categories"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Interactive Preview */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg font-bold text-stone-900">Live Real-time Preview</h2>
          </div>
          <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Layout: {form.layout}
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 p-6 sm:p-10 relative min-h-[300px] flex flex-col justify-center">
          {form.layout === 'minimal' && (
            <div className="text-center max-w-2xl mx-auto space-y-4">
              {form.topTitle && (
                <span className="inline-block px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-widest">
                  {form.topTitle}
                </span>
              )}
              <h3 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {form.titleMain || 'Discover Timeless Scents'}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {form.subtitle || 'Handcrafted luxury attars and rare perfumes.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <span className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                  {form.cta || 'Shop Now'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {form.layout === 'immersive' && (
            <div className="relative rounded-xl overflow-hidden p-8 sm:p-12 text-center text-white flex flex-col items-center justify-center min-h-[260px]">
              <img
                src={form.backgroundImage || currentSlide?.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80'}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 space-y-3 max-w-lg">
                {form.topTitle && (
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                    {form.topTitle}
                  </span>
                )}
                <h3 className="text-2xl sm:text-3xl font-black">{form.titleMain || 'Immersive Flagship'}</h3>
                <p className="text-stone-200 text-xs">{form.subtitle || 'Experience the essence of elegance.'}</p>
                <div className="pt-2">
                  <span className="px-6 py-2 bg-white text-stone-900 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                    {form.cta || 'Explore'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {form.layout === 'split' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                {form.topTitle && (
                  <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-widest">
                    {form.topTitle}
                  </span>
                )}
                <h3 className="text-2xl font-black text-stone-900">{form.titleMain || 'Exclusive Collection'}</h3>
                <p className="text-stone-500 text-xs">{form.subtitle || 'Artisanal masterpieces made for you.'}</p>
                <div className="pt-2">
                  <span className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                    {form.cta || 'Shop Now'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-stone-200">
                <img
                  src={form.backgroundImage || currentSlide?.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80'}
                  alt="Visual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {form.layout === 'carousel' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-widest">
                  {currentSlide?.topTitle || 'New Collection'}
                </span>
                <h3 className="text-2xl font-black text-stone-900">{currentSlide?.titleMain || 'Curated Essentials'}</h3>
                <p className="text-stone-500 text-xs">{currentSlide?.subtitle || 'Showcase your finest items.'}</p>
                <div className="pt-2">
                  <span className="px-5 py-2 bg-stone-900 text-white rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                    {currentSlide?.cta || 'Shop Now'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-stone-200">
                <img
                  src={currentSlide?.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80'}
                  alt="Visual"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSettings;
