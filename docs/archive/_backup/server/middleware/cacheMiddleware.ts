import { Request, Response, NextFunction } from 'express';
import { hybridCache } from '../utils/hybridCache';
import { logger } from '../utils/logger';

/**
 * Cache middleware factory
 * Caches GET requests based on URL and query parameters
 * Uses hybrid cache (Redis + in-memory)
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = generateCacheKey(req);

    // Try to get from cache
    try {
      const cachedData = await hybridCache.get(cacheKey);

      if (cachedData) {
        logger.debug(`Serving from cache: ${cacheKey}`, { context: 'Cache' });
        return res.json(cachedData);
      }
    } catch (error) {
      logger.warn('Cache get error, continuing without cache', { context: 'Cache', data: { key: cacheKey } });
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        hybridCache.set(cacheKey, data, ttlSeconds).catch(error => {
          logger.warn('Cache set error', { context: 'Cache', data: { key: cacheKey, error: error.message } });
        });
        logger.debug(`Cached response: ${cacheKey}`, { context: 'Cache' });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request): string {
  const queryString = Object.keys(req.query).length > 0
    ? JSON.stringify(req.query)
    : '';
  
  return `${req.path}${queryString}`;
}

/**
 * Cache invalidation middleware
 * Invalidates cache for specific patterns on write operations
 * Uses hybrid cache (Redis + in-memory)
 */
export function invalidateCache(patterns: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function(data: any) {
      // Only invalidate on successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          hybridCache.deletePattern(pattern).catch(error => {
            logger.warn('Cache invalidation error', { context: 'Cache', data: { pattern, error: error.message } });
          });
          logger.debug(`Cache invalidated: ${pattern}`, { context: 'Cache' });
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Predefined cache configurations
 */
export const CacheConfig = {
  // Short cache (5 minutes) - for frequently changing data
  short: cacheMiddleware(5 * 60),
  
  // Medium cache (15 minutes) - for moderately changing data
  medium: cacheMiddleware(15 * 60),
  
  // Long cache (1 hour) - for rarely changing data
  long: cacheMiddleware(60 * 60),
  
  // Very long cache (24 hours) - for static data
  veryLong: cacheMiddleware(24 * 60 * 60),
};

/**
 * Cache invalidation patterns
 */
export const InvalidatePatterns = {
  products: ['products:', 'product:'],
  categories: ['categories:', 'category:'],
  cart: (userId: string) => [`cart:${userId}`],
  settings: ['settings:'],
};

