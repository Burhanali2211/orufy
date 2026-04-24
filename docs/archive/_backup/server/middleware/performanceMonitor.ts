import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow requests
 */

// Threshold for slow requests (in milliseconds)
const SLOW_REQUEST_THRESHOLD = parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000');

// Store request metrics
interface RequestMetrics {
  count: number;
  totalDuration: number;
  slowRequests: number;
  errors: number;
}

const metrics: Map<string, RequestMetrics> = new Map();

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const route = `${req.method} ${req.path}`;

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Update metrics
    updateMetrics(route, duration, statusCode >= 400);

    // Log slow requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn(`Slow request detected: ${route}`, {
        context: 'Performance',
        data: {
          duration: `${duration}ms`,
          statusCode,
          method: req.method,
          path: req.path,
          query: req.query,
          userId: (req as any).userId
        }
      });
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      const color = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';
      logger.debug(`${color} ${route} - ${statusCode} - ${duration}ms`, { context: 'Performance' });
    }
  });

  next();
}

/**
 * Update request metrics
 */
function updateMetrics(route: string, duration: number, isError: boolean) {
  const existing = metrics.get(route) || {
    count: 0,
    totalDuration: 0,
    slowRequests: 0,
    errors: 0
  };

  existing.count++;
  existing.totalDuration += duration;
  if (duration > SLOW_REQUEST_THRESHOLD) {
    existing.slowRequests++;
  }
  if (isError) {
    existing.errors++;
  }

  metrics.set(route, existing);
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
  const result: any[] = [];

  metrics.forEach((metric, route) => {
    result.push({
      route,
      count: metric.count,
      avgDuration: Math.round(metric.totalDuration / metric.count),
      slowRequests: metric.slowRequests,
      errors: metric.errors,
      errorRate: `${Math.round((metric.errors / metric.count) * 100)}%`
    });
  });

  // Sort by count (most requested first)
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
  metrics.clear();
  logger.info('Performance metrics reset', { context: 'Performance' });
}

/**
 * Log performance summary
 */
export function logPerformanceSummary() {
  const metricsData = getPerformanceMetrics();
  
  if (metricsData.length === 0) {
    logger.info('No performance metrics available', { context: 'Performance' });
    return;
  }

  logger.info('Performance Summary', {
    context: 'Performance',
    data: {
      totalRoutes: metricsData.length,
      topRoutes: metricsData.slice(0, 10),
      slowestRoutes: metricsData
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 5)
        .map(m => ({ route: m.route, avgDuration: `${m.avgDuration}ms` }))
    }
  });
}

/**
 * Schedule periodic performance logging (every 5 minutes in production)
 */
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logPerformanceSummary();
  }, 5 * 60 * 1000); // 5 minutes
}

