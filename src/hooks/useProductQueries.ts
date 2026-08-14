import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '../lib/legacyDb';
import * as optimized from '../lib/optimized-queries';
import { productApi } from '../lib/apiClient';
import { transformProduct, transformCategory } from '../lib/dataTransform';
import { Product, Category, Review } from '../types';

// Keys for query caching
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: any) => [...productKeys.lists(), { filters }] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  bestSellers: () => [...productKeys.all, 'best-sellers'] as const,
  latest: () => [...productKeys.all, 'latest'] as const,
  trending: () => [...productKeys.all, 'trending'] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  reviews: (id: string) => [...productKeys.all, 'reviews', id] as const,
  categories: ['categories'] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
};

export const useProductStatsQuery = () => {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: async () => {
      const [{ count: active }, { count: lowStock }, { count: outOfStock }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('stock', 0).lt('stock', 10),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0),
      ]);
      return { 
        active: active ?? 0, 
        lowStock: lowStock ?? 0, 
        outOfStock: outOfStock ?? 0 
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// -- Granular Product Hooks --

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: productKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const product = await api.products.get(id);
      return product ? transformProduct(product) : null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductReviews = (productId: string | undefined) => {
  return useQuery({
    queryKey: productKeys.reviews(productId || ''),
    queryFn: async () => {
      if (!productId) return [];
      return await db.getReviews(productId) || [];
    },
    enabled: !!productId,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: { productId: string; userId: string; rating: number; title?: string; comment: string }) => 
      db.submitReview(review),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.reviews(variables.productId) });
    },
  });
};

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => db.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Product) => db.updateProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: async () => {
      const data = await api.categories.list();
      return (data || []).map(transformCategory);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// -- Collection Hooks --

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'rating';
  isSale?: boolean;
  isActive?: boolean;
}

export const useProductsQuery = (page = 1, limit = 20, filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: productKeys.list({ page, limit, ...filters }),
    queryFn: async () => {
      const response = await api.products.list({ 
        page, 
        limit, 
        categoryId: filters.categoryId,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        sortBy: filters.sortBy,
        isSale: filters.isSale,
        isActive: filters.isActive
      });
      return {
        products: (response?.data || []).map(transformProduct),
        pagination: response?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      };
    },
    staleTime: 30 * 1000,
  });
};

export const useFeaturedProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      const data = await api.products.featured(limit);
      return (data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBestSellers = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.bestSellers(),
    queryFn: async () => {
      // Use optimized query for better performance
      const data = await optimized.getPopularProducts(limit);
      return (data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLatestProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.latest(),
    queryFn: async () => {
      const { data } = await api.products.list({ limit, sortBy: 'newest' });
      return (data || []).map(transformProduct);
    },
    staleTime: 60 * 1000,
  });
};

export const useTrendingProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.trending(),
    queryFn: async () => {
      // Use popular products as a 100x faster base for trending
      const data = await optimized.getPopularProducts(limit);
      return (data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDiscountedProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.list({ isSale: true, limit }),
    queryFn: async () => {
      const { data } = await api.products.list({ isSale: true, limit });
      return (data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Admin Mutations
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: productKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => productApi.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => productApi.update(data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};
