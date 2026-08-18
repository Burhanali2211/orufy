import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { ArrowRight, Sparkles } from 'lucide-react';

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] as any,
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
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
          image: hero.backgroundImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
          topTitle: hero.topTitle || 'New Collection',
          titleMain: hero.titleMain || `${config?.identity?.siteName || 'Premium'} Curated Essentials`,
          subtitle: hero.subtitle || 'Showcase your best products with beautiful, high-resolution imagery',
          cta: hero.cta || 'Shop Now',
          ctaLink: hero.ctaLink || '/products',
          secondaryCta: hero.secondaryCta,
          secondaryCtaLink: hero.secondaryCtaLink,
        },
        {
          image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80',
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

  useEffect(() => {
    if (activeSlides.length > 1 && hero.layout === 'carousel') {
      const id = setInterval(() => paginate(1), 7000);
      return () => clearInterval(id);
    }
  }, [paginate, activeSlides.length, hero.layout]);

  const currentSlide = activeSlides[current] || activeSlides[0];

  // ── Layout Style 1: Minimalist (Centered Headline & Clean Typography) ──
  if (hero.layout === 'minimal') {
    return (
      <section className="relative w-full bg-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-stone-100 flex items-center justify-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="max-w-3xl mx-auto flex flex-col items-center"
        >
          {hero.topTitle && (
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-900 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {hero.topTitle}
            </motion.div>
          )}

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.1] mb-6">
            {hero.titleMain || config.identity.siteName}
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-stone-500 font-normal leading-relaxed mb-10 max-w-2xl">
            {hero.subtitle || 'Discover handpicked, artisanal products curated exclusively for our discerning clientele.'}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to={hero.ctaLink || '/products'}
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              {hero.cta || 'Shop Collection'} <ArrowRight className="w-4 h-4" />
            </Link>
            {hero.secondaryCta && (
              <Link
                to={hero.secondaryCtaLink || '/products'}
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-100 text-stone-900 hover:bg-stone-200 transition-all"
              >
                {hero.secondaryCta}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // ── Layout Style 2: Immersive (Full-bleed Background Banner) ──
  if (hero.layout === 'immersive') {
    const bg = hero.backgroundImage || currentSlide.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80';
    return (
      <section className="relative w-full h-[85vh] min-h-[550px] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src={bg} alt={hero.titleMain || 'Hero Banner'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div initial="hidden" animate="visible" variants={contentVariants} className="flex flex-col items-center">
            {hero.topTitle && (
              <motion.span variants={itemVariants} className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest mb-6">
                {hero.topTitle}
              </motion.span>
            )}
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 drop-shadow-sm">
              {hero.titleMain || config.identity.siteName}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg sm:text-2xl text-stone-200 font-normal max-w-2xl mb-8 leading-relaxed">
              {hero.subtitle || 'Excellence in every detail.'}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to={hero.ctaLink || '/products'}
                className="px-9 py-4 rounded-full font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 transition-all shadow-lg inline-flex items-center gap-2"
              >
                {hero.cta || 'Explore Now'} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Layout Style 3: Split (Side-by-side Text & Product Display) ──
  if (hero.layout === 'split') {
    const visualImage = hero.backgroundImage || currentSlide.image;
    return (
      <section className="relative w-full bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-stone-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={contentVariants} className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {hero.topTitle && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-900 text-xs font-bold uppercase tracking-widest">
                {hero.topTitle}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
              {hero.titleMain || currentSlide.titleMain}
            </h1>
            <p className="text-base sm:text-lg text-stone-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {hero.subtitle || currentSlide.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start">
              <Link
                to={hero.ctaLink || currentSlide.ctaLink || '/products'}
                className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {hero.cta || currentSlide.cta || 'Shop Now'} <ArrowRight className="w-4 h-4" />
              </Link>
              {hero.secondaryCta && (
                <Link
                  to={hero.secondaryCtaLink || '/products'}
                  className="px-8 py-3.5 rounded-full font-bold text-sm bg-stone-100 text-stone-900 hover:bg-stone-200 transition-all w-full sm:w-auto text-center"
                >
                  {hero.secondaryCta}
                </Link>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-6 relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-stone-100">
            <img src={visualImage} alt="Hero Visual" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    );
  }

  // ── Layout Style 4: Carousel (Default Dynamic Multi-Slide Presentation) ──
  return (
    <section className="relative w-full h-[90vh] min-h-[580px] overflow-hidden bg-stone-50 pt-20 pb-12 flex flex-col justify-center">
      
      {/* ─── Top Content Area ─── */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 text-center sm:text-left">
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
              <motion.p variants={itemVariants} className="text-stone-900 font-bold text-[13px] mb-4 uppercase tracking-widest px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 inline-block">
                {currentSlide.topTitle}
              </motion.p>
            )}
            
            {/* Massive Display Headline */}
            <motion.h1 variants={itemVariants} className="text-stone-900 text-4xl sm:text-6xl font-black leading-[1.1] mb-6 tracking-tight">
              {currentSlide.titleMain}
            </motion.h1>

            {/* Subtitle / Body Copy */}
            <motion.p variants={itemVariants} className="text-base sm:text-lg text-stone-600 font-normal mb-8 leading-relaxed">
              {currentSlide.subtitle}
            </motion.p>

            {/* Actions */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                to={currentSlide.ctaLink || '/products'}
                className="bg-stone-900 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-stone-800 transition-all shadow-md hover:shadow-lg w-full sm:w-auto text-center inline-flex items-center justify-center gap-2"
              >
                {currentSlide.cta || 'Shop Now'} <ArrowRight className="w-4 h-4" />
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
                  className="bg-white/80 backdrop-blur-sm border border-stone-200 text-stone-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white transition-colors w-full sm:w-auto text-center"
                >
                  View Catalog
                </Link>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Image Area ─── */}
      <div className="absolute inset-0 sm:left-1/2 sm:w-1/2 h-full z-10 flex justify-end items-center opacity-40 sm:opacity-100">
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
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent sm:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/40 to-transparent hidden sm:block" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Dot Pagination ─── */}
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
