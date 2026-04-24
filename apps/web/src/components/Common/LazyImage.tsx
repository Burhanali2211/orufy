import React, { useState, useRef, useEffect } from 'react';
import { performanceMonitor, useImagePerformance } from '../../utils/performance';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  responsive?: boolean;
  sizes?: string;
  srcSet?: string;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageFormat {
  format: string;
  src: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjIwIiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD4KPC9zdmc+',
  width,
  height,
  responsive = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  srcSet,
  quality = 80,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [bestFormat, setBestFormat] = useState<string>(src);
  const [imageSrcSet, setImageSrcSet] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionRef = useRef<HTMLDivElement>(null);
  const { startLoading, endLoading } = useImagePerformance(src);

  // Modern image format detection
  const supportsWebP = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') > -1;
  };

  const supportsAVIF = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('avif') > -1;
  };

  // Get optimal image format
  const getOptimalImageFormat = (originalSrc: string): string => {
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return originalSrc;
    }

    const formats: ImageFormat[] = [];

    // Add AVIF if supported (best compression)
    if (supportsAVIF()) {
      formats.push({
        format: 'avif',
        src: originalSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif')
      });
    }

    // Add WebP if supported (good compression)
    if (supportsWebP()) {
      formats.push({
        format: 'webp',
        src: originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      });
    }

    // Fallback to original
    formats.push({
      format: 'original',
      src: originalSrc
    });

    return formats.length > 0 && formats[0] ? formats[0].src : originalSrc;
  };

  // Generate responsive image sources
  const generateResponsiveSources = (baseSrc: string): string => {
    if (!responsive || baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
      return baseSrc;
    }

    // If srcSet is provided, use it
    if (srcSet) {
      return baseSrc;
    }

    const baseUrl = baseSrc.split('.').slice(0, -1).join('.');

    // For now, return optimized format - in production you'd have different sizes
    return getOptimalImageFormat(baseSrc);
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string): string => {
    if (baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
      return '';
    }

    // If srcSet is provided, use it
    if (srcSet) {
      return srcSet;
    }

    // Generate different sizes for responsive images
    const sizes = [100, 200, 400, 600, 800, 1200];
    const baseUrl = baseSrc.split('.').slice(0, -1).join('.');
    const extension = baseSrc.split('.').pop() || 'jpg';

    return sizes.map(size =>
      `${baseUrl}-${size}.${extension} ${size}w`
    ).join(', ');
  };

  useEffect(() => {
    setBestFormat(generateResponsiveSources(src));
    setImageSrcSet(generateSrcSet(src));
  }, [src, responsive, srcSet]);

  useEffect(() => {
    if (priority) {
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
  }, [priority]);

  const handleLoad = () => {
    performanceMonitor.endMeasure(`lazy-image-load-${src}`);
    endLoading(true);
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    performanceMonitor.endMeasure(`lazy-image-load-${src}`, false);
    endLoading(false);
    setHasError(true);
    onError?.();
  };

  // Start performance measurement when image starts loading
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      performanceMonitor.startMeasure(`lazy-image-load-${src}`);
      startLoading();
    }
  }, [isInView, src, isLoaded, hasError, startLoading]);

  // Safe fallback image
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';

  // Blur-up effect placeholder
  const blurPlaceholder = !isLoaded && !hasError && isInView;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      ref={intersectionRef}
      style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Loading placeholder with animation */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="w-full h-full bg-gray-200 animate-shimmer"></div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? fallbackImage : bestFormat}
          srcSet={imageSrcSet}
          alt={alt}
          width={width}
          height={height}
          sizes={responsive ? sizes : undefined}
          className={`${className} transition-all duration-500 ease-out ${isLoaded
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-105 blur-sm'
            } ${blurPlaceholder ? 'filter blur-sm' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          crossOrigin="anonymous"
          style={{
            filter: blurPlaceholder ? 'blur(2px)' : 'none',
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
