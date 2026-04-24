import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, ArrowUpRight } from 'lucide-react';
import { Category } from '../../types';
import { normalizeImageUrl, isValidImageUrl, getSafeImageUrl } from '../../utils/imageUrlUtils';

interface CategorySectionProps {
  categories: Category[];
  loading?: boolean;
}

/**
 * CategorySkeleton - Elegant skeleton loader
 */
const CategorySkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-72">
    <div className="h-[340px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Image Skeleton */}
      <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      {/* Content Skeleton */}
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * CategorySection Component
 * Elegant horizontal carousel with refined category cards
 */
export const CategorySection: React.FC<CategorySectionProps> = ({ categories, loading = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 320;
    container.scrollTo({
      left: direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex gap-5 overflow-hidden">
          {[...Array(6)].map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <Package className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-medium">No categories available</p>
        <p className="text-gray-400 text-sm mt-1">Check back soon for new collections</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left Navigation Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50 hover:scale-105"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50 hover:scale-105"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 lg:mx-0 lg:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => {
          const categoryImageUrl = category.imageUrl || (category as any).image_url;
          const productCount = category.productCount ?? (category as any).product_count ?? 0;
          
          // Normalize category image URL from database
          const normalizedImageUrl = getSafeImageUrl(
            categoryImageUrl,
            '/placeholder-category.jpg'
          );
          const hasValidImage = isValidImageUrl(normalizedImageUrl);
          
          return (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="flex-shrink-0 w-72 group/card"
            >
              <div className="relative h-[340px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                {/* Image Container */}
                <div className="relative h-52 overflow-hidden">
                  {hasValidImage ? (
                    <img
                      src={normalizedImageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-category.jpg';
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                      <Package className="h-20 w-20 text-gray-300" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Product Count Badge */}
                  {Number(productCount) > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-xs font-bold text-gray-900">
                        {Number(productCount)} {Number(productCount) === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  )}

                  {/* Hover Arrow */}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/card:translate-y-0 shadow-md">
                    <ArrowUpRight className="w-5 h-5 text-gray-900" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover/card:text-purple-700 transition-colors duration-200">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-amber-500 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Scroll Indicator Dots - Mobile */}
      <div className="flex lg:hidden justify-center gap-1.5 mt-4">
        {categories.slice(0, 5).map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === 0 ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          />
        ))}
        {categories.length > 5 && (
          <span className="text-xs text-gray-400 ml-1">+{categories.length - 5}</span>
        )}
      </div>
    </div>
  );
};
