import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, CartContextType, Product, ApiResponse } from '../types';
import { apiClient } from '../lib/apiClient';
import { transformProduct, transformKeysToCamel } from '../lib/dataTransform';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  const loadGuestCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setGuestCart(parsedCart);
        return parsedCart;
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
    }
    return [];
  }, []);

  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
      setGuestCart(cartItems);
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await apiClient.get<ApiResponse<any[]>>('/dashboard/cart');
        const data = res.data || [];
        const transformedItems = data.map((item: any) => ({
          ...transformKeysToCamel<any>(item),
          product: transformProduct(item.product || item.products)
        })) as CartItem[];
        setItems(transformedItems);
      } else {
        const guestItems = loadGuestCart();
        setItems(guestItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (!user) setItems(loadGuestCart());
    } finally {
      setLoading(false);
    }
  }, [user, loadGuestCart]);

  const mergeGuestCartWithUserCart = useCallback(async () => {
    if (user && guestCart.length > 0) {
      try {
        for (const item of guestCart) {
          await apiClient.post('/dashboard/cart', { 
            productId: item.product.id, 
            quantity: item.quantity,
            variantId: item.variantId
          });
        }
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        await fetchCart();
      } catch (error) {
        console.error('Error merging cart:', error);
      }
    }
  }, [user, guestCart, fetchCart]);

  useEffect(() => {
    if (user) {
      mergeGuestCartWithUserCart();
    } else {
      loadGuestCart();
    }
  }, [user, loadGuestCart, mergeGuestCartWithUserCart]);

  useEffect(() => {
    fetchCart();
  }, [user, fetchCart]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    try {
      if (user) {
        const existingItem = items.find(
          item => item.product.id === product.id && item.variantId === variantId
        );
        
        if (existingItem && existingItem.id) {
          await apiClient.patch(`/dashboard/cart/${existingItem.id}`, { 
            quantity: existingItem.quantity + quantity 
          });
        } else {
          await apiClient.post('/dashboard/cart', { 
            productId: product.id, 
            quantity,
            variantId
          });
        }
        await fetchCart();
      } else {
        const existingItemIndex = guestCart.findIndex(
          item => item.product.id === product.id && item.variantId === variantId
        );

        let updatedCart: CartItem[];
        if (existingItemIndex >= 0) {
          updatedCart = guestCart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: `guest-${Date.now()}`,
            product,
            productId: product.id,
            quantity,
            variantId,
          };
          updatedCart = [...guestCart, newItem];
        }

        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
      showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} added to cart.` });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add to cart' });
    }
  }, [user, guestCart, items, fetchCart, saveGuestCart, showNotification]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        await apiClient.patch(`/dashboard/cart/${itemId}`, { quantity });
        await fetchCart();
      } else {
        const updatedCart = guestCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to update quantity' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('guest-')) {
        await apiClient.delete(`/dashboard/cart/${itemId}`);
        await fetchCart();
      } else {
        const updatedCart = guestCart.filter(item => item.id !== itemId);
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from cart.' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove from cart' });
    }
  }, [user, guestCart, fetchCart, saveGuestCart, showNotification]);

  const clearCart = useCallback(async () => {
    try {
      if (user) {
        await apiClient.delete('/dashboard/cart');
      }
      localStorage.removeItem('guestCart');
      setItems([]);
      setGuestCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart' });
    }
  }, [user, showNotification]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    loading,
    total: subtotal,
    itemCount,
    addItem: addToCart,
    updateQuantity: async (productId: string, quantity: number, variantId?: string) => {
      const itemToUpdate = items.find(item =>
        item.product.id === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
      );
      if (itemToUpdate && itemToUpdate.id) {
        await updateQuantity(itemToUpdate.id, quantity);
      }
    },
    removeItem: async (productId: string, variantId?: string) => {
      const itemToRemove = items.find(item =>
        item.product.id === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
      );
      if (itemToRemove && itemToRemove.id) {
        await removeFromCart(itemToRemove.id);
      }
    },
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
