import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface MediaErrorHandlerProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (error: Event) => void;
  onLoad?: () => void;
  retryAttempts?: number;
  placeholder?: React.ReactNode;
}

/**
 * Enhanced image component with error handling and retry logic
 */
export const SafeImage: React.FC<MediaErrorHandlerProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  width,
  height,
  onError,
  onLoad,
  retryAttempts = 2,
  placeholder
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload image with timeout and abort support
  const preloadImage = (imageSrc: string, timeoutMs: number = 15000): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const img = new Image();
      
      // Set timeout
      const timeout = setTimeout(() => {
        controller.abort();
        img.src = ''; // Cancel image load
        reject(new Error('Image load timeout'));
      }, timeoutMs);
      
      timeoutRef.current = timeout;
      
      img.onload = () => {
        clearTimeout(timeout);
        if (!controller.signal.aborted) {
          resolve(img);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        if (!controller.signal.aborted) {
          reject(new Error('Image load failed'));
        }
      };
      
      // Start loading
      img.src = imageSrc;
      
      // Handle abort
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        img.src = '';
        reject(new Error('Image load aborted'));
      });
    });
  };

  const handleError = async (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const error = event.nativeEvent;
    const errorMessage = (error as any)?.message || '';
    const isAborted = errorMessage.includes('NS_BINDING_ABORTED') || 
                      errorMessage.includes('aborted') ||
                      errorMessage.includes('timeout') ||
                      (error.target as HTMLImageElement)?.complete === false;

    // Suppress NS_BINDING_ABORTED errors from console (they're usually network issues)
    if (!isAborted) {
      console.warn(`Image load failed: ${currentSrc}`, errorMessage || '');
    }

    if (onError) {
      onError(event.nativeEvent);
    }

    // For aborted/timeout errors, retry with delay and preload
    if ((isAborted || errorMessage.includes('timeout')) && attempts < retryAttempts) {
      setAttempts(prev => prev + 1);
      const delay = 1000 * (attempts + 1); // Exponential backoff: 1s, 2s, 3s...
      
      setTimeout(async () => {
        const separator = currentSrc.includes('?') ? '&' : '?';
        const retrySrc = currentSrc.includes('retry=') 
          ? currentSrc.replace(/retry=\d+/, `retry=${attempts + 1}`)
          : `${currentSrc}${separator}retry=${attempts + 1}`;
        
        // Preload before setting src to ensure it's ready
        try {
          await preloadImage(retrySrc, 12000); // 12s timeout for retry
          setCurrentSrc(retrySrc);
        } catch (preloadError) {
          // If preload fails, still try to set src (browser might handle it)
          setCurrentSrc(retrySrc);
        }
      }, delay);
      return;
    }

    // Try fallback or retry
    if (attempts < retryAttempts) {
      setAttempts(prev => prev + 1);
      const separator = currentSrc.includes('?') ? '&' : '?';
      const retrySrc = currentSrc.includes('retry=') 
        ? currentSrc.replace(/retry=\d+/, `retry=${attempts + 1}`)
        : `${currentSrc}${separator}retry=${attempts + 1}`;
      
      // Preload before setting src
      try {
        await preloadImage(retrySrc, 12000);
        setCurrentSrc(retrySrc);
      } catch (preloadError) {
        setCurrentSrc(retrySrc);
      }
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setAttempts(0);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setAttempts(0);
    setCurrentSrc(src);
  };

  // Reset when src changes and preload image
  useEffect(() => {
    // Cleanup previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setAttempts(0);
    
    // Preload image to ensure it's ready
    if (src && !src.startsWith('data:')) {
      preloadImage(src, 15000).catch(() => {
        // If preload fails, let the img tag handle it
        // This is just an optimization
      });
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
        style={{ width, height: height || 'auto', minHeight: height ? `${height}px` : '100px' }}
      >
        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center mb-2">Failed to load image</p>
        <button
          onClick={handleRetry}
          className="flex items-center px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          {placeholder}
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
        fetchPriority="high"
        style={{
          ...(width && height && {
            aspectRatio: `${width} / ${height}`
          })
        }}
      />
    </div>
  );
};

/**
 * Default placeholder component
 */
export const ImagePlaceholder: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center">
      <ImageIcon className={`${sizeClasses[size]} text-gray-400 animate-pulse`} />
    </div>
  );
};

/**
 * Video component with error handling
 */
interface SafeVideoProps {
  src: string;
  poster?: string;
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onError?: (error: Event) => void;
  onLoad?: () => void;
}

export const SafeVideo: React.FC<SafeVideoProps> = ({
  src,
  poster,
  className = '',
  width,
  height,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  onError,
  onLoad
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn(`Video load failed: ${src}`);
    setHasError(true);
    setIsLoading(false);

    if (onError) {
      onError(event.nativeEvent);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
        style={{ width, height: height || 'auto', minHeight: '200px' }}
      >
        <AlertTriangle className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">Video unavailable</p>
      </div>
    );
  }

  return (
    <video
      src={src}
      poster={poster}
      width={width}
      height={height}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      onError={handleError}
      onLoadedData={handleLoad}
      preload="metadata"
      crossOrigin="anonymous"
    />
  );
};

/**
 * Global media error handler for unhandled media errors
 */
export const GlobalMediaErrorHandler: React.FC = () => {
  useEffect(() => {
    const handleGlobalMediaError = (event: Event) => {
      const target = event.target as HTMLMediaElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO')) {
        const error = event as ErrorEvent;
        const errorMessage = error?.message || '';
        
        // Suppress NS_BINDING_ABORTED and other non-critical media errors
        const isAborted = errorMessage.includes('NS_BINDING_ABORTED') ||
                         errorMessage.includes('aborted') ||
                         errorMessage.includes('Failed to load') ||
                         errorMessage.includes('net::ERR_');
        
        if (isAborted) {
          // Prevent the error from bubbling up and causing console errors
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    // Listen for media errors globally
    document.addEventListener('error', handleGlobalMediaError, true);

    return () => {
      document.removeEventListener('error', handleGlobalMediaError, true);
    };
  }, []);

  return null;
};
