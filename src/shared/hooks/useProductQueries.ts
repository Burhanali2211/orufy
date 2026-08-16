import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
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
      const data = await apiClient.get('/admin/products/stats');
      return {
        active: data?.activeCount ?? 0,
        lowStock: data?.lowStockCount ?? 0,
        outOfStock: data?.outOfStockCount ?? 0,
      };
    },
    staleTime: 30 * 1000,
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
      return await apiClient.get(`/products/${productId}/reviews`) || [];
    },
    enabled: !!productId,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: { productId: string; rating: number; title?: string; comment: string }) =>
      apiClient.post(`/products/${review.productId}/reviews`, review),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.reviews(variables.productId) });
    },
  });
};

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) =>
      apiClient.post('/products', product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Product) => apiClient.put(`/products/${product.id}`, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

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
      return (data?.data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBestSellers = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.bestSellers(),
    queryFn: async () => {
      const data: any = await api.products.list({ limit, sortBy: 'popular' });
      return (data?.data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLatestProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.latest(),
    queryFn: async () => {
      const data: any = await api.products.list({ limit, sortBy: 'newest' });
      return (data?.data || []).map(transformProduct);
    },
    staleTime: 60 * 1000,
  });
};

export const useTrendingProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.trending(),
    queryFn: async () => {
      const data: any = await api.products.list({ limit, sortBy: 'popular' });
      return (data?.data || []).map(transformProduct);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDiscountedProducts = (limit = 8) => {
  return useQuery({
    queryKey: productKeys.list({ isSale: true, limit }),
    queryFn: async () => {
      const data: any = await api.products.list({ isSale: true, limit });
      return (data?.data || []).map(transformProduct);
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
    mutationFn: (data: any) => apiClient.post('/products', data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/products/${data.id}`, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: invalidate,
  });

  return {
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};
