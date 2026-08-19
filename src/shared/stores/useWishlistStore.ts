import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/shared/types';

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => boolean;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
}

const getTenantKey = (base: string) => {
  if (typeof window === 'undefined') return base;
  const host = (window.location.hostname || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${base}_${host}`;
};

const dynamicTenantStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(getTenantKey(name));
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getTenantKey(name), value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getTenantKey(name));
  },
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          if (state.items.some((item) => item.product.id === product.id)) {
            return state;
          }
          return {
            items: [...state.items, { product, addedAt: new Date().toISOString() }]
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId)
        }));
      },

      toggleItem: (product) => {
        const isPresent = get().items.some((item) => item.product.id === product.id);
        if (isPresent) {
          get().removeItem(product.id);
          return false;
        } else {
          get().addItem(product);
          return true;
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.product.id === productId);
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => get().items.length,
    }),
    {
      name: 'orufy_wishlist_storage',
      storage: createJSONStorage(() => dynamicTenantStorage),
    }
  )
);
