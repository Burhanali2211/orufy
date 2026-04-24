import { DataService } from './dataService';

// Retry configuration interface
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  timeout: number;
  retryableErrors?: string[];
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  backoffMultiplier: 2,
  timeout: 10000,
  retryableErrors: [
    'network error',
    'timeout',
    'server error',
    'database connection lost',
    'connection refused',
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN'
  ]
};

// Retry utility class
export class RetryManager extends DataService {
  // Execute a function with retry logic
  static async execute<T>(
    fn: () => Promise<T>, 
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Operation timed out'));
          }, finalConfig.timeout);
        });
        
        // Race the function against the timeout
        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === finalConfig.maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isRetryable(error, finalConfig)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
        
        // Wait before retrying
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  // Check if an error is retryable based on configuration
  private static isRetryable(error: any, config: RetryConfig): boolean {
    if (!config.retryableErrors) return true;
    
    const errorMessage = String(error.message || error).toLowerCase();
    
    return config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  // Simple delay function
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Decorator for automatic retry logic
export function Retry(config: Partial<RetryConfig> = {}) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      return RetryManager.execute(() => originalMethod.apply(this, args), config);
    };
    
    return descriptor;
  };
}