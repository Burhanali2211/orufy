import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

/**
 * Redis cache implementation for distributed caching
 * Falls back to in-memory cache if Redis is unavailable
 */

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private hits: number = 0;
  private misses: number = 0;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize() {
    // Only use Redis if REDIS_URL is configured
    if (!process.env.REDIS_URL) {
      logger.info('Redis not configured, using in-memory cache', { context: 'Redis' });
      return;
    }

    try {
      this.connectionAttempts++;
      
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached', { context: 'Redis' });
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
            return Math.min(retries * 50, 3000);
          }
        }
      });

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis client error', err, { context: 'Redis' });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...', { context: 'Redis' });
      });

      this.client.on('ready', () => {
        logger.success('Redis client connected and ready', { context: 'Redis' });
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...', { context: 'Redis' });
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection closed', { context: 'Redis' });
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
    } catch (error) {
      logger.error('Failed to initialize Redis', error, { context: 'Redis' });
      this.client = null;
      this.isConnected = false;

      // Retry connection if under max attempts
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        logger.info(`Retrying Redis connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`, { context: 'Redis' });
        setTimeout(() => this.initialize(), 5000);
      } else {
        logger.warn('Redis connection failed, falling back to in-memory cache', { context: 'Redis' });
      }
    }
  }

  /**
   * Get value from Redis cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      this.misses++;
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (!value || typeof value !== 'string') {
        this.misses++;
        logger.debug(`Redis cache miss: ${key}`, { context: 'Redis' });
        return null;
      }

      this.hits++;
      logger.debug(`Redis cache hit: ${key}`, { context: 'Redis' });
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error', error, { context: 'Redis', data: { key } });
      this.misses++;
      return null;
    }
  }

  /**
   * Set value in Redis cache with TTL (time to live) in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const value = typeof data === "string" ? data : JSON.stringify(data);
      await this.client.setEx(key, ttlSeconds, value);
      logger.debug(`Redis cache set: ${key} (TTL: ${ttlSeconds}s)`, { context: 'Redis' });
    } catch (error) {
      logger.error('Redis set error', error, { context: 'Redis', data: { key } });
    }
  }

  /**
   * Delete value from Redis cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
      logger.debug(`Redis cache deleted: ${key}`, { context: 'Redis' });
    } catch (error) {
      logger.error('Redis delete error', error, { context: 'Redis', data: { key } });
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      // Use SCAN to find matching keys (safer than KEYS for production)
      const keys: string[] = [];
      let cursor: string = '0';

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });

        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`Redis pattern deleted: ${pattern} (${keys.length} keys)`, { context: 'Redis' });
      }
    } catch (error) {
      logger.error('Redis deletePattern error', error, { context: 'Redis', data: { pattern } });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushDb();
      this.hits = 0;
      this.misses = 0;
      logger.info('Redis cache cleared', { context: 'Redis' });
    } catch (error) {
      logger.error('Redis clear error', error, { context: 'Redis' });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      type: this.isConnected ? 'redis' : 'unavailable',
      connected: this.isConnected,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis connection closed', { context: 'Redis' });
      } catch (error) {
        logger.error('Error closing Redis connection', error, { context: 'Redis' });
      }
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCache();

/**
 * Redis cache key generators (same as in-memory cache for consistency)
 */
export const RedisCacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number, filters?: string) =>
    `products:${page}:${limit}${filters ? `:${filters}` : ''}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  settings: () => 'settings:all',
};

