import React from 'react';
import { Reorder } from 'framer-motion';
import {
  Palette,
  Layout,
  Layers,
  Maximize2,
  Columns,
  Eye,
  EyeOff,
  GripVertical,
  Store,
  Check,
  ArrowLeft,
  Plus,
  ShieldCheck,
  Star,
  Mail,
  Grid,
  Zap,
  Edit3,
  FolderTree,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { StorefrontThemeStudio, StorefrontHero, HeroSlide } from '@/shared/contexts/SettingsContext';
import { HeroImageField, HeroTextFields } from './HeroFields';
import { CURATED_PALETTES, CURATED_FONTS, CURATED_IMAGES } from '../constants';

type StudioTab = 'navigator' | 'design' | 'header' | 'footer';
type MobileViewTab = 'editor' | 'preview';

interface InspectorPanelProps {
  mobileViewTab: MobileViewTab;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  theme: StorefrontThemeStudio;
  setTheme: (theme: StorefrontThemeStudio) => void;
  hero: StorefrontHero;
  setHero: (hero: StorefrontHero) => void;
  storeInfo: { name: string; logo_url: string; hostname: string };
  setStoreInfo: (info: { name: string; logo_url: string; hostname: string }) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (idx: number) => void;
  setMobileViewTab: (tab: MobileViewTab) => void;
  setHoveredSectionId: (id: string | null) => void;
  selectFont: (fontName: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  mobileViewTab,
  selectedSectionId,
  setSelectedSectionId,
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  hero,
  setHero,
  storeInfo,
  setStoreInfo,
  activeSlideIndex,
  setActiveSlideIndex,
  setMobileViewTab,
  setHoveredSectionId,
  selectFont,
}) => {
  const selectedSection = theme.sections.find((s) => s.id === selectedSectionId);

  const toggleSectionVisibility = (id: string) => {
    const updated = theme.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setTheme({ ...theme, sections: updated });
  };

  const handleReorderSections = (newOrder: StorefrontThemeStudio['sections']) => {
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

  const updateSlide = (field: keyof HeroSlide, val: string) => {
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

  return (
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
                  <HeroTextFields
                    badge={currentSlide.topTitle || ''} headline={currentSlide.titleMain || ''} subtitle={currentSlide.subtitle || ''}
                    onBadge={(v) => updateSlide('topTitle', v)} onHeadline={(v) => updateSlide('titleMain', v)} onSubtitle={(v) => updateSlide('subtitle', v)}
                  />
                  <HeroImageField label="Photo" value={currentSlide.image || ''} onChange={(url) => updateSlide('image', url)} />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <HeroTextFields
                  badge={hero.topTitle || ''} headline={hero.titleMain || ''} subtitle={hero.subtitle || ''}
                  onBadge={(v) => setHero({ ...hero, topTitle: v })} onHeadline={(v) => setHero({ ...hero, titleMain: v })} onSubtitle={(v) => setHero({ ...hero, subtitle: v })}
                />
                <HeroImageField label="Background Photo" value={hero.backgroundImage || ''} onChange={(url) => setHero({ ...hero, backgroundImage: url })} />
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
                        updateSlide('image', img.url);
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
  );
};
