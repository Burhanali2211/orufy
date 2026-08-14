import { useState, useCallback, useEffect } from 'react';
import { CartItem, Product } from '../../types';
import { db } from '../../lib/legacyDb';
import { mapDbCartItemToAppCartItem } from '../../utils/shoppingMapper';

export const useShoppingCart = (user: any, showNotification: any) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGuestCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setGuestCart(parsedCart);
        return parsedCart;
      }
    } catch (error) { console.error('Error loading guest cart:', error); }
    return [];
  }, []);

  const saveGuestCart = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(items));
      setGuestCart(items);
    } catch (error) { console.error('Error saving guest cart:', error); }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      if (user) {
        const data = await db.getCart(user.id);
        setCartItems(data ? data.map(mapDbCartItemToAppCartItem) : []);
      } else {
        setCartItems(loadGuestCart());
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to load cart' });
    }
  }, [user, loadGuestCart, showNotification]);

  const mergeGuestCartWithUserCart = useCallback(async () => {
    if (user && guestCart.length > 0) {
      try {
        for (const item of guestCart) {
          await db.addToCart(user.id, item.product.id, item.quantity);
        }
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        await fetchCart();
      } catch (error) { console.error('Error merging cart:', error); }
    }
  }, [user, guestCart, fetchCart]);

  useEffect(() => {
    if (user) mergeGuestCartWithUserCart();
    else loadGuestCart();
  }, [user, mergeGuestCartWithUserCart, loadGuestCart]);

  useEffect(() => {
    fetchCart();
  }, [user, fetchCart]);

  const addItem = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    if (!user) {
      showNotification({ type: 'info', title: '', message: 'Please log in to continue' });
      return;
    }
    try {
      const existingItem = cartItems.find(item => item.product.id === product.id && item.variantId === variantId);
      if (existingItem && existingItem.id) await db.updateCartItem(existingItem.id, existingItem.quantity + quantity);
      else await db.addToCart(user.id, product.id, quantity);
      await fetchCart();
      showNotification({ type: 'success', title: '', message: 'Item added to cart' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add to cart' });
    }
  }, [user, cartItems, fetchCart, showNotification]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        await db.updateCartItem(itemId, quantity);
        await fetchCart();
      } else {
        const updatedCart = guestCart.map(item => item.id === itemId ? { ...item, quantity } : item);
        saveGuestCart(updatedCart);
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to update quantity' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        await db.removeFromCart(itemId);
        await fetchCart();
      } else {
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setCartItems(updatedCart);
      }
      showNotification({ type: 'info', title: '', message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove from cart' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const clearCart = useCallback(async () => {
    try {
      if (user) await db.clearCart(user.id);
      localStorage.removeItem('guestCart');
      setCartItems([]);
      setGuestCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart' });
    }
  }, [user, showNotification]);

  const subtotal = cartItems.reduce((sum, item) => sum + ((item.product.price || 0) * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartItems,
    loading,
    total: subtotal,
    itemCount,
    addItem,
    updateQuantity,
    removeItem: async (productId: string, variantId?: string) => {
      const item = cartItems.find(i => i.product.id === productId && i.variantId === variantId);
      if (item?.id) await removeFromCart(item.id);
    },
    removeFromCart,
    clearCart,
    updateItemQuantity: async (productId: string, quantity: number, variantId?: string) => {
      const item = cartItems.find(i => i.product.id === productId && i.variantId === variantId);
      if (item?.id) await updateQuantity(item.id, quantity);
    }
  };
};
