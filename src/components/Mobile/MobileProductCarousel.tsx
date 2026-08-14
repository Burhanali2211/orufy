import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Removed framer-motion imports
import { Product } from '../../types';
import { MobileProductCard } from './MobileProductCard';
import { MobileIconButton } from './MobileTouchButton';
import { useSwipeGesture } from '../../hooks/useMobileGestures';

interface MobileProductCarouselProps {
  products: Product[];
  title?: string;
  variant?: 'default' | 'compact' | 'featured';
  itemsPerView?: number;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const MobileProductCarousel: React.FC<MobileProductCarouselProps> = ({
  products,
  title,
  variant = 'default',
  itemsPerView = 1.2, // Show partial next item to indicate scrollability
  showNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Removed auto-play state
  const carouselRef = useRef<HTMLDivElement>(null);
  // Removed autoPlayRef

  const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));

  // Removed auto-play functionality

  // Removed pauseAutoPlay function

  const goToNext = () => {
    // Removed pauseAutoPlay call
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goToPrevious = () => {
    // Removed pauseAutoPlay call
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    // Removed pauseAutoPlay call
    setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
  };

  // Swipe gesture support
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
  }, {
    minSwipeDistance: 50,
    preventDefaultTouchmove: false, // Allow scrolling
  });

  if (!products.length) {
    return null;
  }

  const itemWidth = 100 / itemsPerView;
  const translateX = -(currentIndex * itemWidth);

  return (
    <div className="w-full">
      {/* Title */}
      {title && (
        <div className="flex items-center justify-between mb-3 px-3">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {showNavigation && products.length > itemsPerView && (
            <div className="flex space-x-1.5">
              <MobileIconButton
                icon={ChevronLeft}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                variant="secondary"
                size="minimum"
                ariaLabel="Previous products"
              />
              <MobileIconButton
                icon={ChevronRight}
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                variant="secondary"
                size="minimum"
                ariaLabel="Next products"
              />
            </div>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(${translateX}%)`,
            width: `${(products.length / itemsPerView) * 100}%`
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-1.5"
              style={{ width: `${itemWidth}%` }}
            >
              <MobileProductCard product={product} variant={variant} />
            </div>
          ))}
        </div>

        {/* Navigation Overlay for larger carousels */}
        {showNavigation && products.length > itemsPerView && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-1.5 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md z-10 active:bg-white/80 touch-manipulation"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-700" />
              </button>
            )}
            
            {currentIndex < maxIndex && (
              <button
                onClick={goToNext}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md z-10 active:bg-white/80 touch-manipulation"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4 text-neutral-700" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Indicators */}
      {products.length > itemsPerView && (
        <div className="flex justify-center mt-3 space-x-1.5">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                index === currentIndex 
                  ? 'bg-neutral-900' 
                  : 'bg-neutral-300 hover:bg-neutral-400'
              } touch-manipulation`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Specialized carousel for featured products
export const MobileFeaturedCarousel: React.FC<{
  products: Product[];
  title?: string;
}> = ({ products, title }) => {
  return (
    <MobileProductCarousel
      products={products}
      title={title}
      variant="featured"
      itemsPerView={1}
      showNavigation={true}
      // Removed autoPlay to prevent blinking
      autoPlay={false}
      autoPlayInterval={4000}
    />
  );
};

// Specialized carousel for compact product lists
export const MobileCompactCarousel: React.FC<{
  products: Product[];
  title?: string;
}> = ({ products, title }) => {
  return (
    <MobileProductCarousel
      products={products}
      title={title}
      variant="compact"
      itemsPerView={1.5}
      showNavigation={false}
      autoPlay={false}
    />
  );
};

// Enhanced Grid layout for mobile product listings with luxury design
interface MobileProductGridProps {
  products: Product[];
  columns?: 1 | 2;
  variant?: 'default' | 'compact' | 'luxury';
}

export const MobileProductGrid: React.FC<MobileProductGridProps> = ({
  products,
  columns = 2,
  variant = 'luxury',
}) => {
  const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const gap = variant === 'compact' ? 'gap-2' : variant === 'luxury' ? 'gap-3' : 'gap-3';
  const padding = variant === 'luxury' ? 'px-3' : 'p-3';

  return (
    <div className={`grid ${gridCols} ${gap} ${padding} py-4`}>
      {products.map((product, index) => (
        // Removed motion animations
        <div
          key={product.id}
          className="touch-manipulation"
        >
          <MobileProductCard
            product={product}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
};