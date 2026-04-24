import React, { useEffect, memo, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { ProductGridSkeleton } from '../Common/ProductCardSkeleton';
import { LatestArrivalProductCard } from '../Product/LatestArrivalProductCard';
import { Link } from 'react-router-dom';

export const LatestArrivals: React.FC = memo(() => {
  const { latestProducts, latestLoading, fetchLatestProducts } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchLatestProducts(8);
  }, [fetchLatestProducts]);

  const checkScroll = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    setCanScrollLeft(c.scrollLeft > 0);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const c = scrollRef.current;
    if (!c) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { checkScroll(); ticking = false; });
    };
    c.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      c.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [latestProducts, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const c = scrollRef.current;
    if (!c) return;
    c.scrollBy({ left: dir === 'left' ? -c.clientWidth * 0.8 : c.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="py-6 sm:py-8 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <span className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-green-600" />
            New Arrivals
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="hidden md:flex p-1.5 rounded-full border border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="hidden md:flex p-1.5 rounded-full border border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link to="/products?sort=latest" className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {latestLoading ? (
          <ProductGridSkeleton count={4} variant="latest" />
        ) : latestProducts.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
          >
            {latestProducts.map((product, idx) => (
              <div key={product.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
                <LatestArrivalProductCard product={product} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">New arrivals coming soon!</p>
          </div>
        )}
      </div>
    </section>
  );
});

LatestArrivals.displayName = 'LatestArrivals';
export default LatestArrivals;
