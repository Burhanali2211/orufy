import { performanceMonitor } from './performance';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface CacheStrategy {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  gcInterval: number; // Garbage collection interval
  compressionThreshold: number; // Size threshold for compression
}

interface CacheStats {
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  totalSize: number;
  entryCount: number;
  gcRuns: number;
  lastGC: number;
}

class EnhancedCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private strategy: CacheStrategy;
  private stats: CacheStats = {
    hitRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    totalSize: 0,
    entryCount: 0,
    gcRuns: 0,
    lastGC: Date.now()
  };
  private gcTimer: NodeJS.Timeout | null = null;
  private backgroundUpdateQueue: Set<string> = new Set();

  constructor(strategy: Partial<CacheStrategy> = {}) {
    this.strategy = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      gcInterval: 60 * 1000, // 1 minute
      compressionThreshold: 1024, // 1KB
      ...strategy
    };

    this.startGarbageCollection();
  }

  /**
   * Set data in cache with optional configuration
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      compress?: boolean;
    } = {}
  ): void {
    performanceMonitor.startMeasure(`cache-set-${key}`);
    const { 
      ttl = this.strategy.defaultTTL, 
      priority = 'medium', 
      tags = [], 
      compress = false 
    } = options;

    const serializedData = this.serializeData(data, compress);
    const size = this.calculateSize(serializedData);

    // Check cache limits
    if (this.shouldEvict(size)) {
      this.evictEntries(size);
    }

    const entry: CacheEntry<T> = {
      data: serializedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      priority,
      tags
    };

    this.cache.set(key, entry);
    this.updateStats('set', size);

    performanceMonitor.endMeasure(`cache-set-${key}`);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    performanceMonitor.startMeasure(`cache-get-${key}`);
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateHitRate();
      performanceMonitor.endMeasure(`cache-get-${key}`, false);
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateStats('delete', entry.size);
      this.updateHitRate();
      performanceMonitor.endMeasure(`cache-get-${key}`, false);
      
      // Queue for background update if high priority
      if (entry.priority === 'high') {
        this.queueBackgroundUpdate(key);
      }
      
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.totalHits++;
    this.updateHitRate();
    performanceMonitor.endMeasure(`cache-get-${key}`);
    
    return this.deserializeData(entry.data);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.updateStats('delete', entry.size);
      return true;
    }
    return false;
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        this.updateStats('delete', entry.size);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      ...this.stats,
      totalSize: 0,
      entryCount: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Prefetch data and store in cache
   */
  async prefetch<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
    } = {}
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data, { priority: 'high', ...options });
      return data;
    } catch (error) {
      console.warn(`Prefetch failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data with fallback to fetch function
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      staleWhileRevalidate?: boolean;
    } = {}
  ): Promise<T> {
    const { staleWhileRevalidate = false, ...cacheOptions } = options;
    
    const cachedData = this.get<T>(key);
    
    if (cachedData !== null) {
      // If stale-while-revalidate is enabled, update in background
      if (staleWhileRevalidate) {
        this.queueBackgroundUpdate(key, fetchFn, cacheOptions);
      }
      return cachedData;
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFn();
      this.set(key, freshData, cacheOptions);
      return freshData;
    } catch (error) {
      console.error(`Fetch failed for key ${key}:`, error);
      throw error;
    }
  }

  private serializeData<T>(data: T, compress: boolean): any {
    if (compress && typeof data === 'string') {
      // Simple compression simulation (in real app, use proper compression)
      return { compressed: true, data: data };
    }
    return data;
  }

  private deserializeData<T>(data: any): T {
    if (data && data.compressed) {
      return data.data;
    }
    return data;
  }

  private calculateSize(data: any): number {
    // Rough size calculation
    return JSON.stringify(data).length * 2; // 2 bytes per character (UTF-16)
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.stats.totalSize + newEntrySize > this.strategy.maxSize ||
      this.stats.entryCount >= this.strategy.maxEntries
    );
  }

  private evictEntries(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by eviction priority (LRU + priority + access count)
    entries.sort(([, a], [, b]) => {
      // Priority order: low < medium < high
      const priorityScore = { low: 1, medium: 2, high: 3 };
      
      if (a.priority !== b.priority) {
        return priorityScore[a.priority] - priorityScore[b.priority];
      }
      
      // Then by last accessed time (older first)
      if (Math.abs(a.lastAccessed - b.lastAccessed) > 1000) {
        return a.lastAccessed - b.lastAccessed;
      }
      
      // Finally by access count (less accessed first)
      return a.accessCount - b.accessCount;
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace && this.stats.entryCount < this.strategy.maxEntries) {
        break;
      }
      
      this.cache.delete(key);
      freedSpace += entry.size;
      this.updateStats('delete', entry.size);
    }
  }

  private updateStats(operation: 'set' | 'delete', size: number): void {
    if (operation === 'set') {
      this.stats.totalSize += size;
      this.stats.entryCount++;
    } else {
      this.stats.totalSize -= size;
      this.stats.entryCount--;
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
  }

  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.runGarbageCollection();
    }, this.strategy.gcInterval);
  }

  private runGarbageCollection(): void {
    const before = this.stats.entryCount;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.updateStats('delete', entry.size);
      }
    }
    
    this.stats.gcRuns++;
    this.stats.lastGC = now;
    
    const cleaned = before - this.stats.entryCount;
    if (cleaned > 0) {
    }
  }

  private queueBackgroundUpdate(
    key: string, 
    fetchFn?: () => Promise<any>,
    options: any = {}
  ): void {
    if (this.backgroundUpdateQueue.has(key)) return;
    
    this.backgroundUpdateQueue.add(key);
    
    // Schedule background update
    setTimeout(async () => {
      try {
        if (fetchFn) {
          const freshData = await fetchFn();
          this.set(key, freshData, options);
        }
      } catch (error) {
        console.warn(`Background update failed for ${key}:`, error);
      } finally {
        this.backgroundUpdateQueue.delete(key);
      }
    }, 100); // Small delay to batch updates
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
    this.clear();
  }
}

// Cache instances for different use cases
export const primaryCache = new EnhancedCache({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes — aligned with ProductContext
});

export const imageCache = new EnhancedCache({
  maxSize: 150 * 1024 * 1024, // Increased from 100 to 150MB for images
  maxEntries: 300,
  defaultTTL: 60 * 60 * 1000, // Increased from 30 minutes to 1 hour
});

export const apiCache = new EnhancedCache({
  maxSize: 20 * 1024 * 1024, // Increased from 10 to 20MB for API responses
  maxEntries: 500,
  defaultTTL: 10 * 60 * 1000, // Increased from 2 to 10 minutes
});

export const userCache = new EnhancedCache({
  maxSize: 10 * 1024 * 1024, // Increased from 5 to 10MB for user data
  maxEntries: 200,
  defaultTTL: 30 * 60 * 1000, // Increased from 15 to 30 minutes
});

// Legacy cache classes for backward compatibility
export const productCache = primaryCache;
export const categoryCache = primaryCache;

// Utility functions for cache key generation
export const generateCacheKey = (prefix: string, params: Record<string, unknown> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

// Cache invalidation helpers
export const invalidateProductCache = (productId?: string) => {
  if (productId) {
    primaryCache.clearByTags([`product-${productId}`]);
  } else {
    primaryCache.clearByTags(['product']);
  }
};

export const invalidateCategoryCache = () => {
  primaryCache.clearByTags(['category']);
};

export const invalidateUserCache = (userId?: string) => {
  if (userId) {
    userCache.clearByTags([`user-${userId}`]);
  } else {
    userCache.clearByTags(['user']);
  }
};

// Cache management utilities
export const cacheManager = {
  /**
   * Get overall cache statistics
   */
  getOverallStats() {
    return {
      primary: primaryCache.getStats(),
      image: imageCache.getStats(),
      api: apiCache.getStats(),
      user: userCache.getStats()
    };
  },

  /**
   * Clear all caches
   */
  clearAll() {
    primaryCache.clear();
    imageCache.clear();
    apiCache.clear();
    userCache.clear();
  },

  /**
   * Clear caches by tags
   */
  clearByTags(tags: string[]) {
    return {
      primary: primaryCache.clearByTags(tags),
      image: imageCache.clearByTags(tags),
      api: apiCache.clearByTags(tags),
      user: userCache.clearByTags(tags)
    };
  },

  /**
   * Get cache health report
   */
  getHealthReport() {
    const stats = this.getOverallStats();
    const totalSize = Object.values(stats).reduce((sum, stat) => sum + stat.totalSize, 0);
    const avgHitRate = Object.values(stats).reduce((sum, stat) => sum + stat.hitRate, 0) / 4;
    
    return {
      totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
      averageHitRate: Math.round(avgHitRate * 100) / 100,
      cacheUtilization: stats,
      recommendations: this.generateRecommendations(stats)
    };
  },

  generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    Object.entries(stats).forEach(([cacheName, stat]: [string, any]) => {
      if (stat.hitRate < 50) {
        recommendations.push(`${cacheName} cache hit rate is low (${stat.hitRate.toFixed(1)}%)`);
      }
      if (stat.totalSize > 20 * 1024 * 1024) {
        recommendations.push(`${cacheName} cache is large (${(stat.totalSize / 1024 / 1024).toFixed(1)}MB)`);
      }
    });
    
    return recommendations;
  }
};

// Legacy SimpleCache class for backward compatibility
export class SimpleCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000): void {
    primaryCache.set(key, data, { ttl });
  }

  get(key: string): unknown | null {
    return primaryCache.get(key);
  }

  clear(): void {
    primaryCache.clear();
  }

  has(key: string): boolean {
    return primaryCache.has(key);
  }
}

// Original Cache class for backward compatibility
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

class Cache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000;
    this.maxSize = options.maxSize || 100;
  }

  set(key: string, data: T, ttl?: number): void {
    primaryCache.set(key, data, { ttl: ttl || this.defaultTTL });
  }

  get(key: string): T | null {
    return primaryCache.get(key);
  }

  has(key: string): boolean {
    return primaryCache.has(key);
  }

  delete(key: string): boolean {
    return primaryCache.delete(key);
  }

  clear(): void {
    primaryCache.clear();
  }

  getKeysMatching(pattern: string): string[] {
    // Not implemented in enhanced cache, return empty array
    return [];
  }

  invalidatePattern(pattern: string): void {
    // Use tags-based invalidation instead
    primaryCache.clearByTags([pattern]);
  }

  getStats() {
    const stats = primaryCache.getStats();
    return {
      totalItems: stats.entryCount,
      validItems: stats.entryCount,
      expiredItems: 0,
      maxSize: this.maxSize,
      usage: (stats.entryCount / this.maxSize) * 100
    };
  }

  cleanup(): void {
    // Garbage collection is automatic in enhanced cache
  }
}

export default Cache;
