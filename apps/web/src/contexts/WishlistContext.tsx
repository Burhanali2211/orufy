import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, WishlistItem, WishlistContextType, ApiResponse } from '../types';
import { apiClient } from '../lib/apiClient';
import { transformProduct } from '../lib/dataTransform';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/dashboard/wishlist').catch(() => ({ success: true, data: [] }));
      const data = res.data || [];
      
      const wishlistItems = data.map((item: any) => ({
        id: item.id,
        product: transformProduct(item.product || item.products),
        productId: item.productId || item.product_id,
        createdAt: item.createdAt || item.created_at
      })) as WishlistItem[];
      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId: string) => items.some(item => (item.product?.id || item.productId) === productId);

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      await apiClient.delete(`/dashboard/wishlist/${productId}`);
      await fetchWishlist();
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from your wishlist.' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item.' });
    }
  };

  const addItem = async (product: Product) => {
    if (!user) {
      showNotification({
        type: 'info',
        title: 'Authentication Required',
        message: 'Please log in to add items to your wishlist.'
      });
      return;
    }

    const alreadyInWishlist = isInWishlist(product.id);

    if (alreadyInWishlist) {
      await removeItem(product.id);
    } else {
      try {
        await apiClient.post('/dashboard/wishlist', { productId: product.id });
        await fetchWishlist();
        showNotification({ type: 'success', title: 'Added to Wishlist', message: `${product.name} added to your wishlist.` });
      } catch (error: any) {
        console.error('Error adding to wishlist:', error);
        showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist.' });
      }
    }
  };

  const clearWishlist = async () => {
    if (!user) return;

    try {
      await apiClient.delete('/dashboard/wishlist');
      setItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear wishlist.' });
    }
  };

  const value: WishlistContextType = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
    loading
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
