// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, number> = new Map();
  private metrics: Array<{ name: string; duration: number; timestamp: number; success: boolean }> = [];
  private maxMetrics = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    this.measurements.set(name, performance.now());
  }

  endMeasure(name: string, success: boolean = true): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      // Instead of just warning, start the measurement if it doesn't exist
      // This prevents the "not started" warnings
      this.startMeasure(name);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Store metric
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      success
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Performance logging removed for production

    this.measurements.delete(name);
    return duration;
  }

  getStats() {
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 5 * 60 * 1000); // Last 5 minutes
    const successfulMetrics = recentMetrics.filter(m => m.success);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageTime: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const durations = successfulMetrics.map(m => m.duration);
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const slowestOperation = recentMetrics.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );
    const fastestOperation = recentMetrics.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );

    return {
      totalRequests: recentMetrics.length,
      successRate: (successfulMetrics.length / recentMetrics.length) * 100,
      averageTime,
      slowestOperation,
      fastestOperation
    };
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startMeasure(name);
    try {
      const result = fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }
}

// Helper function to debounce API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Helper function to throttle API calls
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}

// Cache utility for API responses
export class SimpleCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export const apiCache = new SimpleCache();
