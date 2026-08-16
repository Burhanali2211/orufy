import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const slides = [
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
  },
  {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80',
    topTitle: 'Quality Assured',
    titleMain: 'Curated Selections',
    subtitle: 'Build trust with your customers through premium presentation',
    cta: 'Explore Catalog',
    ctaLink: '/products',
  }
];

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
      ease: [0.215, 0.61, 0.355, 1],
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

export const Hero: React.FC = () => {
  const [[page, direction], setPage] = useState([0, 0]);
  const current = Math.abs(page % slides.length);

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    const id = setInterval(() => paginate(1), 7000);
    return () => clearInterval(id);
  }, [paginate]);

  const slide = slides[current];

  return (
    <section className="relative w-full h-[100vh] min-h-[600px] overflow-hidden bg-[#f8f9fa] pt-24 pb-12 flex flex-col justify-center">
      
      {/* ─── Top Content Area (Google Store Hero) ─── */}
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
            <motion.p variants={itemVariants} className="text-[#1A73E8] font-medium text-[16px] mb-4 uppercase tracking-wider">
              {slide.topTitle}
            </motion.p>
            
            {/* Massive Display Headline */}
            <motion.h2 variants={itemVariants} className="text-[#202124] text-[45px] sm:text-[57px] font-normal leading-tight mb-6">
              {slide.titleMain}
            </motion.h2>

            {/* Subtitle / Body Copy */}
            <motion.p variants={itemVariants} className="text-[18px] text-[#5f6368] font-normal mb-8">
              {slide.subtitle}
            </motion.p>

            {/* MD3 Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                to={slide.ctaLink}
                className="bg-[#1A73E8] text-white px-8 py-3 rounded-full font-medium text-[16px] hover:bg-[#1557B0] transition-colors shadow-sm w-full sm:w-auto text-center"
              >
                {slide.cta}
              </Link>
              
              <Link
                to="/new-arrivals"
                className="text-[#1A73E8] px-8 py-3 rounded-full font-medium text-[16px] hover:bg-[#1A73E8]/10 transition-colors w-full sm:w-auto text-center"
              >
                View all models
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Image Area (Right Side on Desktop, Bottom on Mobile) ─── */}
      <div className="absolute inset-0 sm:left-1/2 sm:w-1/2 h-full z-10 flex justify-end items-center opacity-30 sm:opacity-100 mix-blend-multiply sm:mix-blend-normal">
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
            {/* The image itself */}
            <img
              src={slide.image}
              alt={slide.titleMain}
              className="w-full h-full object-cover object-center sm:object-right"
            />
            {/* Mobile gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/80 to-transparent sm:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f8f9fa] to-transparent hidden sm:block" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Apple Dot Pagination ─── */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center gap-[7px]">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage([i, i > current ? 1 : -1])}
            aria-label={`Go to slide ${i + 1}`}
            className="py-2"
          >
            <div 
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                i === current ? 'bg-[#1A73E8]' : 'bg-[#dadce0]'
              }`} 
            />
          </button>
        ))}
      </div>

    </section>
  );
};

export default Hero;
