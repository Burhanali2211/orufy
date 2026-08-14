import { DataService } from './dataService';

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number; // milliseconds
  max: number; // number of requests per window
}

// Rate limit store interface
interface RateLimitStore {
  hits: number;
  resetTime: number;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, RateLimitStore>();

// Default rate limit configurations
const RATE_LIMIT_CONFIGS = {
  ANONYMOUS: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
  AUTHENTICATED: { windowMs: 60 * 1000, max: 300 }, // 300 requests per minute
  ADMIN: { windowMs: 60 * 1000, max: 50 } // 50 requests per minute
};

// Rate limiting middleware
export class RateLimiter extends DataService {
  // Check if a request is allowed based on rate limits
  static async checkRateLimit(
    identifier: string, 
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.ANONYMOUS
  ): Promise<{ allowed: boolean; resetTime: number; currentCount: number }> {
    const now = Date.now();
    const key = identifier;
    
    let store = rateLimitStore.get(key);
    
    // Initialize or reset the counter if necessary
    if (!store || now >= store.resetTime) {
      store = {
        hits: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(key, store);
    }
    
    // Check if limit exceeded
    if (store.hits >= config.max) {
      return {
        allowed: false,
        resetTime: store.resetTime,
        currentCount: store.hits
      };
    }
    
    // Increment hit counter
    store.hits++;
    
    return {
      allowed: true,
      resetTime: store.resetTime,
      currentCount: store.hits
    };
  }

  // Get rate limit configuration for a user role
  static getConfig(role?: 'anonymous' | 'authenticated' | 'admin'): RateLimitConfig {
    switch (role) {
      case 'admin':
        return RATE_LIMIT_CONFIGS.ADMIN;
      case 'authenticated':
        return RATE_LIMIT_CONFIGS.AUTHENTICATED;
      default:
        return RATE_LIMIT_CONFIGS.ANONYMOUS;
    }
  }

  // Decorator for applying rate limiting to methods
  static limit(config: RateLimitConfig = RATE_LIMIT_CONFIGS.ANONYMOUS) {
    return function(
      _target: any,
      _propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args: any[]) {
        // Generate a unique identifier for this client
        // In browser, we use localStorage or generate a random one
        let clientId = localStorage.getItem('client_rate_limit_id');
        if (!clientId) {
          clientId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('client_rate_limit_id', clientId);
        }
        
        const identifier = `client:${clientId}`;
        
        // Check rate limit
        const result = await RateLimiter.checkRateLimit(identifier, config);
        
        if (!result.allowed) {
          throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`);
        }
        
        // Execute the original method
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    };
  }

  // Simple method to get client identifier
  static getClientId(): string {
    let clientId = localStorage.getItem('client_rate_limit_id');
    if (!clientId) {
      clientId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('client_rate_limit_id', clientId);
    }
    return clientId;
  }
}