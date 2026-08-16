import React from 'react';
import { RequestPriority, RequestDeduplicator, globalRequestDeduplicator } from './networkResilience';

// Resource management interfaces
export interface ResourceRequest<T = any> {
  id: string;
  url: string;
  priority: RequestPriority;
  tags: string[];
  dependencies: string[];
  retryCount: number;
  maxRetries: number;
  timeout: number;
  dedupKey?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface ResourceManagerConfig {
  maxConcurrentRequests: number;
  bandwidthLimit?: number; // Mbps
  memoryLimit?: number; // MB
  enableDeduplication: boolean;
  enablePrefetching: boolean;
}

export interface ResourceMetrics {
  activeRequests: number;
  queuedRequests: number;
  completedRequests: number;
  failedRequests: number;
  bandwidthUsage: number; // Mbps
  memoryUsage: number; // MB
  averageResponseTime: number; // ms
  requestDistribution: Record<RequestPriority, number>; // Distribution by priority
  successRate: number; // Percentage of successful requests
  retryCount: number; // Total number of retries
}

// Enhanced resource manager with better prioritization and bundling
export class ResourceManager {
  private config: ResourceManagerConfig;
  private activeRequests: Map<string, ResourceRequest> = new Map();
  private requestQueue: ResourceRequest[] = [];
  private metrics: ResourceMetrics = {
    activeRequests: 0,
    queuedRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    bandwidthUsage: 0,
    memoryUsage: 0,
    averageResponseTime: 0,
    requestDistribution: {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0,
      background: 0
    },
    successRate: 100,
    retryCount: 0
  };
  private isProcessing = false;
  private deduplicator: RequestDeduplicator;
  private requestBundles: Map<string, Array<() => Promise<any>>> = new Map();

  constructor(config: Partial<ResourceManagerConfig> = {}) {
    this.config = {
      maxConcurrentRequests: 6,
      enableDeduplication: true,
      enablePrefetching: true,
      ...config
    };
    
    this.deduplicator = globalRequestDeduplicator;
    
    // Clean up completed requests periodically
    setInterval(() => {
      this.cleanupCompletedRequests();
    }, 30000); // Every 30 seconds
  }

  // Add a resource request to the queue
  async addRequest<T>(request: Omit<ResourceRequest<T>, 'id' | 'retryCount'>): Promise<T> {
    const { maxRetries = 3, timeout = 30000, ...rest } = request;
    const fullRequest: ResourceRequest<T> = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      maxRetries,
      timeout,
      ...rest
    };

    // Update request distribution metrics
    this.metrics.requestDistribution[fullRequest.priority] = 
      (this.metrics.requestDistribution[fullRequest.priority] || 0) + 1;

    return new Promise((resolve, reject) => {
      // Add success and error handlers
      fullRequest.onSuccess = resolve;
      fullRequest.onError = reject;

      // Check for deduplication
      if (this.config.enableDeduplication && fullRequest.dedupKey) {
        this.deduplicator.deduplicate(fullRequest.dedupKey, () => {
          return this.processRequest(fullRequest);
        }).then(resolve).catch(reject);
        return;
      }

      // Add to queue based on priority
      this.enqueueRequest(fullRequest);
    });
  }

  // Enqueue request based on priority
  private enqueueRequest<T>(request: ResourceRequest<T>) {
    // Insert request in priority order (critical first, background last)
    const priorityOrder: RequestPriority[] = ['critical', 'high', 'normal', 'low', 'background'];
    const insertIndex = this.requestQueue.findIndex(item => 
      priorityOrder.indexOf(item.priority) > priorityOrder.indexOf(request.priority)
    );
    
    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }

    this.metrics.queuedRequests = this.requestQueue.length;
    this.processQueue();
  }

  // Process the request queue
  private async processQueue() {
    if (this.isProcessing || this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests.size < this.config.maxConcurrentRequests) {
      const request = this.requestQueue.shift()!;
      
      // Check dependencies
      if (request.dependencies.length > 0) {
        const allDependenciesMet = request.dependencies.every(depId => !this.activeRequests.has(depId));
        if (!allDependenciesMet) {
          // Put back in queue and continue
          this.requestQueue.unshift(request);
          continue;
        }
      }

      this.activeRequests.set(request.id, request);
      this.metrics.activeRequests = this.activeRequests.size;
      this.metrics.queuedRequests = this.requestQueue.length;

      // Process the request
      this.processRequest(request).catch(error => {
        console.error(`Request ${request.id} failed:`, error);
        request.onError?.(error);
      });
    }

    this.isProcessing = false;
  }

  // Process individual request with enhanced error handling
  private async processRequest<T>(request: ResourceRequest<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${request.timeout}ms`)), request.timeout);
      });

      // Process the actual request
      const result = await Promise.race([
        this.executeRequest(request),
        timeoutPromise
      ]);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Update metrics
      this.updateMetrics(responseTime, true);
      
      // Remove from active requests
      this.activeRequests.delete(request.id);
      this.metrics.activeRequests = this.activeRequests.size;
      this.metrics.completedRequests++;
      
      // Update success rate
      const totalRequests = this.metrics.completedRequests + this.metrics.failedRequests;
      if (totalRequests > 0) {
        this.metrics.successRate = (this.metrics.completedRequests / totalRequests) * 100;
      }
      
      // Trigger success callback
      request.onSuccess?.(result);
      
      // Continue processing queue before returning
      this.processQueue();
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Update metrics
      this.updateMetrics(responseTime, false);
      
      // Handle retries
      if (request.retryCount < request.maxRetries) {
        request.retryCount++;
        this.metrics.retryCount++;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, request.retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Re-queue with lower priority
        this.enqueueRequest({
          ...request,
          priority: this.downgradePriority(request.priority)
        });
      } else {
        // Remove from active requests
        this.activeRequests.delete(request.id);
        this.metrics.activeRequests = this.activeRequests.size;
        this.metrics.failedRequests++;
        
        // Update success rate
        const totalRequests = this.metrics.completedRequests + this.metrics.failedRequests;
        if (totalRequests > 0) {
          this.metrics.successRate = (this.metrics.completedRequests / totalRequests) * 100;
        }
        
        // Trigger error callback
        request.onError?.(error as Error);
        
        // Continue processing queue before throwing
        this.processQueue();
        
        throw error;
      }
      
      // This line should never be reached, but TypeScript needs it for type safety
      throw new Error('Unexpected code path in processRequest');
    }
  }

  // Execute the actual request with proper error handling
  private async executeRequest<T>(request: ResourceRequest<T>): Promise<T> {
    try {
      // For image requests, we just need to check if they load successfully
      if (request.url && (request.url.includes('.jpg') || request.url.includes('.png') || request.url.includes('.webp') || request.url.includes('.avif'))) {
        // This is a simplified implementation - in a real app, you'd integrate with your image service
        const response = await fetch(request.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // For images, we don't need to parse as JSON, just return a success indicator
        return { url: request.url, status: 'loaded' } as unknown as T;
      }
      
      // For other requests, use standard fetch
      const response = await fetch(request.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  // Update performance metrics
  private updateMetrics(responseTime: number, success: boolean) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.completedRequests + this.metrics.failedRequests - 1) + responseTime) / 
      (this.metrics.completedRequests + this.metrics.failedRequests);
    
    // Update success rate
    const totalRequests = this.metrics.completedRequests + this.metrics.failedRequests;
    if (totalRequests > 0) {
      this.metrics.successRate = (this.metrics.completedRequests / totalRequests) * 100;
    }
  }

  // Downgrade priority for retries
  private downgradePriority(priority: RequestPriority): RequestPriority {
    const priorityLevels: RequestPriority[] = ['critical', 'high', 'normal', 'low', 'background'];
    const currentIndex = priorityLevels.indexOf(priority);
    if (currentIndex >= 0 && currentIndex < priorityLevels.length - 1) {
      const nextIndex = currentIndex + 1;
      return priorityLevels[nextIndex] as RequestPriority;
    }
    // If we can't downgrade further, return the lowest priority
    return 'background';
  }

  // Cancel requests by tag
  cancelRequestsByTag(tag: string) {
    // Cancel queued requests
    this.requestQueue = this.requestQueue.filter(request => {
      if (request.tags.includes(tag)) {
        request.onError?.(new Error(`Request cancelled by tag: ${tag}`));
        return false;
      }
      return true;
    });
    
    // Cancel active requests (in a real implementation, this would abort the fetch)
    this.activeRequests.forEach((request, id) => {
      if (request.tags.includes(tag)) {
        request.onError?.(new Error(`Request cancelled by tag: ${tag}`));
        this.activeRequests.delete(id);
      }
    });
    
    this.metrics.queuedRequests = this.requestQueue.length;
    this.metrics.activeRequests = this.activeRequests.size;
  }

  // Bundle multiple requests for concurrent execution
  async bundleRequests<T>(requests: Array<() => Promise<T>>, bundleKey: string, maxConcurrent: number = 3): Promise<T[]> {
    // Store the bundle for potential reuse
    this.requestBundles.set(bundleKey, requests as any);
    
    const results: T[] = [];
    
    // Process requests in batches to avoid overwhelming the network
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }
    
    return results;
  }

  // Prefetch resources with priority management
  async prefetchResources<T>(requests: Array<Omit<ResourceRequest<T>, 'id' | 'retryCount' | 'priority'>>) {
    if (!this.config.enablePrefetching) {
      return;
    }
    
    const prefetchRequests = requests.map(request => ({
      ...request,
      priority: 'background' as RequestPriority,
      maxRetries: 1 // Fewer retries for prefetching
    }));
    
    // Process prefetch requests with lower priority
    await Promise.all(prefetchRequests.map(req => this.addRequest(req)));
  }

  // Get current metrics
  getMetrics(): ResourceMetrics {
    return { ...this.metrics };
  }

  // Cleanup completed requests to prevent memory leaks
  private cleanupCompletedRequests() {
    // In a real implementation, this would clean up any cached responses or references
    // For now, we're just ensuring the metrics don't grow indefinitely
    if (this.metrics.completedRequests > 1000) {
      this.metrics.completedRequests = Math.floor(this.metrics.completedRequests / 2);
    }
    
    if (this.metrics.failedRequests > 1000) {
      this.metrics.failedRequests = Math.floor(this.metrics.failedRequests / 2);
    }
  }

  // Clear all requests
  clear() {
    // Cancel all active requests
    this.activeRequests.forEach(request => {
      request.onError?.(new Error('Request cancelled: ResourceManager cleared'));
    });
    
    // Clear queue
    this.requestQueue.forEach(request => {
      request.onError?.(new Error('Request cancelled: ResourceManager cleared'));
    });
    
    this.activeRequests.clear();
    this.requestQueue = [];
    
    this.metrics.activeRequests = 0;
    this.metrics.queuedRequests = 0;
  }
}

// Global resource manager instance
export const globalResourceManager = new ResourceManager({
  maxConcurrentRequests: 6,
  enableDeduplication: true,
  enablePrefetching: true
});

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private observers: Array<() => void> = [];
  private memoryThreshold = 0.8; // 80% memory usage threshold

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      // @ts-ignore
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        if (usageRatio > this.memoryThreshold) {
          this.notifyObservers();
        }
      }
    }
  }

  // Add observer for memory pressure events
  addObserver(callback: () => void) {
    this.observers.push(callback);
  }

  // Remove observer
  removeObserver(callback: () => void) {
    this.observers = this.observers.filter(observer => observer !== callback);
  }

  // Notify all observers of memory pressure
  private notifyObservers() {
    this.observers.forEach(observer => observer());
  }

  // Force garbage collection (only works in certain environments)
  forceGC() {
    if ('gc' in window) {
      // @ts-ignore
      window.gc();
    }
  }
}

// Global memory manager instance
export const globalMemoryManager = MemoryManager.getInstance();

// Utility function to create resource-efficient components
export const withResourceManagement = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    // Add memory pressure handling
    React.useEffect(() => {
      const handleMemoryPressure = () => {
        // Reduce quality, cancel non-critical requests, etc.
        globalResourceManager.cancelRequestsByTag('non-critical');
      };
      
      globalMemoryManager.addObserver(handleMemoryPressure);
      
      return () => {
        globalMemoryManager.removeObserver(handleMemoryPressure);
      };
    }, []);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withResourceManagement(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};