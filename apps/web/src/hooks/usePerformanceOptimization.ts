import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for performance optimizations
 */
export const usePerformanceOptimization = () => {
  const performanceRef = useRef<{
    startTime: number;
    renderCount: number;
  }>({
    startTime: performance.now(),
    renderCount: 0
  });

  // Track render performance
  const trackRender = useCallback((componentName: string) => {
    performanceRef.current.renderCount++;
    const renderTime = performance.now() - performanceRef.current.startTime;
    
    // Performance tracking removed for production
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Throttle function for performance
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }, []);

  // Intersection Observer for lazy loading
  const useIntersectionObserver = useCallback((
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
      if ('IntersectionObserver' in window) {
        observerRef.current = new IntersectionObserver(callback, {
          rootMargin: '50px',
          threshold: 0.1,
          ...options
        });
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [callback, options]);

    return observerRef.current;
  }, []);

  // Memory cleanup
  useEffect(() => {
    const cleanup = () => {
      // Clear any pending timeouts
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
    };

    // Cleanup on unmount
    return cleanup;
  }, []);

  return {
    trackRender,
    debounce,
    throttle,
    useIntersectionObserver
  };
};
