/**
 * Performance utilities index
 * Centralized exports for all performance-related utilities
 */

// Export the primary performance monitor (simpler implementation)
export { PerformanceMonitor, performanceMonitor, apiCache } from './core';

// Export additional utilities from the enhanced performance monitor
// with renamed exports to avoid conflicts
export {
  performanceMonitor as enhancedPerformanceMonitor,
  usePerformanceTracking,
  trackPageNavigation,
  useImagePerformance,
  useApiPerformance,
  default as PerformanceMonitorClass
} from '../performanceMonitor';