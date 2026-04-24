import { logger } from './logger';

/**
 * Simple in-memory cache implementation
 * For production, consider using Redis for distributed caching
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private hits: number;
  private misses: number;

  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      logger.debug(`Cache miss: ${key}`, { context: 'Cache' });
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      logger.debug(`Cache expired: ${key}`, { context: 'Cache' });
      return null;
    }

    this.hits++;
    logger.debug(`Cache hit: ${key}`, { context: 'Cache' });
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL (time to live) in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
    logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`, { context: 'Cache' });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`, { context: 'Cache' });
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    logger.info(`Cache pattern deleted: ${pattern} (${count} keys)`, { context: 'Cache' });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    logger.info(`Cache cleared (${size} keys)`, { context: 'Cache' });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate.toFixed(2)}%`,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Cache cleanup: removed ${count} expired entries`, { context: 'Cache' });
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.entries());
    const jsonSize = JSON.stringify(entries).length;
    const mb = jsonSize / 1024 / 1024;
    return `${mb.toFixed(2)}MB`;
  }
}

// Export singleton instance
export const cache = new Cache();

/**
 * Cache key generators for common patterns
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

