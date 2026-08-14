import React, { useState, useRef, useEffect } from 'react';
import { imageOptimizationService, ImageFormatDetector } from '../../utils/imageOptimizationService';
import { performanceMonitor, useImagePerformance } from '../../utils/performance';
import { useGracefulDegradation } from '../../utils/networkResilience';

interface EnhancedResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  breakpoints?: number[];
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  placeholder?: 'blur' | 'color' | 'none';
  backgroundColor?: string;
}

export const EnhancedResponsiveImage: React.FC<EnhancedResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  priority = false,
  lazy = true,
  onLoad,
  onError,
  breakpoints = [320, 640, 768, 1024, 1280, 1536],
  fit = 'cover',
  placeholder = 'blur',
  backgroundColor = '#f0f0f0'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [srcSet, setSrcSet] = useState<string>('');
  const [bestSrc, setBestSrc] = useState<string>(src);
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionRef = useRef<HTMLDivElement>(null);
  const { shouldReduceImageQuality, shouldLoadImages } = useGracefulDegradation();
  const { startLoading, endLoading } = useImagePerformance(src);

  // Generate responsive image sources
  useEffect(() => {
    if (!src || !shouldLoadImages) return;

    const generateSources = async () => {
      try {
        performanceMonitor.startMeasure('responsive-image-source-generation');
        startLoading();
        
        // Get best supported format
        const bestFormat = await ImageFormatDetector.getBestSupportedFormat();
        
        // Adjust quality based on network conditions
        const adjustedQuality = shouldReduceImageQuality ? Math.min(quality, 50) : quality;
        
        // Generate srcSet
        const generatedSrcSet = imageOptimizationService.generateSrcSet(src, breakpoints, {
          quality: adjustedQuality,
          format: bestFormat,
          fit
        });
        
        setSrcSet(generatedSrcSet);
        
        // Generate best src for fallback
        const bestSrcUrl = imageOptimizationService.generateOptimizedImageUrl(src, {
          width: breakpoints[breakpoints.length - 1], // Use largest breakpoint
          quality: adjustedQuality,
          format: bestFormat,
          fit
        });
        
        setBestSrc(bestSrcUrl);
        
        // Generate placeholder if needed
        if (placeholder === 'blur') {
          const blurSrc = imageOptimizationService.generateBlurPlaceholder(src);
          setPlaceholderSrc(blurSrc);
        }
        
        performanceMonitor.endMeasure('responsive-image-source-generation');
      } catch (error) {
        performanceMonitor.endMeasure('responsive-image-source-generation', false);
        endLoading(false);
        console.warn('Failed to generate responsive image sources:', error);
        // Fallback to original src
        setBestSrc(src);
      }
    };

    generateSources();
  }, [src, breakpoints, quality, fit, placeholder, shouldReduceImageQuality, shouldLoadImages, startLoading, endLoading]);

  // Handle intersection observer for lazy loading
  useEffect(() => {
    if (priority || !lazy) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (intersectionRef.current) {
      observer.observe(intersectionRef.current);
    }

    return () => observer.disconnect();
  }, [priority, lazy]);

  // Handle image load
  const handleLoad = () => {
    performanceMonitor.endMeasure(`enhanced-image-load-${src}`);
    endLoading(true);
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    performanceMonitor.endMeasure(`enhanced-image-load-${src}`, false);
    endLoading(false);
    setHasError(true);
    onError?.();
  };

  // Start performance measurement when image starts loading
  useEffect(() => {
    if (isInView && !isLoaded && !hasError && shouldLoadImages) {
      performanceMonitor.startMeasure(`enhanced-image-load-${src}`);
    }
  }, [isInView, src, isLoaded, hasError, shouldLoadImages]);

  // Safe fallback image
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';

  // Blur-up effect placeholder
  const showPlaceholder = !isLoaded && !hasError && isInView && placeholder === 'blur' && placeholderSrc;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      ref={intersectionRef}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        backgroundColor: showPlaceholder ? backgroundColor : undefined
      }}
    >
      {/* Loading placeholder with animation */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 hidden">
          <div className="w-full h-full bg-gray-200 animate-shimmer"></div>
        </div>
      )}

      {/* Blur-up placeholder */}
      {showPlaceholder && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
          style={{ transform: 'scale(1.05)' }}
        />
      )}

      {/* Main image */}
      {isInView && shouldLoadImages && (
        <img
          ref={imgRef}
          src={hasError ? fallbackImage : bestSrc}
          srcSet={srcSet || undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-all duration-500 ease-out ${
            isLoaded
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105'
          } ${showPlaceholder ? 'filter blur-sm' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : lazy ? 'lazy' : undefined}
          decoding="async"
          crossOrigin="anonymous"
          style={{
            filter: showPlaceholder ? 'blur(2px)' : 'none',
            transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};