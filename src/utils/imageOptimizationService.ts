import { performanceMonitor } from './performance';

// Image format support detection
export class ImageFormatDetector {
  private static supportsWebP: boolean | null = null;
  private static supportsAVIF: boolean | null = null;

  static async detectWebPSupport(): Promise<boolean> {
    if (this.supportsWebP !== null) return this.supportsWebP;

    if (typeof window === 'undefined') {
      this.supportsWebP = false;
      return false;
    }

    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        this.supportsWebP = webP.height === 2;
        resolve(this.supportsWebP);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  static async detectAVIFSupport(): Promise<boolean> {
    if (this.supportsAVIF !== null) return this.supportsAVIF;

    if (typeof window === 'undefined') {
      this.supportsAVIF = false;
      return false;
    }

    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        this.supportsAVIF = avif.height === 2;
        resolve(this.supportsAVIF);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  static async getBestSupportedFormat(): Promise<'avif' | 'webp' | 'original'> {
    const [supportsAVIF, supportsWebP] = await Promise.all([
      this.detectAVIFSupport(),
      this.detectWebPSupport()
    ]);

    if (supportsAVIF) return 'avif';
    if (supportsWebP) return 'webp';
    return 'original';
  }
}

// Image optimization service
export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * Generate optimized image URL with format and quality parameters
   */
  generateOptimizedImageUrl(
    baseUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): string {
    const cacheKey = `${baseUrl}-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // If it's already an optimized URL or data URL, return as is
    if (baseUrl.startsWith('data:') || baseUrl.includes('?')) {
      this.cache.set(cacheKey, baseUrl);
      return baseUrl;
    }

    const {
      width,
      height,
      quality = 80,
      format = 'auto',
      fit = 'cover'
    } = options;

    // Build query parameters
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality !== 80) params.append('q', quality.toString());
    if (fit !== 'cover') params.append('fit', fit);
    
    // Handle format
    if (format !== 'auto') {
      params.append('f', format);
    }

    const optimizedUrl = params.toString() 
      ? `${baseUrl}?${params.toString()}` 
      : baseUrl;

    this.cache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  /**
   * Generate multiple image sizes for responsive images
   */
  generateResponsiveImageSet(
    baseUrl: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536],
    options: {
      quality?: number;
      format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): { src: string; width: number }[] {
    return breakpoints.map(width => ({
      src: this.generateOptimizedImageUrl(baseUrl, { ...options, width }),
      width
    }));
  }

  /**
   * Generate srcSet string for responsive images
   */
  generateSrcSet(
    baseUrl: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536],
    options: {
      quality?: number;
      format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): string {
    const images = this.generateResponsiveImageSet(baseUrl, breakpoints, options);
    return images.map(img => `${img.src} ${img.width}w`).join(', ');
  }

  /**
   * Generate optimized image with best supported format
   */
  async generateAutoOptimizedImage(
    baseUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): Promise<string> {
    performanceMonitor.startMeasure('image-auto-optimization');
    
    try {
      const bestFormat = await ImageFormatDetector.getBestSupportedFormat();
      const optimizedUrl = this.generateOptimizedImageUrl(baseUrl, {
        ...options,
        format: bestFormat
      });
      
      performanceMonitor.endMeasure('image-auto-optimization');
      return optimizedUrl;
    } catch (error) {
      performanceMonitor.endMeasure('image-auto-optimization', false);
      console.warn('Failed to auto-optimize image, using original:', error);
      return baseUrl;
    }
  }

  /**
   * Generate blur-up placeholder for progressive loading
   */
  generateBlurPlaceholder(baseUrl: string): string {
    return this.generateOptimizedImageUrl(baseUrl, {
      width: 20,
      quality: 20,
      fit: 'inside'
    });
  }

  /**
   * Clear cache to prevent memory leaks
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Global instance
export const imageOptimizationService = ImageOptimizationService.getInstance();

// Utility functions for common use cases
export const generateProductImageSet = (
  baseUrl: string,
  quality: number = 80
): { src: string; width: number }[] => {
  return imageOptimizationService.generateResponsiveImageSet(baseUrl, [200, 400, 600, 800], { quality });
};

export const generateProductSrcSet = (
  baseUrl: string,
  quality: number = 80
): string => {
  return imageOptimizationService.generateSrcSet(baseUrl, [200, 400, 600, 800], { quality });
};

export const generateAutoOptimizedProductImage = async (
  baseUrl: string,
  width?: number
): Promise<string> => {
  return imageOptimizationService.generateAutoOptimizedImage(baseUrl, { width, quality: 80 });
};