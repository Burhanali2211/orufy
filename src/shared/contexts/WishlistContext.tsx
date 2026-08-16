import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, WishlistItem, WishlistContextType } from '../types';
import { apiClient } from '../lib/apiClient';
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
      // TODO: Connect to local postgres API
      // setItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

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
        // TODO: Connect to local postgres API
        const newItem: WishlistItem = {
          id: Math.random().toString(),
          productId: product.id,
          product: product,
          createdAt: new Date()
        };
        setItems(prev => [...prev, newItem]);
        showNotification({ type: 'success', title: 'Added to Wishlist', message: `${product.name} added to your wishlist.` });
      } catch (error: any) {
        console.error('Error adding to wishlist:', error);
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      // TODO: Connect to local postgres API
      setItems(prev => prev.filter(item => item.product.id !== productId));
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from your wishlist.' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => items.some(item => item.product.id === productId);

  const clearWishlist = async () => {
    if (!user) return;

    try {
      // TODO: Connect to local postgres API
      setItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
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
