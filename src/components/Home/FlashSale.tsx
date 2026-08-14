import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useProducts } from '../../contexts/ProductContext';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { Product } from '../../types';

/* ─── Countdown Timer ─── */
const FlashSaleTimer: React.FC = memo(() => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) return prev;
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-3 sm:gap-4 bg-white px-4 sm:px-5 py-3 rounded-2xl border border-black/5 shadow-sm select-none">
      {[
        { val: pad(timeLeft.hours), label: 'HRS' },
        { val: pad(timeLeft.minutes), label: 'MIN' },
        { val: pad(timeLeft.seconds), label: 'SEC' },
      ].map((unit, i) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center w-7">
            <span className="text-lg sm:text-xl font-black text-black tabular-nums leading-none">
              {unit.val}
            </span>
            <span className="text-[7px] font-black text-black/25 tracking-[0.2em] mt-1 uppercase">
              {unit.label}
            </span>
          </div>
          {i < 2 && <div className="h-5 w-px bg-black/10" />}
        </React.Fragment>
      ))}
    </div>
  );
});
FlashSaleTimer.displayName = 'FlashSaleTimer';

/* ─── Animation variants ─── */
const headerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
};

/* ─── Flash Card ─── */
interface FlashCardProps {
  product: Product;
  discount: number;
  index: number;
  /** Set to true while the parent carousel is being dragged — suppresses navigation & cart action */
  isDragging: () => boolean;
}

const FlashCard: React.FC<FlashCardProps> = memo(({ product, discount, index, isDragging }) => {
  const navigate = useNavigate();
  const { handleAddToCart } = useAddToCartWithAuth();

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging()) { e.preventDefault(); return; }
    navigate(`/products/${product.id}`);
  };

  const handleBagClick = (e: React.MouseEvent) => {
    e.preventDefault();      // stop link navigation
    e.stopPropagation();     // stop card click
    if (isDragging()) return;
    handleAddToCart(product, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
      className="flex-shrink-0 snap-start select-none
        w-[160px] sm:w-[190px] md:w-[210px] lg:w-[220px]"
    >
      {/* Outer div acts as the click target for product navigation */}
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={e => e.key === 'Enter' && handleCardClick(e as any)}
        className="group block cursor-pointer"
      >
        {/* ── Image block ── */}
        <div className="relative rounded-2xl overflow-hidden bg-[#EFECE7] aspect-square mb-3">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover pointer-events-none
                transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-black/10" />
            </div>
          )}

          {/* Discount pill — top-left */}
          <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full leading-none">
              -{discount}%
            </span>
          </div>
        </div>

        {/* ── Info block ── */}
        <div className="px-0.5 mt-4 select-none">
          <div className="mb-2">
            <span className="text-[12px] font-semibold text-[#86868b] tracking-[0.1em] uppercase block mb-1">
              Flash Drop
            </span>
            <p className="text-[17px] font-semibold text-[#1d1d1f] line-clamp-1 group-hover:text-[#0066cc] transition-colors tracking-tight">
              {product.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-medium text-[#202124]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-[14px] text-[#5f6368] line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
FlashCard.displayName = 'FlashCard';

/* ─── Main Component ─── */
export const FlashSale: React.FC = memo(() => {
  const { products } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* Mouse-drag state — using refs to avoid re-renders */
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);   // true if drag exceeded threshold
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  /* Expose dragging state to children without re-rendering them */
  const getIsDragging = useCallback(() => didDragRef.current, []);

  const flashSaleProducts = useMemo(
    () => products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 12),
    [products]
  );

  /* ── Scroll indicator ── */
  const checkScroll = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    setCanScrollLeft(c.scrollLeft > 2);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 2);
  }, []);

  useEffect(() => {
    const id = setTimeout(checkScroll, 120);
    return () => clearTimeout(id);
  }, [flashSaleProducts, checkScroll]);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { checkScroll(); ticking = false; });
    };
    c.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      c.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  /* ── Button scroll ── */
  const scroll = useCallback((dir: 'left' | 'right') => {
    const c = scrollRef.current;
    if (!c) return;
    c.scrollBy({ left: dir === 'left' ? -c.clientWidth * 0.8 : c.clientWidth * 0.8, behavior: 'smooth' });
  }, []);

  /* ── Mouse drag scroll ── */
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const c = scrollRef.current;
    if (!c) return;
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartX.current = e.pageX;
    scrollStartX.current = c.scrollLeft;
    c.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const c = scrollRef.current;
    if (!c) return;
    const dx = e.pageX - dragStartX.current;
    if (Math.abs(dx) > 5) didDragRef.current = true;
    c.scrollLeft = scrollStartX.current - dx;
  }, []);

  const onMouseUpOrLeave = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    isDraggingRef.current = false;
    c.style.cursor = 'grab';
    // Keep didDragRef true briefly so child click handlers see it, then reset
    setTimeout(() => { didDragRef.current = false; }, 50);
  }, []);

  if (flashSaleProducts.length === 0) return null;

  const showNav = flashSaleProducts.length > 4;

  return (
    <section className="py-[100px] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header row ── */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-end justify-between gap-6 mb-8 sm:mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#1A73E8] hidden" />
              <span className="text-[14px] font-medium text-[#1A73E8] uppercase">
                Flash Drop
              </span>
            </div>
            <h2 className="text-[28px] font-normal text-[#202124] leading-tight">
              Limited Time Deals
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <FlashSaleTimer />

            {showNav && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Previous"
                  className="w-10 h-10 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] flex items-center justify-center
                    hover:bg-[#f8f9fa] text-[#202124] transition-all duration-200
                    disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Next"
                  className="w-10 h-10 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] flex items-center justify-center
                    hover:bg-[#f8f9fa] text-[#202124] transition-all duration-200
                    disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            <Link
              to="/deals"
              className="hidden sm:flex items-center gap-1.5 text-[14px] font-medium text-[#1A73E8]
                hover:text-[#1557B0] transition-colors whitespace-nowrap"
            >
              All Offers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* ── Carousel track ── */}
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2
            -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0
            snap-x snap-mandatory
            cursor-grab active:cursor-grabbing
            select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {flashSaleProducts.map((product, i) => {
            const discount = Math.round(
              ((product.originalPrice! - product.price) / product.originalPrice!) * 100
            );
            return (
              <FlashCard
                key={product.id}
                product={product}
                discount={discount}
                index={i}
                isDragging={getIsDragging}
              />
            );
          })}
        </div>

        {/* ── Footer: Simple Link ── */}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            to="/deals"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1A73E8] hover:text-[#1557B0]"
          >
            Explore All Deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
});

FlashSale.displayName = 'FlashSale';
export default FlashSale;
