import { useEffect, useRef } from 'react';
import { globalMetricsTracker } from '../utils/metricsTracker';
import { trackCacheEvent } from '../utils/metricsTracker';

// Hook for monitoring component performance
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number | null>(null);

  // Track component render time
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        globalMetricsTracker.recordComponentRender(componentName, renderTime);
      }
    };
  }, [componentName]);

  // Function to manually track render time
  const trackRenderTime = () => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      globalMetricsTracker.recordComponentRender(componentName, renderTime);
      renderStartTime.current = performance.now(); // Reset for next render
    }
  };

  return { trackRenderTime };
};

// Hook for monitoring user interactions
export const useInteractionTracking = () => {
  const trackInteraction = (action: string, element?: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      globalMetricsTracker.recordUserInteraction(`${action}${element ? `_${element}` : ''}`, duration);
    };
  };

  return { trackInteraction };
};

// Hook for monitoring database queries
export const useDatabaseQueryTracking = () => {
  const trackQuery = (queryName: string) => {
    const startTime = performance.now();
    
    return (success: boolean) => {
      const duration = performance.now() - startTime;
      globalMetricsTracker.recordDatabaseQuery(queryName, duration, success);
    };
  };

  return { trackQuery };
};

// Hook for monitoring cache performance
export const useCacheTracking = () => {
  const trackCacheHit = () => {
    trackCacheEvent(true);
  };

  const trackCacheMiss = () => {
    trackCacheEvent(false);
  };

  return { trackCacheHit, trackCacheMiss };
};

// Hook for monitoring page navigation performance
export const usePageNavigationTracking = (pageName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      globalMetricsTracker.recordCustomMetric(`page_load_${pageName}`, loadTime);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [pageName]);
};

// Hook for monitoring image loading performance
export const useImageLoadingTracking = (imageName: string) => {
  const trackImageLoad = () => {
    const startTime = performance.now();
    
    return (success: boolean) => {
      const loadTime = performance.now() - startTime;
      globalMetricsTracker.recordCustomMetric(
        `image_load_${imageName}`, 
        success ? loadTime : -loadTime // Negative value for failed loads
      );
    };
  };

  return { trackImageLoad };
};

// Hook for monitoring API request performance
export const useApiRequestTracking = () => {
  const trackRequest = (endpoint: string) => {
    const startTime = performance.now();
    
    return (success: boolean, dataSize?: number) => {
      const duration = performance.now() - startTime;
      globalMetricsTracker.recordCustomMetric(
        `api_${success ? 'success' : 'failure'}_${endpoint.replace(/\//g, '_')}`, 
        duration
      );
      
      if (dataSize) {
        globalMetricsTracker.recordCustomMetric(
          `api_data_size_${endpoint.replace(/\//g, '_')}`, 
          dataSize
        );
      }
    };
  };

  return { trackRequest };
};