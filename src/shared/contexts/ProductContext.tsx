import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Product, ProductContextType, Category, Review } from '../types';
import { useNotification } from './NotificationContext';

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

const CACHE_TTL = 5 * 60 * 1000;

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

const MOCK_PRODUCTS: any[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `generic-${i + 1}`,
  name: `Premium Product ${i + 1}`,
  price: 1999 + i * 500,
  original_price: 2499 + i * 600,
  description: 'High quality premium product placeholder for template display.',
  category_id: `default-${(i % 3) + 1}`,
  images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80']
}));

function bumpCacheVersion() {
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
  const { showError } = useNotification();

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
      categoryId: dbProduct.category_id,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      stock: dbProduct.stock ?? 100,
      minStockLevel: dbProduct.min_stock_level || 5,
      sku: dbProduct.sku || `SKU-${dbProduct.id?.slice(0, 6)}`,
      weight: dbProduct.weight,
      dimensions: dbProduct.dimensions,
      rating: parseFloat(dbProduct.rating) || 5.0,
      reviewCount: dbProduct.review_count || 12,
      reviews: [],
      sellerId: dbProduct.seller_id,
      sellerName: dbProduct.seller_name || 'Verified Merchant',
      tags: dbProduct.tags || [],
      specifications: dbProduct.specifications || {},
      featured: dbProduct.is_featured || false,
      showOnHomepage: dbProduct.show_on_homepage || true,
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
    productCount: dbCategory.product_count || 1,
    createdAt: dbCategory.created_at ? new Date(dbCategory.created_at) : undefined,
    updatedAt: dbCategory.updated_at ? new Date(dbCategory.updated_at) : undefined,
  }), []);

  const fetchCategories = useCallback(async (background = false, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Category[]>(keys.categories);
    if (cached) setCategories(cached);
    if (cached && background && !force) return;

    try {
      const res = await (Promise.reject(new Error("Mock fallback")) as any);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(mapDbCategoryToAppCategory);
        setCategories(mapped);
        cacheSet(keys.categories, mapped);
      }
    } catch (error) {
      if (!cached) {
        setCategories([
          { id: '1', name: 'Category 1', slug: 'category-1', productCount: 4, sortOrder: 1, isActive: true, imageUrl: '' },
          { id: '2', name: 'Category 2', slug: 'category-2', productCount: 2, sortOrder: 2, isActive: true, imageUrl: '' },
          { id: '3', name: 'Category 3', slug: 'category-3', productCount: 3, sortOrder: 3, isActive: true, imageUrl: '' },
        ]);
      }
    }
  }, [mapDbCategoryToAppCategory]);

  const fetchProducts = useCallback(async (page: number = 1, limit: number = 20, filters?: any, force = false) => {
    const filterKey = JSON.stringify(filters || {});
    const keys = getCacheKeys();
    const cacheKey = keys.products(page, filterKey);

    const isDefault = page === 1 && (!filters || Object.keys(filters).length === 0);
    const cached = isDefault ? cacheGet<{ products: Product[]; pagination: PaginationState }>(cacheKey) : null;

    if (cached) {
      setProducts(cached.products);
      setPagination(cached.pagination);
    }

    if (force || !cached) {
      if (!cached) setLoading(true);
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(mapDbProductToAppProduct);
          setProducts(mapped);
          const pag = { page, limit, total: mapped.length, pages: 1 };
          setPagination(pag);
          if (isDefault) cacheSet(cacheKey, { products: mapped, pagination: pag });
        }
      } catch (error) {
        if (!cached) {
          const fallback = MOCK_PRODUCTS.map(mapDbProductToAppProduct);
          setProducts(fallback);
        }
      } finally {
        if (!cached) setLoading(false);
      }
    }
  }, [mapDbProductToAppProduct]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.featured);
    if (cached) { setFeaturedProducts(cached); setFeaturedLoading(false); }

    if (force || !cached) {
      if (!cached) setFeaturedLoading(true);
      try {
        const res = await fetch('/api/products?featured=true');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(mapDbProductToAppProduct).slice(0, limit);
          if(mapped.length > 0) {
            setFeaturedProducts(mapped);
            cacheSet(keys.featured, mapped);
            return;
          }
        }
        throw new Error("No products");
      } catch {
        if (!cached) {
          setFeaturedProducts(MOCK_PRODUCTS.map(mapDbProductToAppProduct).slice(0, limit));
        }
      } finally {
        if (!cached) setFeaturedLoading(false);
      }
    }
  }, [mapDbProductToAppProduct]);

  const fetchBestSellers = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.bestSellers);
    if (cached) { setBestSellers(cached); setBestSellersLoading(false); }

    if (force || !cached) {
      if (!cached) setBestSellersLoading(true);
      try {
        const res = await fetch('/api/products?bestsellers=true');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(mapDbProductToAppProduct).slice(0, limit);
          if(mapped.length > 0) {
            setBestSellers(mapped);
            cacheSet(keys.bestSellers, mapped);
            return;
          }
        }
        throw new Error("No products");
      } catch {
        if (!cached) {
          setBestSellers(MOCK_PRODUCTS.map(mapDbProductToAppProduct).slice(0, limit).reverse());
        }
      } finally {
        if (!cached) setBestSellersLoading(false);
      }
    }
  }, [mapDbProductToAppProduct]);

  const fetchLatestProducts = useCallback(async (limit: number = 8, force = false) => {
    const keys = getCacheKeys();
    const cached = cacheGet<Product[]>(keys.latest);
    if (cached) { setLatestProducts(cached); setLatestLoading(false); }

    if (force || !cached) {
      if (!cached) setLatestLoading(true);
      try {
        const res = await fetch('/api/products?latest=true');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(mapDbProductToAppProduct).slice(0, limit);
          if(mapped.length > 0) {
            setLatestProducts(mapped);
            cacheSet(keys.latest, mapped);
            return;
          }
        }
        throw new Error("No products");
      } catch {
        if (!cached) {
          setLatestProducts(MOCK_PRODUCTS.map(mapDbProductToAppProduct).slice(1, limit + 1));
        }
      } finally {
        if (!cached) setLatestLoading(false);
      }
    }
  }, [mapDbProductToAppProduct]);

  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    const local = products.find(p => p.id === id);
    if (local) return local;

    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        return mapDbProductToAppProduct(data);
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
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date(),
    } as any;
  }, []);

  const getProductReviews = useCallback(async (productId: string): Promise<Review[]> => {
    return [];
  }, []);

  const getProductRatingStats = useCallback(async (productId: string) => {
    return { averageRating: 5.0, totalReviews: 12, ratingBreakdown: { 5: 12, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }, []);

  useEffect(() => {
    if (!initFetched.current) {
      initFetched.current = true;
      // Only fetch store data when we are on a store subdomain, not the platform root domain.
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      const baseDomain = import.meta.env.VITE_SITE_URL
        ? new URL(import.meta.env.VITE_SITE_URL).hostname
        : 'get-oru.com';
      const isStorefront = host !== baseDomain && host !== 'localhost' && host !== '127.0.0.1';
      if (!isStorefront) return; // On platform home — nothing to fetch

      fetchCategories(true);
      fetchProducts(1, 20);
      fetchFeaturedProducts();
      fetchBestSellers();
      fetchLatestProducts();
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
        getProductReviews,
        getProductRatingStats,
      } as any)}
    >
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;
