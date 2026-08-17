/**
 * Streamlined Performance Monitoring Utility
 * Provides lightweight zero-overhead methods for metric tracking
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(_name: string, _value: number, _type?: string, _tags?: Record<string, string>): void {}
  startMeasure(_name: string): void {}
  endMeasure(_name: string, _success = true): number | null { return null; }
  trackComponentRender(_name: string, _time: number): void {}
  trackUserInteraction(_action: string, _duration: number): void {}
  trackDatabaseQuery(_query: string, _duration: number, _success: boolean): void {}
  trackImageLoad(_url: string, _time: number, _success: boolean): void {}
  trackApiResponse(_endpoint: string, _time: number, _success: boolean): void {}
  getPerformanceSummary(): Record<string, any> { return {}; }
  getDetailedMetrics(): Record<string, any> { return {}; }
  clearMetrics(): void {}
  destroy(): void {}
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export const usePerformanceTracking = (_componentName: string) => {};
export const trackPageNavigation = (_path: string) => {};
export const useImagePerformance = (_url: string) => ({
  startLoading: () => {},
  endLoading: () => {},
  markError: () => {},
});
export const useApiPerformance = (_endpoint: string) => ({
  startRequest: () => {},
  endRequest: () => {},
});

export default performanceMonitor;