import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
  timeout?: number; // Add timeout support
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenAttempts: number; // Add half-open attempts configuration
}

// Add bandwidth detection interface
export interface BandwidthInfo {
  downlink: number;
  effectiveType: string;
  rtt: number;
  isSlowConnection: boolean;
}

// Add request prioritization interface
export type RequestPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

// Add performance monitoring interface
export interface NetworkMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  bandwidthUsage: number;
  retryCount: number;
  circuitBreakerEvents: number;
}

// Network status hook
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g',
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();
    const handleConnectionChange = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};

// Enhanced retry mechanism with improved exponential backoff and jitter
export const createRetryableRequest = <T>(
  requestFn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    timeout = 30000, // Default 30 second timeout
    retryCondition = (error: Error) => {
      // Retry on network errors, timeouts, and 5xx status codes
      return error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('fetch') ||
             (error as any).status >= 500;
    }
  } = config;

  return async (): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
        
        const result = await Promise.race([requestFn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if condition is not met
        if (!retryCondition(lastError)) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff and jitter
        // Jitter helps prevent thundering herd problems
        const exponentialDelay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
        const jitter = Math.random() * 0.5 * exponentialDelay; // Up to 50% jitter
        const delay = exponentialDelay + jitter;
        
        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };
};

// Enhanced Circuit breaker with improved half-open state handling and metrics
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private config: CircuitBreakerConfig;
  private halfOpenSuccesses = 0; // Track successes in half-open state
  private metrics: NetworkMetrics = {
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    averageResponseTime: 0,
    bandwidthUsage: 0,
    retryCount: 0,
    circuitBreakerEvents: 0
  };
  private failureTimestamps: number[] = []; // Track failure timestamps for sliding window

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      halfOpenAttempts: 3, // Number of successful attempts needed to close circuit
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.requestCount++;
    const startTime = Date.now();
    
    // Check if circuit is open and if reset timeout has passed
    if (this.state === 'open') {
      // Check if we should move to half-open state
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
        this.halfOpenSuccesses = 0;
        this.metrics.circuitBreakerEvents++;
      } else {
        // Circuit is still open, reject request
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await operation();
      
      // Handle successful request in half-open state
      if (this.state === 'half-open') {
        this.halfOpenSuccesses++;
        
        // If we've had enough successful attempts, close the circuit
        if (this.halfOpenSuccesses >= this.config.halfOpenAttempts) {
          this.state = 'closed';
          this.failures = 0;
          this.failureTimestamps = []; // Clear failure history
          this.metrics.circuitBreakerEvents++;
        }
      } else {
        // Normal success in closed state
        this.metrics.successCount++;
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.successCount - 1) + responseTime) / 
        this.metrics.successCount;
      
      return result;
    } catch (error) {
      // Record failure
      this.failures++;
      this.lastFailureTime = Date.now();
      this.failureTimestamps.push(this.lastFailureTime);
      this.metrics.failureCount++;
      this.metrics.circuitBreakerEvents++;
      
      // Clean up old failure timestamps (older than monitoring period)
      const cutoffTime = Date.now() - this.config.monitoringPeriod;
      this.failureTimestamps = this.failureTimestamps.filter(timestamp => timestamp > cutoffTime);
      
      // Check if we should open the circuit
      // Use either absolute failure count or recent failure rate
      const recentFailures = this.failureTimestamps.length;
      const shouldOpenCircuit = 
        this.failures >= this.config.failureThreshold || 
        (this.state === 'half-open') || // Always open if failure occurs in half-open state
        (recentFailures >= this.config.failureThreshold && this.state === 'closed');
      
      if (shouldOpenCircuit) {
        this.state = 'open';
      }
      
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      halfOpenSuccesses: this.halfOpenSuccesses,
      metrics: { ...this.metrics },
      recentFailureRate: this.failureTimestamps.length / (this.config.monitoringPeriod / 1000 / 60) // failures per minute
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.halfOpenSuccesses = 0;
    this.failureTimestamps = [];
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Enhanced Offline queue with request persistence and sync capabilities
export class OfflineRequestQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
    retries: number;
    priority: RequestPriority;
    tags: string[]; // Tags for grouping and cancellation
    persist: boolean; // Whether to persist this request across sessions
    data?: any; // Request data for persistence
  }> = [];
  
  private isProcessing = false;
  private maxRetries = 3;
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private bandwidthThreshold = 0.5; // Mbps threshold for slow connection
  private persistenceKey = 'offline-request-queue'; // LocalStorage key

  constructor() {
    // Load persisted requests from localStorage on initialization
    this.loadPersistedRequests();
    
    // Process queue when coming back online
    window.addEventListener('online', () => {
      this.processQueue();
    });

    // Persist queue to localStorage when going offline
    window.addEventListener('offline', () => {
      this.persistQueue();
    });

    // Clean up old requests periodically
    setInterval(() => {
      this.cleanupOldRequests();
    }, 60000); // Every minute
  }

  async enqueue<T>(
    request: () => Promise<T>, 
    priority: RequestPriority = 'normal',
    tags: string[] = [],
    persist: boolean = false,
    data?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert request in priority order (critical first, background last)
      const priorityOrder: RequestPriority[] = ['critical', 'high', 'normal', 'low', 'background'];
      const insertIndex = this.queue.findIndex(item => 
        priorityOrder.indexOf(item.priority) > priorityOrder.indexOf(priority)
      );
      
      const queueItem = {
        id,
        request,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0,
        priority,
        tags,
        persist,
        data
      };
      
      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      // Try to process immediately if online
      if (navigator.onLine) {
        this.processQueue();
      } else if (persist) {
        // Persist immediately if offline and persistence is requested
        this.persistQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Sort by priority before processing
    const priorityOrder: RequestPriority[] = ['critical', 'high', 'normal', 'low', 'background'];
    this.queue.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

    // Process high priority requests first, but limit concurrent processing
    const highPriorityRequests = this.queue.filter(item => 
      item.priority === 'critical' || item.priority === 'high'
    );
    
    const otherRequests = this.queue.filter(item => 
      item.priority !== 'critical' && item.priority !== 'high'
    );

    // Process up to 3 high priority requests concurrently
    const processBatch = async (requests: typeof this.queue, maxConcurrent: number = 3) => {
      for (let i = 0; i < requests.length; i += maxConcurrent) {
        const batch = requests.slice(i, i + maxConcurrent);
        await Promise.all(batch.map(async (item) => {
          try {
            const result = await item.request();
            item.resolve(result);
            // Remove from queue
            this.queue = this.queue.filter(q => q.id !== item.id);
          } catch (error) {
            item.retries++;
            
            if (item.retries < this.maxRetries) {
              // Re-queue for retry with lower priority
              item.priority = this.downgradePriority(item.priority);
              // Move to end of same priority level
              this.queue = this.queue.filter(q => q.id !== item.id);
              this.queue.push(item);
            } else {
              item.reject(error);
              // Remove from queue
              this.queue = this.queue.filter(q => q.id !== item.id);
              console.error(`Failed to process request ${item.id} after ${this.maxRetries} retries:`, error);
            }
          }
        }));
      }
    };

    // Process high priority requests first
    if (highPriorityRequests.length > 0) {
      await processBatch(highPriorityRequests, 3);
    }

    // Then process other requests
    if (otherRequests.length > 0) {
      await processBatch(otherRequests, 2);
    }

    this.isProcessing = false;
    
    // Persist any remaining requests
    if (this.queue.length > 0) {
      this.persistQueue();
    }
  }

  private downgradePriority(priority: RequestPriority): RequestPriority {
    const priorityLevels: RequestPriority[] = ['critical', 'high', 'normal', 'low', 'background'];
    const currentIndex = priorityLevels.indexOf(priority);
    if (currentIndex >= 0 && currentIndex < priorityLevels.length - 1) {
      const nextPriority = priorityLevels[currentIndex + 1];
      return nextPriority ?? priority;
    }
    return priority;
  }

  private cleanupOldRequests() {
    const now = Date.now();
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      const isOld = now - item.timestamp > this.maxAge;
      if (isOld) {
        item.reject(new Error('Request expired'));
      }
      return !isOld;
    });
    
    if (initialLength !== this.queue.length) {
    }
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      oldestRequest: this.queue.length > 0 && this.queue[0] ? this.queue[0].timestamp : null,
      priorityBreakdown: this.getPriorityBreakdown(),
      persistedRequests: this.queue.filter(item => item.persist).length
    };
  }

  private getPriorityBreakdown() {
    const breakdown: Record<RequestPriority, number> = {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0,
      background: 0
    };
    
    this.queue.forEach(item => {
      breakdown[item.priority]++;
    });
    
    return breakdown;
  }

  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.clearPersistedQueue();
  }

  cancelRequestsByTag(tag: string) {
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      if (item && item.tags && item.tags.includes(tag)) {
        item.reject(new Error(`Request cancelled by tag: ${tag}`));
        return false;
      }
      return true;
    });
    
    if (initialLength !== this.queue.length) {
      // Update persisted queue if any requests were cancelled
      if (this.queue.some(item => item.persist)) {
        this.persistQueue();
      }
    }
  }

  // Bandwidth-aware processing
  setBandwidthThreshold(threshold: number) {
    this.bandwidthThreshold = threshold;
  }

  // Persist queue to localStorage
  private persistQueue() {
    try {
      const persistableItems = this.queue
        .filter(item => item.persist)
        .map(item => ({
          id: item.id,
          timestamp: item.timestamp,
          retries: item.retries,
          priority: item.priority,
          tags: item.tags,
          data: item.data
        }));
      
      if (persistableItems.length > 0) {
        localStorage.setItem(this.persistenceKey, JSON.stringify(persistableItems));
      } else {
        // Clear persisted queue if no items to persist
        this.clearPersistedQueue();
      }
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  // Load persisted requests from localStorage
  private loadPersistedRequests() {
    try {
      const persistedData = localStorage.getItem(this.persistenceKey);
      if (persistedData) {
        const persistedItems = JSON.parse(persistedData);
        // Note: We can't recreate the actual request functions, so we just log them
        // In a real implementation, you'd need to recreate the requests based on the stored data
      }
    } catch (error) {
      console.error('Failed to load persisted offline queue:', error);
    }
  }

  // Clear persisted queue from localStorage
  private clearPersistedQueue() {
    try {
      localStorage.removeItem(this.persistenceKey);
    } catch (error) {
      console.error('Failed to clear persisted offline queue:', error);
    }
  }

  // Sync method to manually trigger queue processing
  async sync() {
    if (navigator.onLine) {
      await this.processQueue();
    } else {
    }
  }
}

// Enhanced hook for graceful degradation with bandwidth awareness
// Note: Only disable images when fully offline. Mobile often reports "2g" incorrectly on 4G.
export const useGracefulDegradation = () => {
  const networkStatus = useNetworkStatus();
  const [degradationLevel, setDegradationLevel] = useState<'none' | 'partial' | 'full'>('none');

  useEffect(() => {
    if (!networkStatus.isOnline) {
      setDegradationLevel('full');
    } else if (networkStatus.isSlowConnection || networkStatus.downlink < 0.5) {
      setDegradationLevel('partial');
    } else {
      setDegradationLevel('none');
    }
  }, [networkStatus]);

  // Always load images when online - mobile "2g" detection is often false positive
  const shouldLoadImages = networkStatus.isOnline;
  const shouldLoadAnimations = degradationLevel === 'none';
  const shouldUseOptimizedQueries = degradationLevel !== 'none';
  const shouldShowOfflineMessage = degradationLevel === 'full';
  const shouldReduceImageQuality = degradationLevel !== 'none'; // New: reduce image quality on slow connections

  return {
    networkStatus,
    degradationLevel,
    shouldLoadImages,
    shouldLoadAnimations,
    shouldUseOptimizedQueries,
    shouldShowOfflineMessage,
    shouldReduceImageQuality
  };
};

// Global instances with enhanced configurations
export const globalCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Allow 5 failures before opening
  resetTimeout: 60000, // 1 minute before trying again
  monitoringPeriod: 300000, // 5 minutes sliding window
  halfOpenAttempts: 3 // Need 3 successful attempts to close
});

export const globalOfflineQueue = new OfflineRequestQueue();

// Enhanced fetch with resilience features and request prioritization
export const resilientFetch = async (
  url: string,
  options: RequestInit = {},
  config: {
    useRetry?: boolean;
    useCircuitBreaker?: boolean;
    useOfflineQueue?: boolean;
    retryConfig?: Partial<RetryConfig>;
    priority?: RequestPriority;
    tags?: string[];
    timeout?: number;
  } = {}
) => {
  const {
    useRetry = true,
    useCircuitBreaker = true,
    useOfflineQueue = true,
    retryConfig = {},
    priority = 'normal',
    tags = [],
    timeout = 30000
  } = config;

  let fetchOperation = () => fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });

  // Add retry mechanism with enhanced configuration
  if (useRetry) {
    fetchOperation = createRetryableRequest(fetchOperation, { 
      ...retryConfig, 
      timeout,
      maxRetries: retryConfig.maxRetries ?? 3,
      baseDelay: retryConfig.baseDelay ?? 1000,
      maxDelay: retryConfig.maxDelay ?? 10000,
      backoffFactor: retryConfig.backoffFactor ?? 2
    });
  }

  // Add circuit breaker
  if (useCircuitBreaker) {
    const originalOperation = fetchOperation;
    fetchOperation = () => globalCircuitBreaker.execute(originalOperation);
  }

  // Add offline queue
  if (useOfflineQueue && !navigator.onLine) {
    return globalOfflineQueue.enqueue(fetchOperation, priority, tags);
  }

  return fetchOperation();
};

// Bandwidth detection utility
export const getBandwidthInfo = (): BandwidthInfo => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection) {
    return {
      downlink: connection.downlink || 0,
      effectiveType: connection.effectiveType || 'unknown',
      rtt: connection.rtt || 0,
      isSlowConnection: connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || (connection.downlink || 0) < 0.5
    };
  }
  
  return {
    downlink: 0,
    effectiveType: 'unknown',
    rtt: 0,
    isSlowConnection: !navigator.onLine
  };
};

// Request bundling utility for multiple requests
export const bundleRequests = async <T>(
  requests: Array<() => Promise<T>>,
  maxConcurrent = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  // Process requests in batches to avoid overwhelming the network
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map(req => req()));
    results.push(...batchResults);
  }
  
  return results;
};

// Request deduplication utility
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear() {
    this.pendingRequests.clear();
  }
}

// Global request deduplicator instance
export const globalRequestDeduplicator = new RequestDeduplicator();