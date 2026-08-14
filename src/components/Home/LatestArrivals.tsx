import React, { useEffect, memo, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <section className="py-16 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h2 className="text-[28px] font-normal text-[#202124] leading-tight">
              Fresh Releases
            </h2>
            <p className="text-[#5f6368] text-[16px] font-normal">The latest additions to our collection.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] flex items-center justify-center hover:bg-[#f8f9fa] text-[#202124] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] flex items-center justify-center hover:bg-[#f8f9fa] text-[#202124] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            
            <Link to="/products?sort=latest" className="group flex items-center gap-1.5 text-[14px] font-medium text-[#1A73E8] hover:text-[#1557B0] transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {latestLoading ? (
          <ProductGridSkeleton count={4} variant="latest" />
        ) : latestProducts.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x"
          >
            {latestProducts.map((product, idx) => (
              <div key={product.id} className="flex-shrink-0 w-[165px] sm:w-[200px] md:w-[240px] snap-start">
                <LatestArrivalProductCard product={product} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#f8f9fa] rounded-[24px] border border-gray-200">
            <h3 className="text-[#202124] text-[22px] font-normal mb-2">Awaiting Arrivals</h3>
            <p className="text-[#5f6368] text-[16px] font-normal">The next collection is currently in transit.</p>
          </div>
        )}
      </div>
    </section>
  );
});

LatestArrivals.displayName = 'LatestArrivals';
export default LatestArrivals;
