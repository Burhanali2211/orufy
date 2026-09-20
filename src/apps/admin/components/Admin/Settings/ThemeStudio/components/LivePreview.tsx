import React from 'react';
import { StorefrontThemeStudio, StorefrontHero } from '@/shared/contexts/SettingsContext';
import { Edit3, ArrowRight, Truck, ShieldCheck, Headphones } from 'lucide-react';
import { CURATED_IMAGES } from '../constants';

interface LivePreviewProps {
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  mobileViewTab: 'editor' | 'preview';
  storeInfo: { name: string; logo_url: string; hostname: string };
  theme: StorefrontThemeStudio;
  hero: StorefrontHero;
  hoveredSectionId: string | null;
  selectedSectionId: string | null;
  setHoveredSectionId: (id: string | null) => void;
  selectSection: (id: string) => void;
  activeSlideIndex: number;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  deviceMode,
  mobileViewTab,
  storeInfo,
  theme,
  hero,
  hoveredSectionId,
  selectedSectionId,
  setHoveredSectionId,
  selectSection,
  activeSlideIndex,
}) => {
  const storeInitial = (storeInfo.name || 'Store').charAt(0).toUpperCase();

  const currentSlide = hero.slides?.[activeSlideIndex] || hero.slides?.[0] || {
    titleMain: 'Curated Essentials',
    subtitle: 'Showcase your finest items with high-resolution imagery.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  };

  return (
    <div
      className={`lg:col-span-7 xl:col-span-8 flex flex-col items-center w-full ${
        mobileViewTab === 'editor' ? 'hidden lg:flex' : 'flex'
      }`}
    >
      <div
        className={`w-full transition-all duration-300 rounded-2xl overflow-hidden border border-stone-300 shadow-lg bg-white ${
          deviceMode === 'mobile'
            ? 'max-w-[375px]'
            : deviceMode === 'tablet'
            ? 'max-w-[768px]'
            : 'max-w-full'
        }`}
      >
        <div className="bg-stone-900 text-stone-400 px-3.5 py-2 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-[10px] text-stone-300 truncate max-w-[200px]">
            https://{storeInfo.hostname || 'store.get-oru.com'}
          </span>
          <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
            {deviceMode}
          </div>
        </div>

        <div
          className="max-h-[640px] overflow-y-auto scrollbar-hide text-stone-900"
          style={{
            backgroundColor: theme.palette.background,
            fontFamily: `'${theme.typography.headingFont}', sans-serif`,
          }}
        >
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
                      selectSection('hero');
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
                      selectSection('features');
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
                      selectSection('categories');
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
                      selectSection(sec.id);
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
                      selectSection('promo_banner');
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
                      selectSection('newsletter');
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
  );
};
