/**
 * Performance monitoring utility for tracking website performance metrics
 */
import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

// Enhanced performance metrics interface
interface DetailedPerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  imageLoadTime?: number;
  apiResponseTime?: number;
  cacheHitRate?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  
  // Resource metrics
  slowResourcesCount?: number;
  totalResources?: number;
  failedRequests?: number;
  
  // User experience metrics
  interactionToNextPaint?: number;
  totalBlockingTime?: number;
  speedIndex?: number;
  
  // Additional metrics
  firstByteTime?: number;
  domContentLoaded?: number;
  windowLoadTime?: number;
  longTasks?: number;
  longTaskDuration?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;
  private detailedMetrics: DetailedPerformanceMetrics = {};

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      this.isEnabled = false;
      return;
    }

    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('lcp', lastEntry.startTime, 'timing', {
          element: lastEntry.element?.tagName || 'unknown'
        });
        this.detailedMetrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime, 'timing');
          this.detailedMetrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Track Cumulative Layout Shift (CLS) - with error handling
      try {
        // Check if PerformanceObserver and layout-shift are supported
        if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            if (clsValue > 0) {
              this.recordMetric('cls', clsValue, 'gauge');
              this.detailedMetrics.cls = clsValue;
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          this.observers.push(clsObserver);
        }
      } catch (error) {
        // layout-shift not supported in this browser - silently ignore
      }

      // Track Long Tasks - with error handling
      try {
        // Check if PerformanceObserver and longtask are supported
        if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
          const longTaskObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              this.recordMetric('long_task', entry.duration, 'timing', {
                type: (entry as any).name
              });
              // Update detailed metrics
              this.detailedMetrics.longTasks = (this.detailedMetrics.longTasks || 0) + 1;
              this.detailedMetrics.longTaskDuration = (this.detailedMetrics.longTaskDuration || 0) + entry.duration;
            });
          });
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        }
      } catch (error) {
        // longtask not supported in this browser - silently ignore
      }

      // Track Navigation and Resource Timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceNavigationTiming) => {
          this.recordMetric('ttfb', entry.responseStart - entry.requestStart, 'timing');
          this.recordMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.fetchStart, 'timing');
          this.recordMetric('load_complete', entry.loadEventEnd - entry.fetchStart, 'timing');
          this.detailedMetrics.ttfb = entry.responseStart - entry.requestStart;
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
      this.isEnabled = false;
    }
  }

  private trackPageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Wait a bit for all metrics to be available
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart, 'timing');
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'timing');
          this.recordMetric('load_complete', navigation.loadEventEnd - navigation.fetchStart, 'timing');
          this.detailedMetrics.ttfb = navigation.responseStart - navigation.requestStart;
          this.detailedMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          this.detailedMetrics.windowLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.detailedMetrics.firstByteTime = navigation.responseStart - navigation.requestStart;
        }

        // Track paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          this.recordMetric(entry.name.replace('-', '_'), entry.startTime, 'timing');
          if (entry.name === 'first-contentful-paint') {
            this.detailedMetrics.fcp = entry.startTime;
          }
        });

        // Track resource loading times
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        this.recordMetric('slow_resources_count', slowResources.length, 'counter');
        this.detailedMetrics.slowResourcesCount = slowResources.length;
        this.detailedMetrics.totalResources = resources.length;

        // Log performance summary
        this.logPerformanceSummary();
      }, 1000);
    });
  }

  recordMetric(name: string, value: number, type: PerformanceMetric['type'], tags?: Record<string, string>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags
    };

    this.metrics.push(metric);

    // Log critical performance issues
    this.checkPerformanceThresholds(metric);
  }

  private checkPerformanceThresholds(metric: PerformanceMetric) {
    // Only log performance warnings in production or when explicitly enabled
    const shouldLogWarnings = import.meta.env.PROD || import.meta.env.VITE_PERFORMANCE_WARNINGS === 'true';

    if (!shouldLogWarnings) return;

    const thresholds = {
      lcp: 2500, // Good LCP is < 2.5s
      fid: 100,  // Good FID is < 100ms
      cls: 0.1,  // Good CLS is < 0.1
      ttfb: 800, // Good TTFB is < 800ms
      long_task: 50, // Tasks > 50ms are concerning
      fcp: 1800, // Good FCP is < 1.8s
      image_load: 3000 // Good image load time is < 3s
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`⚠️ Performance issue detected:`, {
        metric: metric.name,
        value: Math.round(metric.value),
        threshold,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }
  }

  private logPerformanceSummary() {
    // Only log performance summary in production or when explicitly enabled
    const shouldLogSummary = import.meta.env.PROD || import.meta.env.VITE_PERFORMANCE_WARNINGS === 'true';

    if (!shouldLogSummary) return;

    const summary = this.getPerformanceSummary();
  }

  getPerformanceSummary() {
    const summary: Record<string, any> = {};
    
    // Group metrics by name and calculate averages
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      summary[name] = {
        average: Math.round(avg),
        max: Math.round(max),
        min: Math.round(min),
        count: values.length
      };
    });

    return summary;
  }

  // Track custom performance metrics
  startTiming(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'timing');
    };
  }

  // Track React component render times
  trackComponentRender(componentName: string, renderTime: number) {
    this.recordMetric('component_render', renderTime, 'timing', {
      component: componentName
    });
  }

  // Track database query times
  trackDatabaseQuery(queryName: string, duration: number, success: boolean) {
    this.recordMetric('db_query', duration, 'timing', {
      query: queryName,
      success: success.toString()
    });
  }

  // Track user interactions
  trackUserInteraction(action: string, duration?: number) {
    this.recordMetric('user_interaction', duration || 1, 'counter', {
      action
    });
  }

  // Track image loading performance
  trackImageLoad(imageUrl: string, loadTime: number, success: boolean) {
    this.recordMetric('image_load', loadTime, 'timing', {
      image: imageUrl,
      success: success.toString()
    });
    
    // Update detailed metrics
    if (success) {
      // Keep track of average image load time
      if (this.detailedMetrics.imageLoadTime) {
        this.detailedMetrics.imageLoadTime = (this.detailedMetrics.imageLoadTime + loadTime) / 2;
      } else {
        this.detailedMetrics.imageLoadTime = loadTime;
      }
    }
  }

  // Track API response times
  trackApiResponse(endpoint: string, responseTime: number, success: boolean) {
    this.recordMetric('api_response', responseTime, 'timing', {
      endpoint,
      success: success.toString()
    });
    
    // Update detailed metrics
    if (success) {
      // Keep track of average API response time
      if (this.detailedMetrics.apiResponseTime) {
        this.detailedMetrics.apiResponseTime = (this.detailedMetrics.apiResponseTime + responseTime) / 2;
      } else {
        this.detailedMetrics.apiResponseTime = responseTime;
      }
    }
  }

  // Track cache performance
  trackCachePerformance(hitRate: number) {
    this.recordMetric('cache_hit_rate', hitRate, 'gauge');
    this.detailedMetrics.cacheHitRate = hitRate;
  }

  // Get all metrics (for debugging)
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get detailed performance metrics
  getDetailedMetrics(): DetailedPerformanceMetrics {
    return { ...this.detailedMetrics };
  }

  // Clear metrics (useful for testing)
  clearMetrics() {
    this.metrics = [];
    this.detailedMetrics = {};
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.detailedMetrics = {};
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component performance
export const usePerformanceTracking = (componentName: string) => {
  const trackRender = React.useCallback(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    };
  }, [componentName]);

  return { trackRender };
};

// Utility to track page navigation performance
export const trackPageNavigation = (pageName: string) => {
  const startTime = performance.now();
  
  // Track time to interactive
  const checkInteractive = () => {
    if (document.readyState === 'complete') {
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric('page_load', loadTime, 'timing', {
        page: pageName
      });
    } else {
      setTimeout(checkInteractive, 100);
    }
  };
  
  checkInteractive();
};

// Hook for monitoring image loading performance
export const useImagePerformance = (imageUrl: string) => {
  const startTime = React.useRef<number>(0);
  
  const startLoading = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);
  
  const endLoading = React.useCallback((success: boolean) => {
    if (startTime.current) {
      const loadTime = performance.now() - startTime.current;
      performanceMonitor.trackImageLoad(imageUrl, loadTime, success);
      startTime.current = 0;
    }
  }, [imageUrl]);
  
  return { startLoading, endLoading };
};

// Hook for monitoring API performance
export const useApiPerformance = (endpoint: string) => {
  const startTime = React.useRef<number>(0);
  
  const startRequest = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);
  
  const endRequest = React.useCallback((success: boolean) => {
    if (startTime.current) {
      const responseTime = performance.now() - startTime.current;
      performanceMonitor.trackApiResponse(endpoint, responseTime, success);
      startTime.current = 0;
    }
  }, [endpoint]);
  
  return { startRequest, endRequest };
};

export default performanceMonitor;