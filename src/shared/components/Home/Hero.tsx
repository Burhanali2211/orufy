import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { ArrowRight, Sparkles, ShieldCheck, Award } from 'lucide-react';

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '10%' : '-10%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.6 },
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '10%' : '-10%',
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.6 },
    }
  })
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.215, 0.61, 0.355, 1] as any,
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const Hero: React.FC = memo(() => {
  const { config } = useSettings();
  const hero = config?.hero || {
    layout: 'carousel',
    topTitle: 'New Collection',
    titleMain: `${config?.identity?.siteName || 'Exclusive'} Storefront`,
    subtitle: 'Showcase your best products with beautiful, high-resolution imagery',
    cta: 'Shop Now',
    ctaLink: '/products',
    slides: []
  };

  const activeSlides = (hero.slides && hero.slides.length > 0)
    ? hero.slides
    : [
        {
          image: hero.backgroundImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80',
          topTitle: hero.topTitle || 'New Collection',
          titleMain: hero.titleMain || `${config?.identity?.siteName || 'Premium'} Curated Essentials`,
          subtitle: hero.subtitle || 'Showcase your best products with beautiful, high-resolution imagery',
          cta: hero.cta || 'Shop Now',
          ctaLink: hero.ctaLink || '/products',
          secondaryCta: hero.secondaryCta,
          secondaryCtaLink: hero.secondaryCtaLink,
        },
        {
          image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80',
          topTitle: 'Featured Items',
          titleMain: 'Exclusive Deals',
          subtitle: 'Highlight your top selling items and promotions right here',
          cta: 'View Offers',
          ctaLink: '/products',
        }
      ];

  const [[page, direction], setPage] = useState([0, 0]);
  const current = Math.abs(page % Math.max(1, activeSlides.length));

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  const intervalDuration = (hero.intervalSeconds || 7) * 1000;

  useEffect(() => {
    if (activeSlides.length > 1 && (hero.layout === 'carousel' || !hero.layout)) {
      const id = setInterval(() => paginate(1), intervalDuration);
      return () => clearInterval(id);
    }
  }, [paginate, activeSlides.length, hero.layout, intervalDuration]);

  const currentSlide = activeSlides[current] || activeSlides[0];

  // ══════════════════════════════════════════════════════════════════════════
  // ── ENTERPRISE PRESET 1: APPLE STAGE MINIMAL (Near-Monochrome, Centered) ──
  // ══════════════════════════════════════════════════════════════════════════
  if (hero.layout === 'minimal' || hero.layout === 'apple_minimal') {
    const visualImage = hero.backgroundImage || currentSlide.image || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80';
    return (
      <section className="relative w-full bg-[#fbfbfd] py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-stone-200/60 overflow-hidden text-center flex flex-col items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="max-w-4xl mx-auto flex flex-col items-center z-10"
        >
          {hero.topTitle && (
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 text-xs font-semibold uppercase tracking-widest mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-600" />
              <span>{hero.topTitle}</span>
            </motion.div>
          )}

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl font-bold text-stone-900 tracking-tight leading-[1.06] mb-5 font-serif"
          >
            {hero.titleMain || config?.identity?.siteName || 'Pure Distinction'}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-xl text-stone-500 font-normal leading-relaxed mb-8 max-w-2xl"
          >
            {hero.subtitle || 'Discover handpicked, artisanal products curated exclusively for our discerning clientele.'}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
            <Link
              to={hero.ctaLink || '/products'}
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm hover:shadow inline-flex items-center gap-2"
            >
              <span>{hero.cta || 'Explore Collection'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {hero.secondaryCta ? (
              <Link
                to={hero.secondaryCtaLink || '/products'}
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-100 hover:bg-stone-200 text-stone-900 transition-colors"
              >
                {hero.secondaryCta}
              </Link>
            ) : (
              <Link
                to="/products"
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-100 hover:bg-stone-200 text-stone-900 transition-colors"
              >
                View Catalog
              </Link>
            )}
          </motion.div>

          {/* Centered Stage Visual */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 bg-stone-100 aspect-[16/9] sm:aspect-[21/9]"
          >
            <img src={visualImage} alt={hero.titleMain || 'Hero Visual'} className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ENTERPRISE PRESET 2: IMMERSIVE NOIR (Cinematic Full Bleed) ────────────
  // ══════════════════════════════════════════════════════════════════════════
  if (hero.layout === 'immersive') {
    const bg = hero.backgroundImage || currentSlide.image || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80';
    return (
      <section className="relative w-full h-[88vh] min-h-[580px] overflow-hidden flex items-center justify-center bg-stone-950">
        <div className="absolute inset-0 z-0">
          <img src={bg} alt={hero.titleMain || 'Hero Banner'} className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <motion.div initial="hidden" animate="visible" variants={contentVariants} className="flex flex-col items-center">
            {hero.topTitle && (
              <motion.span
                variants={itemVariants}
                className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest mb-6 border border-white/20"
              >
                {hero.topTitle}
              </motion.span>
            )}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 font-serif drop-shadow-md"
            >
              {hero.titleMain || config?.identity?.siteName || 'Excellence in Every Detail'}
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-xl text-stone-200 font-normal max-w-2xl mb-9 leading-relaxed"
            >
              {hero.subtitle || 'Formulated with rare botanical extractions and precision craftsmanship.'}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={hero.ctaLink || '/products'}
                className="px-9 py-4 rounded-full font-bold text-sm bg-white text-stone-950 hover:bg-stone-100 transition-all shadow-xl inline-flex items-center gap-2 active:scale-98"
              >
                <span>{hero.cta || 'Shop Collection'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ENTERPRISE PRESET 3: HAUTE EDITORIAL SPLIT (50/50 Side-by-Side) ───────
  // ══════════════════════════════════════════════════════════════════════════
  if (hero.layout === 'split') {
    const visualImage = hero.backgroundImage || currentSlide.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80';
    return (
      <section className="relative w-full bg-stone-50/60 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={contentVariants} className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {hero.topTitle && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/80 text-stone-900 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                {hero.topTitle}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.08] font-serif">
              {hero.titleMain || currentSlide.titleMain}
            </h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {hero.subtitle || currentSlide.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2 justify-center lg:justify-start">
              <Link
                to={hero.ctaLink || currentSlide.ctaLink || '/products'}
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-md inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <span>{hero.cta || currentSlide.cta || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {hero.secondaryCta && (
                <Link
                  to={hero.secondaryCtaLink || '/products'}
                  className="px-8 py-3.5 rounded-full font-bold text-sm bg-white border border-stone-200 text-stone-900 hover:bg-stone-100 transition-all w-full sm:w-auto text-center"
                >
                  {hero.secondaryCta}
                </Link>
              )}
            </div>

            {/* Trust Micro-Pills */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-5 text-xs text-stone-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Insured Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-stone-700" /> 100% Authentic
              </span>
            </div>
          </motion.div>

          <div className="lg:col-span-6 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl bg-stone-100 border border-stone-200">
            <img src={visualImage} alt="Hero Visual" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ENTERPRISE PRESET 4: BENTO GRID SHOWCASE (Multi-Tile Modern) ──────────
  // ══════════════════════════════════════════════════════════════════════════
  if (hero.layout === 'bento') {
    const mainImg = hero.backgroundImage || currentSlide.image || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80';
    return (
      <section className="relative w-full bg-stone-50/50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Showcase Card (8 cols) */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[420px] flex flex-col justify-end p-8 sm:p-12 shadow-lg group">
            <img src={mainImg} alt="Main Feature" className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            
            <div className="relative z-10 space-y-4 max-w-xl">
              {hero.topTitle && (
                <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider inline-block">
                  {hero.topTitle}
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-bold font-serif leading-tight">
                {hero.titleMain || 'The Signature Release'}
              </h1>
              <p className="text-sm sm:text-base text-stone-200 font-normal line-clamp-2">
                {hero.subtitle || 'Handcrafted rare formulations engineered for distinction.'}
              </p>
              <div className="pt-2">
                <Link
                  to={hero.ctaLink || '/products'}
                  className="px-7 py-3 rounded-full font-bold text-xs bg-white text-stone-950 hover:bg-stone-100 transition-all inline-flex items-center gap-2 shadow-md"
                >
                  <span>{hero.cta || 'Shop Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Bento Mini Tiles (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Tile 1: Trending Collection */}
            <Link
              to="/products"
              className="flex-1 rounded-3xl p-6 bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full inline-block mb-3">
                  Limited Batch
                </span>
                <h3 className="text-lg font-bold text-stone-900 font-serif group-hover:text-stone-700 transition-colors">
                  Pure Amber Essences
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Small-batch artisan extractions distilled for enduring longevity.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-900">
                <span>Explore Batch</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Tile 2: Complimentary Shipping & Assurance */}
            <div className="rounded-3xl p-6 bg-stone-900 text-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-serif">
                  Signature Packaging
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Every order includes bespoke presentation box & insured tracking.
                </p>
              </div>
              <Link to="/products" className="mt-4 text-xs font-bold text-amber-300 hover:text-white transition-colors flex items-center gap-1">
                <span>Discover Catalog</span> &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ENTERPRISE PRESET 5: LUXURY MULTI-SLIDE STAGE (Default Carousel) ─────
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <section className="relative w-full h-[90vh] min-h-[580px] overflow-hidden bg-stone-50 pt-20 pb-12 flex flex-col justify-center">
      {/* ─── Left Content Column ─── */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center sm:text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-center sm:items-start max-w-2xl"
          >
            {/* Top Title / Eyebrow */}
            {currentSlide.topTitle && (
              <motion.p
                variants={itemVariants}
                className="text-stone-900 font-bold text-xs mb-4 uppercase tracking-widest px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 inline-block shadow-2xs"
              >
                {currentSlide.topTitle}
              </motion.p>
            )}
            
            {/* Display Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-stone-900 text-4xl sm:text-6xl font-bold leading-[1.08] mb-6 tracking-tight font-serif"
            >
              {currentSlide.titleMain}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-stone-600 font-normal mb-8 leading-relaxed max-w-xl"
            >
              {currentSlide.subtitle}
            </motion.p>

            {/* CTA Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <Link
                to={currentSlide.ctaLink || '/products'}
                className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-stone-800 transition-all shadow-md hover:shadow-lg w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{currentSlide.cta || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              {currentSlide.secondaryCta ? (
                <Link
                  to={currentSlide.secondaryCtaLink || '/products'}
                  className="bg-white border border-stone-200 text-stone-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-stone-100 transition-colors w-full sm:w-auto text-center"
                >
                  {currentSlide.secondaryCta}
                </Link>
              ) : (
                <Link
                  to="/products"
                  className="bg-white/90 backdrop-blur-sm border border-stone-200 text-stone-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white transition-colors w-full sm:w-auto text-center"
                >
                  View Catalog
                </Link>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Right Image Stage ─── */}
      <div className="absolute inset-0 sm:left-1/2 sm:w-1/2 h-full z-10 flex justify-end items-center opacity-35 sm:opacity-100">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full relative"
          >
            <img
              src={currentSlide.image}
              alt={currentSlide.titleMain}
              className="w-full h-full object-cover object-center sm:object-right"
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent sm:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/40 to-transparent hidden sm:block" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Pagination Dots ─── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage([i, i > current ? 1 : -1])}
              aria-label={`Go to slide ${i + 1}`}
              className="p-1 cursor-pointer"
            >
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-stone-900' : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`} 
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;

