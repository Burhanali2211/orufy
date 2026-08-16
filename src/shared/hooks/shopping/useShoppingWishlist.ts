import { apiClient } from '@/shared/lib/apiClient';
import { useState, useCallback, useEffect } from 'react';
import { WishlistItem, Product } from '../../types';
import { transformProduct } from '../../lib/dataTransform';

export const useShoppingWishlist = (user: any, showNotification: any) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isInWishlist = useCallback((productId: string) => 
    wishlistItems.some(item => item.product.id === productId), [wishlistItems]);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlistItems([]); return; }
    try {
      const data = await apiClient.get('/wishlist');
      
      setWishlistItems((data || []).map((item: any) => ({
        id: item.id,
        product: transformProduct(item.products),
        productId: item.product_id,
        createdAt: new Date(item.created_at)
      })));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to fetch wishlist items.' });
    }
  }, [user, showNotification]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const addToWishlist = async (product: Product) => {
    if (!user) {
      showNotification({ type: 'info', title: '', message: 'Please log in to continue' });
      return;
    }
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      try {
        await apiClient.post('/wishlist', { productId: product.id });
        await fetchWishlist();
        showNotification({ type: 'success', title: '', message: 'Item added to wishlist' });
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist.' });
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      await fetchWishlist();
      showNotification({ type: 'info', title: '', message: 'Item removed from wishlist' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item.' });
    }
  };

  const clearWishlist = async () => {
    if (!user) return;
    try {
      // Assuming batch delete or clear endpoint exists, otherwise fallback to iterating
      await apiClient.delete('/wishlist');
      setWishlistItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear wishlist.' });
    }
  };

  return {
    wishedItems: wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    loading
  };
};
