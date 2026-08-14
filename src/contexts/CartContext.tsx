import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

const getCartStorageKey = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'default';
  return `guest_cart_${hostname}`;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCartFromStorage = useCallback((): CartItem[] => {
    try {
      const storageKey = getCartStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
    return [];
  }, []);

  const saveCartToStorage = useCallback((cartItems: CartItem[]) => {
    try {
      const storageKey = getCartStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const stored = loadCartFromStorage();
    setItems(stored);
    setLoading(false);
  }, [loadCartFromStorage]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1, variantId?: string) => {
    try {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (it) => it.product.id === product.id && it.variantId === variantId
        );

        let nextItems: CartItem[];
        if (existingIndex >= 0) {
          nextItems = prev.map((it, idx) =>
            idx === existingIndex ? { ...it, quantity: it.quantity + quantity } : it
          );
        } else {
          const newItem: CartItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            product,
            productId: product.id,
            quantity,
            variantId,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
            createdAt: new Date(),
          };
          nextItems = [...prev, newItem];
        }

        saveCartToStorage(nextItems);
        return nextItems;
      });

      showNotification({
        type: 'success',
        title: 'Added to Bag',
        message: `${product.name} has been added to your shopping bag.`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to bag.' });
    }
  }, [saveCartToStorage, showNotification]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }

      setItems((prev) => {
        const nextItems = prev.map((it) =>
          it.id === itemId || it.product.id === itemId ? { ...it, quantity } : it
        );
        saveCartToStorage(nextItems);
        return nextItems;
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }, [saveCartToStorage]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setItems((prev) => {
        const nextItems = prev.filter((it) => it.id !== itemId && it.product.id !== itemId);
        saveCartToStorage(nextItems);
        return nextItems;
      });
      showNotification({ type: 'info', title: 'Removed', message: 'Item removed from bag.' });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }, [saveCartToStorage, showNotification]);

  const clearCart = useCallback(async () => {
    try {
      const storageKey = getCartStorageKey();
      localStorage.removeItem(storageKey);
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback(
    async (product: Product, quantity: number = 1, variantId?: string) => {
      await addToCart(product, quantity, variantId);
    },
    [addToCart]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      await removeFromCart(productId);
    },
    [removeFromCart]
  );

  const updateItemQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      await updateQuantity(productId, quantity);
    },
    [updateQuantity]
  );

  const value: CartContextType = {
    items,
    loading,
    total: subtotal,
    itemCount,
    addItem,
    updateQuantity: updateItemQuantity,
    removeItem,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
