import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Category, ProductContextType, ApiResponse } from '../types';
import { apiClient } from '../lib/apiClient';
import { transformProduct, transformKeysToCamel } from '../lib/dataTransform';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [bestSellersLoading, setBestSellersLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = user ? '/dashboard/products' : '/shop/products';
      const res = await apiClient.get<ApiResponse<Product[]>>(endpoint);
      const data = res.data || [];
      const transformedProducts = data.map(transformProduct) as unknown as Product[];
      setProducts(transformedProducts);
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to fetch products' });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  const fetchCategories = useCallback(async () => {
    try {
      const endpoint = user ? '/dashboard/categories' : '/shop/categories';
      const res = await apiClient.get<ApiResponse<Category[]>>(endpoint);
      const data = res.data || [];
      setCategories(transformKeysToCamel<Category[]>(data));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const getProductById = useCallback(async (id: string) => {
    try {
      const endpoint = user ? `/dashboard/products/${id}` : `/shop/products/${id}`;
      const res = await apiClient.get<ApiResponse<Product>>(endpoint);
      return res.data ? (transformProduct(res.data) as unknown as Product) : null;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      return null;
    }
  }, [user]);

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const res = await apiClient.post<ApiResponse<Product>>('/dashboard/products', productData);
      await fetchProducts();
      showNotification({ type: 'success', title: 'Product Created', message: 'Product added successfully' });
      return transformProduct(res.data);
    } catch (err: any) {
      showNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to create product' });
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const res = await apiClient.put<ApiResponse<Product>>(`/dashboard/products/${id}`, productData);
      await fetchProducts();
      showNotification({ type: 'success', title: 'Product Updated', message: 'Product updated successfully' });
      return transformProduct(res.data);
    } catch (err: any) {
      showNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to update product' });
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiClient.delete(`/dashboard/products/${id}`);
      await fetchProducts();
      showNotification({ type: 'info', title: 'Product Deleted', message: 'Product removed' });
    } catch (err: any) {
      showNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to delete product' });
      throw err;
    }
  };

  const fetchFeaturedProducts = useCallback(async (limit = 8) => {
    setFeaturedLoading(true);
    try {
      const endpoint = user ? `/dashboard/products?featured=true&limit=${limit}` : `/shop/products?featured=true&limit=${limit}`;
      const res = await apiClient.get<ApiResponse<Product[]>>(endpoint);
      setFeaturedProducts((res.data || []).map(transformProduct) as unknown as Product[]);
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setFeaturedLoading(false);
    }
  }, [user]);

  const fetchBestSellers = useCallback(async (limit = 8) => {
    setBestSellersLoading(true);
    try {
      const endpoint = user ? `/dashboard/products?sort=best_sellers&limit=${limit}` : `/shop/products?sort=best_sellers&limit=${limit}`;
      const res = await apiClient.get<ApiResponse<Product[]>>(endpoint);
      setBestSellers((res.data || []).map(transformProduct) as unknown as Product[]);
    } catch (err) {
      console.error('Error fetching best sellers:', err);
    } finally {
      setBestSellersLoading(false);
    }
  }, [user]);

  const fetchLatestProducts = useCallback(async (limit = 8) => {
    setLatestLoading(true);
    try {
      const endpoint = user ? `/dashboard/products?sort=latest&limit=${limit}` : `/shop/products?sort=latest&limit=${limit}`;
      const res = await apiClient.get<ApiResponse<Product[]>>(endpoint);
      setLatestProducts((res.data || []).map(transformProduct) as unknown as Product[]);
    } catch (err) {
      console.error('Error fetching latest products:', err);
    } finally {
      setLatestLoading(false);
    }
  }, [user]);

  const fetchReviewsForProduct = useCallback(async (productId: string): Promise<import('../types').Review[]> => {
    try {
      const res = await apiClient.get<ApiResponse<import('../types').Review[]>>(`/shop/products/${productId}/reviews`);
      return res.data || [];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return [];
    }
  }, []);

  const value: ProductContextType = {
    products,
    featuredProducts,
    bestSellers,
    latestProducts,
    categories,
    loading,
    featuredLoading,
    bestSellersLoading,
    latestLoading,
    fetchProducts,
    fetchCategories,
    fetchFeaturedProducts,
    fetchBestSellers,
    fetchLatestProducts,
    fetchReviewsForProduct,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    pagination: { page: 1, limit: 10, total: products.length, pages: 1 }
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};
