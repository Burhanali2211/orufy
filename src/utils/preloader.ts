/**
 * Preloader utility for optimistic data loading
 */

import { db } from '../lib/legacyDb';
import { productCache, categoryCache, generateCacheKey } from './cache';

// Helper functions for preloader
const getProductById = async (productId: string) => {
  return api.products.get(productId);
};

const getProductsBasic = async (params: { 
  categoryId?: string; 
  limit?: number; 
  offset?: number;
  featured?: boolean;
}) => {
  const result = await api.products.list({
    categoryId: params.categoryId,
    limit: params.limit || 12,
    page: params.offset ? Math.floor(params.offset / (params.limit || 12)) + 1 : 1,
    featured: params.featured,
  });
  return result.data;
};

const getCategories = async () => {
  return api.categories.list();
};

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  force?: boolean;
}

class DataPreloader {
  private preloadQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private preloadedItems = new Set<string>();

  /**
   * Preload product details when user hovers over product card
   */
  async preloadProduct(productId: string, options: PreloadOptions = {}) {
    const { priority = 'medium', timeout = 8000, force = false } = options; // Increased timeout
    
    const cacheKey = `product-${productId}`;
    
    // Skip if already preloaded and not forced
    if (this.preloadedItems.has(cacheKey) && !force) {
      return;
    }

    // Skip if already in cache
    if (productCache.has(cacheKey) && !force) {
      this.preloadedItems.add(cacheKey);
      return;
    }

    const preloadTask = async () => {
      try {
        
        const product = await Promise.race([
          getProductById(productId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Preload timeout')), timeout)
          )
        ]) as unknown;

        if (product) {
          productCache.set(cacheKey, product, 5 * 60 * 1000); // 5 minute cache
          this.preloadedItems.add(cacheKey);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload product ${productId}:`, error);
      }
    };

    // Add to queue based on priority
    if (priority === 'high') {
      this.preloadQueue.unshift(preloadTask);
    } else {
      this.preloadQueue.push(preloadTask);
    }

    this.processQueue();
  }

  /**
   * Preload products for a category
   */
  async preloadCategoryProducts(categoryId: string, options: PreloadOptions = {}) {
    const { priority = 'low', timeout = 8000, force = false } = options;
    
    const cacheKey = `category-products-${categoryId}`;
    
    if (this.preloadedItems.has(cacheKey) && !force) {
      return;
    }

    const preloadTask = async () => {
      try {
        
        const products = await Promise.race([
          getProductsBasic({ categoryId, limit: 12 }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Preload timeout')), timeout)
          )
        ]) as unknown;

        if (products && products.length > 0) {
          productCache.set(cacheKey, products, 3 * 60 * 1000); // 3 minute cache
          this.preloadedItems.add(cacheKey);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload category products ${categoryId}:`, error);
      }
    };

    if (priority === 'high') {
      this.preloadQueue.unshift(preloadTask);
    } else {
      this.preloadQueue.push(preloadTask);
    }

    this.processQueue();
  }

  /**
   * Preload next page of products
   */
  async preloadNextPage(currentOffset: number, limit: number = 12, options: PreloadOptions = {}) {
    const { timeout = 10000 } = options; // Increased timeout for page preloading
    
    const nextOffset = currentOffset + limit;
    const cacheKey = `products-page-${nextOffset}-${limit}`;
    
    if (this.preloadedItems.has(cacheKey)) {
      return;
    }

    const preloadTask = async () => {
      try {
        
        const products = await Promise.race([
          getProductsBasic({ limit, offset: nextOffset }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Preload timeout')), timeout)
          )
        ]) as unknown;

        if (products && products.length > 0) {
          productCache.set(cacheKey, products, 2 * 60 * 1000); // 2 minute cache
          this.preloadedItems.add(cacheKey);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload next page:`, error);
      }
    };

    this.preloadQueue.push(preloadTask);
    this.processQueue();
  }

  /**
   * Preload essential data for faster navigation
   */
  async preloadEssentials() {
    // ProductContext owns categories, featured, latest, and bestseller product data.
    // It fetches these on mount with its own sessionStorage cache (5-min TTL).
    // Writing the same data into primaryCache (a separate store) creates divergence
    // where two caches can serve different product data at the same time.
    // This method is intentionally a no-op — ProductContext is the single source of truth.
  }

  /**
   * Process the preload queue
   */
  private async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.warn('Preload task failed:', error);
        }
        
        // Small delay between tasks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear preload cache and queue
   */
  clear() {
    this.preloadQueue = [];
    this.preloadedItems.clear();
    this.isProcessing = false;
  }

  /**
   * Get preloader statistics
   */
  getStats() {
    return {
      queueLength: this.preloadQueue.length,
      preloadedItems: this.preloadedItems.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Smart preload based on user behavior
   */
  smartPreload(context: {
    currentPage?: string;
    userScrollPosition?: number;
    timeOnPage?: number;
    previousPages?: string[];
  }) {
    const { currentPage, userScrollPosition = 0, timeOnPage = 0 } = context;

    // If user has been on page for more than 10 seconds and scrolled, preload next page
    if (timeOnPage > 10000 && userScrollPosition > 0.5) {
      if (currentPage === 'products') {
        this.preloadNextPage(0); // Preload next page of products
      }
    }

    // Home page essentials are handled by ProductContext on mount.

    // If user is viewing a product, preload related products
    if (currentPage?.startsWith('product-') && timeOnPage > 3000) {
      // Could implement related products preloading here
    }
  }
}

// Create singleton instance
export const dataPreloader = new DataPreloader();

// ProductContext handles initial data fetch on mount.
// No module-level auto-preload is needed — it would duplicate ProductContext's work.

export default dataPreloader;
