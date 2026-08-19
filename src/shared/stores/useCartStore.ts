import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/shared/types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  selectedOptions?: Record<string, string>;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: Product, quantity?: number, selectedOptions?: Record<string, string>, selectedVariant?: string) => void;
  removeItem: (productId: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;

  // Computed Selectors (getter methods)
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, selectedOptions = {}, selectedVariant) => {
        set((state) => {
          const optKey = JSON.stringify(selectedOptions || {});
          const existingIdx = state.items.findIndex(
            (item) => item.product.id === product.id && JSON.stringify(item.selectedOptions || {}) === optKey
          );

          if (existingIdx > -1) {
            const updated = [...state.items];
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + quantity
            };
            return { items: updated };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                selectedOptions,
                selectedVariant
              }
            ]
          };
        });
      },

      removeItem: (productId, selectedOptions) => {
        set((state) => {
          const optKey = selectedOptions ? JSON.stringify(selectedOptions) : null;
          return {
            items: state.items.filter((item) => {
              if (item.product.id !== productId) return true;
              if (optKey !== null && JSON.stringify(item.selectedOptions || {}) !== optKey) return true;
              return false;
            })
          };
        });
      },

      updateQuantity: (productId, quantity, selectedOptions) => {
        if (quantity <= 0) {
          get().removeItem(productId, selectedOptions);
          return;
        }

        set((state) => {
          const optKey = selectedOptions ? JSON.stringify(selectedOptions) : null;
          return {
            items: state.items.map((item) => {
              if (item.product.id !== productId) return item;
              if (optKey !== null && JSON.stringify(item.selectedOptions || {}) !== optKey) return item;
              return { ...item, quantity };
            })
          };
        });
      },

      clearCart: () => set({ items: [] }),

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = typeof item.product.price === 'number' 
            ? item.product.price 
            : parseFloat(String(item.product.price || 0));
          return total + (isNaN(price) ? 0 : price) * item.quantity;
        }, 0);
      },

      getTotal: () => {
        return get().getSubtotal();
      }
    }),
    {
      name: 'orufy_cart_storage',
      storage: createJSONStorage(() => dynamicTenantStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
