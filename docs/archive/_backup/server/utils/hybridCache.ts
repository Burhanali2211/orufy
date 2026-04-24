import { cache as memoryCache } from './cache';
import { redisCache } from './redisCache';
import { logger } from './logger';

/**
 * Hybrid cache that uses Redis when available, falls back to in-memory cache
 * Provides a unified interface for caching operations
 */

class HybridCache {
  /**
   * Get value from cache (tries Redis first, then in-memory)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redisCache.isAvailable()) {
      try {
        const value = await redisCache.get<T>(key);
        if (value !== null) {
          return value;
        }
      } catch (error) {
        logger.warn('Redis get failed, falling back to memory cache', { context: 'HybridCache', data: { key } });
      }
    }

    // Fallback to in-memory cache
    return memoryCache.get<T>(key);
  }

  /**
   * Set value in cache (writes to both Redis and in-memory)
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    // Write to both caches for redundancy
    const promises: Promise<void>[] = [];

    // Write to Redis if available
    if (redisCache.isAvailable()) {
      promises.push(
        redisCache.set(key, data, ttlSeconds).catch(error => {
          logger.warn('Redis set failed', { context: 'HybridCache', data: { key, error: error.message } });
        })
      );
    }

    // Always write to in-memory cache as backup
    memoryCache.set(key, data, ttlSeconds);

    // Wait for Redis write (non-blocking for in-memory)
    await Promise.all(promises);
  }

  /**
   * Delete value from cache (deletes from both)
   */
  async delete(key: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (redisCache.isAvailable()) {
      promises.push(
        redisCache.delete(key).catch(error => {
          logger.warn('Redis delete failed', { context: 'HybridCache', data: { key, error: error.message } });
        })
      );
    }

    memoryCache.delete(key);

    await Promise.all(promises);
  }

  /**
   * Delete all keys matching a pattern (deletes from both)
   */
  async deletePattern(pattern: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (redisCache.isAvailable()) {
      promises.push(
        redisCache.deletePattern(pattern).catch(error => {
          logger.warn('Redis deletePattern failed', { context: 'HybridCache', data: { pattern, error: error.message } });
        })
      );
    }

    memoryCache.deletePattern(pattern);

    await Promise.all(promises);
  }

  /**
   * Clear all cache (clears both)
   */
  async clear(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (redisCache.isAvailable()) {
      promises.push(
        redisCache.clear().catch(error => {
          logger.warn('Redis clear failed', { context: 'HybridCache', data: { error: error.message } });
        })
      );
    }

    memoryCache.clear();

    await Promise.all(promises);
  }

  /**
   * Get cache statistics from both caches
   */
  getStats() {
    const redisStats = redisCache.getStats();
    const memoryStats = memoryCache.getStats();

    return {
      redis: redisStats,
      memory: memoryStats,
      activeCache: redisCache.isAvailable() ? 'redis' : 'memory'
    };
  }

  /**
   * Check if Redis is available
   */
  isRedisAvailable(): boolean {
    return redisCache.isAvailable();
  }
}

// Export singleton instance
export const hybridCache = new HybridCache();

/**
 * Cache key generators (re-export for convenience)
 */
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number, filters?: string) => 
    `products:${page}:${limit}${filters ? `:${filters}` : ''}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  settings: () => 'settings:all',
};

