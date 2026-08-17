import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { CartItem, CartContextType, Product } from '../types';
import { useCartStore } from '../stores/useCartStore';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const store = useCartStore();

  return useMemo(() => ({
    items: store.items as CartItem[],
    addItem: async (product: Product, quantity = 1, variantId?: string) => {
      store.addItem(product, quantity, undefined, variantId);
    },
    removeItem: async (productId: string, variantId?: string) => {
      store.removeItem(productId, variantId ? { variantId } : undefined);
    },
    removeFromCart: async (itemId: string) => {
      store.removeItem(itemId);
    },
    updateQuantity: async (productId: string, quantity: number, variantId?: string) => {
      store.updateQuantity(productId, quantity, variantId ? { variantId } : undefined);
    },
    clearCart: async () => {
      store.clearCart();
    },
    total: store.getTotal(),
    itemCount: store.getItemCount(),
    loading: false
  }), [store.items]);
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useCart();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
