import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Product, WishlistItem, WishlistContextType } from '../types';
import { useWishlistStore } from '../stores/useWishlistStore';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
  const store = useWishlistStore();

  return useMemo(() => ({
    items: store.items as WishlistItem[],
    addItem: async (product: Product) => {
      store.addItem(product);
    },
    removeItem: async (productId: string) => {
      store.removeItem(productId);
    },
    isInWishlist: (productId: string) => {
      return store.isInWishlist(productId);
    },
    clearWishlist: async () => {
      store.clearWishlist();
    },
    loading: false
  }), [store.items]);
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useWishlist();
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
