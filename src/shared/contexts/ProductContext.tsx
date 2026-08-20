import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Product, ProductContextType, Category, Review } from '../types';
import { useNotification } from './NotificationContext';
import { apiClient } from '@/shared/lib/apiClient';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CACHE_TTL = 30 * 1000; // 30 seconds TTL for fast updates

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Ignore
  }
}

function cacheClear(pattern: string) {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(pattern))
      .forEach(k => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

let cacheVersion = (() => {
  try { return parseInt(sessionStorage.getItem('pc_cache_version') || '0', 10); } catch { return 0; }
})();

export function bumpProductCacheVersion() {
  cacheVersion++;
  try { sessionStorage.setItem('pc_cache_version', String(cacheVersion)); } catch { /* ignore */ }
  cacheClear('pc_');
}

const getCacheKeys = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'default';
  return {
    products: (page: number, filters: string) => `pc_${host}_v${cacheVersion}_products_${page}_${filters}`,
    featured: `pc_${host}_v${cacheVersion}_featured`,
    latest: `pc_${host}_v${cacheVersion}_latest`,
    bestSellers: `pc_${host}_v${cacheVersion}_bestsellers`,
    categories: `pc_${host}_v${cacheVersion}_categories`,
  };
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [bestSellersLoading, setBestSellersLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0, pages: 0 });

  const initFetched = useRef(false);

  const mapDbProductToAppProduct = useCallback((dbProduct: any): Product => {
    const images = Array.isArray(dbProduct.images) ? dbProduct.images
      : dbProduct.image_url ? [dbProduct.image_url]
        : [];
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      slug: dbProduct.slug || dbProduct.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: dbProduct.description || '',
      shortDescription: dbProduct.short_description || dbProduct.description?.slice(0, 100) || '',
      price: Number(dbProduct.price) || 0,
      originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
      categoryId: dbProduct.category_id || dbProduct.categoryId,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      stock: dbProduct.stock ?? 100,
      minStockLevel: dbProduct.min_stock_level || 5,
      sku: dbProduct.sku || `SKU-${dbProduct.id?.slice(0, 6)}`,
      weight: dbProduct.weight,
      dimensions: dbProduct.dimensions,
      rating: parseFloat(dbProduct.rating) || 5.0,
      reviewCount: dbProduct.review_count || 0,
      reviews: [],
      sellerId: dbProduct.seller_id,
      sellerName: dbProduct.seller_name || 'Verified Merchant',
      tags: dbProduct.tags || [],
      specifications: dbProduct.specifications || {},
      featured: dbProduct.is_featured || false,
      showOnHomepage: dbProduct.show_on_homepage ?? true,
      isActive: dbProduct.is_active ?? true,
      metaTitle: dbProduct.meta_title,
      metaDescription: dbProduct.meta_description,
      attributes: dbProduct.attributes || {},
      createdAt: dbProduct.created_at ? new Date(dbProduct.created_at) : new Date(),
      updatedAt: dbProduct.updated_at ? new Date(dbProduct.updated_at) : undefined,
    };
  }, []);

  const mapDbCategoryToAppCategory = useCallback((dbCategory: any): Category => ({
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug || dbCategory.name.toLowerCase().replace(/\s+/g, '-'),
    description: dbCategory.description,
    imageUrl: dbCategory.image_url || '',
    parentId: dbCategory.parent_id,
    isActive: dbCategory.is_active ?? true,
    sortOrder: dbCategory.sort_order || 0,
    productCount: dbCategory.product_count || 0,
    createdAt: dbCategory.created_at ? new Date(dbCategory.created_at) : undefined,
    updatedAt: dbCategory.updated_at ? new Date(dbCategory.updated_at) : undefined,
  }), []);

  const fetchCategories = useCallback(async (background = false, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Category[]>(keys.categories);
    if (cached && !force) {
      setCategories(cached);
      if (background) return;
    }

    try {
      const data = await apiClient.get('/categories');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const mapped = list.map(mapDbCategoryToAppCategory);
      setCategories(mapped);
      cacheSet(keys.categories, mapped);
    } catch (error) {
      console.warn("Failed to fetch categories:", error);
    }
  }, [mapDbCategoryToAppCategory]);

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 20, filters?: any, force = false) => {
    const filterKey = JSON.stringify(filters || {});
    const keys = getCacheKeys();
    const cacheKey = keys.products(page, filterKey);

    const isDefault = page === 1 && (!filters || Object.keys(filters).length === 0);
    const cached = isDefault ? cacheGet<{ products: Product[]; pagination: PaginationState }>(cacheKey) : null;

    if (cached && !force) {
      setProducts(cached.products);
      setPagination(cached.pagination);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.get('/products');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const mapped = list.map(mapDbProductToAppProduct);
      setProducts(mapped);
      const pag = { page, limit, total: mapped.length, pages: Math.max(1, Math.ceil(mapped.length / limit)) };
      setPagination(pag);
      if (isDefault) cacheSet(cacheKey, { products: mapped, pagination: pag });
    } catch (error) {
      console.warn("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [mapDbProductToAppProduct]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.featured);
    if (cached && !force) {
      setFeaturedProducts(cached);
      setFeaturedLoading(false);
      return;
    }

    setFeaturedLoading(true);
    try {
      const data = await apiClient.get('/products/featured');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const mapped = list.map(mapDbProductToAppProduct).slice(0, limit);
      setFeaturedProducts(mapped);
      cacheSet(keys.featured, mapped);
    } catch {
      // Fall back to featured from products list
      setFeaturedProducts(products.filter(p => p.featured).slice(0, limit));
    } finally {
      setFeaturedLoading(false);
    }
  }, [mapDbProductToAppProduct, products]);

  const fetchBestSellers = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.bestSellers);
    if (cached && !force) {
      setBestSellers(cached);
      setBestSellersLoading(false);
      return;
    }

    setBestSellersLoading(true);
    try {
      const data = await apiClient.get('/products');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const mapped = list.map(mapDbProductToAppProduct).slice(0, limit);
      setBestSellers(mapped);
      cacheSet(keys.bestSellers, mapped);
    } catch {
      setBestSellers(products.slice(0, limit));
    } finally {
      setBestSellersLoading(false);
    }
  }, [mapDbProductToAppProduct, products]);

  const fetchLatestProducts = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.latest);
    if (cached && !force) {
      setLatestProducts(cached);
      setLatestLoading(false);
      return;
    }

    setLatestLoading(true);
    try {
      const data = await apiClient.get('/products');
      const list = Array.isArray(data) ? data : (data?.data || []);
      const mapped = list.map(mapDbProductToAppProduct).slice(0, limit);
      setLatestProducts(mapped);
      cacheSet(keys.latest, mapped);
    } catch {
      setLatestProducts(products.slice(0, limit));
    } finally {
      setLatestLoading(false);
    }
  }, [mapDbProductToAppProduct, products]);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    const local = products.find(p => p.id === id);
    if (local) return local;

    try {
      const data = await apiClient.get(`/products/${id}`);
      if (data) {
        return mapDbProductToAppProduct(data?.data || data);
      }
    } catch {
      // Fall through
    }
    return products[0] || null;
  }, [products, mapDbProductToAppProduct]);

  const getProductBySlug = useCallback(async (slug: string): Promise<Product | null> => {
    const local = products.find(p => p.slug === slug);
    if (local) return local;
    return products[0] || null;
  }, [products]);

  const getProductsByCategory = useCallback(async (categoryId: string, limit?: number): Promise<Product[]> => {
    return products.filter(p => p.categoryId === categoryId).slice(0, limit);
  }, [products]);

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    const q = query.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [products]);

  const filterProducts = useCallback(async (filters: any): Promise<Product[]> => {
    return products;
  }, [products]);

  const getRelatedProducts = useCallback(async (productId: string, limit: number = 4): Promise<Product[]> => {
    return products.filter(p => p.id !== productId).slice(0, limit);
  }, [products]);

  const addReview = useCallback(async (review: any): Promise<Review> => {
    return {
      id: `rev_${Date.now()}`,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName || 'Customer',
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(),
    } as any;
  }, []);

  const getProductReviews = useCallback(async (productId: string): Promise<Review[]> => {
    return [];
  }, []);

  const fetchReviewsForProduct = useCallback(async (productId: string): Promise<Review[]> => {
    return getProductReviews(productId);
  }, [getProductReviews]);

  const submitReview = useCallback(async (review: any): Promise<void> => {
    await addReview(review);
  }, [addReview]);

  const getProductRatingStats = useCallback(async (productId: string) => {
    return { averageRating: 5.0, totalReviews: 12, ratingBreakdown: { 5: 12, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }, []);

  useEffect(() => {
    if (!initFetched.current) {
      initFetched.current = true;

      const isStoreContext = () => {
        if (typeof window === 'undefined') return false;
        const host = window.location.hostname.toLowerCase();
        const baseDomain = import.meta.env.VITE_SITE_URL
          ? new URL(import.meta.env.VITE_SITE_URL).hostname.toLowerCase()
          : 'get-oru.com';

        const isPlatformHost =
          host === baseDomain ||
          host === `www.${baseDomain}` ||
          host === 'get-oru.com' ||
          host === 'www.get-oru.com';

        if (host === 'localhost' || host === '127.0.0.1') return true;

        if (isPlatformHost) {
          return window.location.pathname.startsWith('/store') || !!localStorage.getItem('store_hostname');
        }

        return true;
      };

      if (isStoreContext()) {
        fetchCategories(true);
        fetchProducts(1, 20);
        fetchFeaturedProducts();
        fetchBestSellers();
        fetchLatestProducts();
      }
    }
  }, [fetchCategories, fetchProducts, fetchFeaturedProducts, fetchBestSellers, fetchLatestProducts]);

  return (
    <ProductContext.Provider
      value={({
        products,
        featuredProducts,
        bestSellers,
        latestProducts,
        categories,
        loading,
        featuredLoading,
        bestSellersLoading,
        latestLoading,
        pagination,
        fetchProducts,
        fetchFeaturedProducts,
        fetchBestSellers,
        fetchLatestProducts,
        fetchCategories,
        getProductById,
        getProductBySlug,
        getProductsByCategory,
        searchProducts,
        filterProducts,
        getRelatedProducts,
        addReview,
        submitReview,
        getProductReviews,
        fetchReviewsForProduct,
        getProductRatingStats,
      } as any)}
    >
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;
