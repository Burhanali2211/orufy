import { performanceMonitor } from './performanceMonitor';
import { ResourceManager, ResourceMetrics } from './resourceManager.tsx';
import { CircuitBreaker, NetworkMetrics } from './networkResilience';

// Enhanced metrics interfaces
export interface DetailedPerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Resource metrics
  activeRequests: number;
  queuedRequests: number;
  completedRequests: number;
  failedRequests: number;
  bandwidthUsage: number;
  memoryUsage: number;
  averageResponseTime: number;
  
  // Network resilience metrics
  circuitBreakerEvents: number;
  retryCount: number;
  successCount: number;
  failureCount: number;
  requestCount: number;
  
  // Custom application metrics
  userInteractions: number;
  componentRenders: number;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface MetricsReport {
  timestamp: number;
  metrics: DetailedPerformanceMetrics;
  userAgent: string;
  url: string;
  connectionType: string;
}

// Metrics tracker class
export class MetricsTracker {
  private static instance: MetricsTracker;
  private resourceManager: ResourceManager | null = null;
  private circuitBreaker: CircuitBreaker | null = null;
  private customMetrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  private constructor() {
    this.initializePerformanceObservers();
  }

  static getInstance(): MetricsTracker {
    if (!MetricsTracker.instance) {
      MetricsTracker.instance = new MetricsTracker();
    }
    return MetricsTracker.instance;
  }

  // Set resource manager for tracking resource metrics
  setResourceManager(manager: ResourceManager) {
    this.resourceManager = manager;
  }

  // Set circuit breaker for tracking network resilience metrics
  setCircuitBreaker(circuitBreaker: CircuitBreaker) {
    this.circuitBreaker = circuitBreaker;
  }

  private initializePerformanceObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      this.isEnabled = false;
      return;
    }

    try {
      // Track Largest Contentful Paint (LCP)
      if ('largestContentfulPaint' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordCustomMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      }

      // Track First Input Delay (FID)
      if ('firstInput' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordCustomMetric('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      }

      // Track Cumulative Layout Shift (CLS)
      if ('layoutShift' in window) {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          if (clsValue > 0) {
            this.recordCustomMetric('cls', clsValue);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
      this.isEnabled = false;
    }
  }

  // Record custom metrics
  recordCustomMetric(name: string, value: number) {
    this.customMetrics.set(name, value);
    performanceMonitor.recordMetric(name, value, 'gauge');
  }

  // Record user interaction
  recordUserInteraction(action: string, duration?: number) {
    const current = this.customMetrics.get('userInteractions') || 0;
    this.customMetrics.set('userInteractions', current + 1);
    performanceMonitor.trackUserInteraction(action, duration);
  }

  // Record component render
  recordComponentRender(componentName: string, renderTime: number) {
    const current = this.customMetrics.get('componentRenders') || 0;
    this.customMetrics.set('componentRenders', current + 1);
    performanceMonitor.trackComponentRender(componentName, renderTime);
  }

  // Record database query
  recordDatabaseQuery(queryName: string, duration: number, success: boolean) {
    const current = this.customMetrics.get('databaseQueries') || 0;
    this.customMetrics.set('databaseQueries', current + 1);
    performanceMonitor.trackDatabaseQuery(queryName, duration, success);
  }

  // Record cache hit/miss
  recordCacheEvent(isHit: boolean) {
    if (isHit) {
      const current = this.customMetrics.get('cacheHits') || 0;
      this.customMetrics.set('cacheHits', current + 1);
    } else {
      const current = this.customMetrics.get('cacheMisses') || 0;
      this.customMetrics.set('cacheMisses', current + 1);
    }
  }

  // Get current detailed metrics
  getDetailedMetrics(): DetailedPerformanceMetrics {
    // Get resource metrics if available
    let resourceMetrics: Partial<ResourceMetrics> = {
      activeRequests: 0,
      queuedRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      bandwidthUsage: 0,
      memoryUsage: 0,
      averageResponseTime: 0
    };
    
    if (this.resourceManager) {
      resourceMetrics = this.resourceManager.getMetrics();
    }
    
    // Get network metrics if available
    let networkMetrics: Partial<NetworkMetrics> = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      averageResponseTime: 0,
      bandwidthUsage: 0,
      retryCount: 0,
      circuitBreakerEvents: 0
    };
    
    if (this.circuitBreaker) {
      networkMetrics = this.circuitBreaker.getMetrics();
    }
    
    // Combine all metrics
    const detailedMetrics: DetailedPerformanceMetrics = {
      // Core Web Vitals from custom metrics
      lcp: this.customMetrics.get('lcp'),
      fid: this.customMetrics.get('fid'),
      cls: this.customMetrics.get('cls'),
      fcp: this.customMetrics.get('fcp'),
      ttfb: this.customMetrics.get('ttfb'),
      
      // Resource metrics
      activeRequests: resourceMetrics.activeRequests || 0,
      queuedRequests: resourceMetrics.queuedRequests || 0,
      completedRequests: resourceMetrics.completedRequests || 0,
      failedRequests: resourceMetrics.failedRequests || 0,
      bandwidthUsage: resourceMetrics.bandwidthUsage || 0,
      memoryUsage: resourceMetrics.memoryUsage || 0,
      averageResponseTime: resourceMetrics.averageResponseTime || 0,
      
      // Network resilience metrics
      circuitBreakerEvents: networkMetrics.circuitBreakerEvents || 0,
      retryCount: networkMetrics.retryCount || 0,
      successCount: networkMetrics.successCount || 0,
      failureCount: networkMetrics.failureCount || 0,
      requestCount: networkMetrics.requestCount || 0,
      
      // Custom application metrics
      userInteractions: this.customMetrics.get('userInteractions') || 0,
      componentRenders: this.customMetrics.get('componentRenders') || 0,
      databaseQueries: this.customMetrics.get('databaseQueries') || 0,
      cacheHits: this.customMetrics.get('cacheHits') || 0,
      cacheMisses: this.customMetrics.get('cacheMisses') || 0
    };
    
    return detailedMetrics;
  }

  // Generate metrics report
  generateReport(): MetricsReport {
    return {
      timestamp: Date.now(),
      metrics: this.getDetailedMetrics(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }

  // Log metrics to console
  logMetrics() {
    const report = this.generateReport();
  }

  // Send metrics to analytics service (placeholder)
  sendMetricsToAnalytics(report?: MetricsReport) {
    const metricsReport = report || this.generateReport();
    
    // In a real implementation, this would send to an analytics service
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Example of how this might be implemented:
    /*
    fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metricsReport)
    }).catch(error => {
      console.warn('Failed to send metrics to analytics:', error);
    });
    */
  }

  // Check performance thresholds and warn if needed
  checkPerformanceThresholds() {
    const metrics = this.getDetailedMetrics();
    
    // Core Web Vitals thresholds
    const thresholds = {
      lcp: 2500, // Good LCP is < 2.5s
      fid: 100,  // Good FID is < 100ms
      cls: 0.1,  // Good CLS is < 0.1
      fcp: 1800, // Good FCP is < 1.8s
      ttfb: 800  // Good TTFB is < 800ms
    };
    
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = (metrics as any)[metric];
      if (value && value > threshold) {
        console.warn(`⚠️ Performance issue detected: ${metric.toUpperCase()} = ${Math.round(value)}ms (threshold: ${threshold}ms)`);
      }
    });
    
    // Resource usage thresholds
    if (metrics.activeRequests > 20) {
      console.warn(`⚠️ High number of active requests: ${metrics.activeRequests}`);
    }
    
    if (metrics.failedRequests > 5) {
      console.warn(`⚠️ High number of failed requests: ${metrics.failedRequests}`);
    }
    
    if (metrics.circuitBreakerEvents > 3) {
      console.warn(`⚠️ Circuit breaker triggered ${metrics.circuitBreakerEvents} times`);
    }
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.customMetrics.clear();
  }
}

// Global metrics tracker instance
export const globalMetricsTracker = MetricsTracker.getInstance();

// React hook for tracking component performance
export const useMetricsTracking = (componentName: string) => {
  const trackRender = React.useCallback(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      globalMetricsTracker.recordComponentRender(componentName, renderTime);
    };
  }, [componentName]);

  return { trackRender };
};

// Utility to track user interactions
export const trackUserInteraction = (action: string, duration?: number) => {
  globalMetricsTracker.recordUserInteraction(action, duration);
};

// Utility to track database queries
export const trackDatabaseQuery = (queryName: string, duration: number, success: boolean) => {
  globalMetricsTracker.recordDatabaseQuery(queryName, duration, success);
};

// Utility to track cache events
export const trackCacheEvent = (isHit: boolean) => {
  globalMetricsTracker.recordCacheEvent(isHit);
};

// Utility to track page navigation performance
export const trackPageNavigation = (pageName: string) => {
  const startTime = performance.now();
  
  // Track time to interactive
  const checkInteractive = () => {
    if (document.readyState === 'complete') {
      const loadTime = performance.now() - startTime;
      globalMetricsTracker.recordCustomMetric('page_load', loadTime);
    } else {
      setTimeout(checkInteractive, 100);
    }
  };
  
  checkInteractive();
};