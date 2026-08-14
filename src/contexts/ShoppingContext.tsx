import React, { createContext, useContext, ReactNode } from 'react';
import {
  CartItem, CartContextType, Product, WishlistItem,
  Order, OrderContextType, Address, AddressContextType
} from '../types';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

// Hooks
import { useShoppingCart } from '../hooks/shopping/useShoppingCart';
import { useShoppingWishlist } from '../hooks/shopping/useShoppingWishlist';
import { useShoppingOrders } from '../hooks/shopping/useShoppingOrders';
import { useShoppingAddresses } from '../hooks/shopping/useShoppingAddresses';

export interface ShoppingContextType extends CartContextType, OrderContextType, AddressContextType {
  wishedItems: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error('useShopping must be used within a ShoppingProvider');
  return context;
};

// Backward compatibility hooks
export const useCart = () => {
  const context = useShopping();
  return {
    items: context.items, loading: context.loading, total: context.total, itemCount: context.itemCount,
    addItem: context.addItem, updateQuantity: context.updateQuantity, removeItem: context.removeItem,
    removeFromCart: context.removeFromCart, clearCart: context.clearCart
  };
};

export const useWishlist = () => {
  const context = useShopping();
  return {
    items: context.wishedItems, addItem: context.addToWishlist, removeItem: context.removeFromWishlist,
    isInWishlist: context.isInWishlist, clearWishlist: context.clearWishlist, loading: context.loading
  };
};

export const useOrders = () => {
  const context = useShopping();
  return {
    orders: context.orders, loading: context.loading, createOrder: context.createOrder,
    updateOrderStatus: context.updateOrderStatus, getOrderById: context.getOrderById, getUserOrders: context.getUserOrders
  };
};

export const useAddresses = () => {
  const context = useShopping();
  return {
    addresses: context.addresses, addAddress: context.addAddress, updateAddress: context.updateAddress,
    deleteAddress: context.deleteAddress, setDefaultAddress: context.setDefaultAddress,
    fetchAddresses: context.fetchAddresses, loading: context.loading
  };
};

export const ShoppingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const cart = useShoppingCart(user, showNotification);
  const wishlist = useShoppingWishlist(user, showNotification);
  const orders = useShoppingOrders(user, showNotification);
  const addresses = useShoppingAddresses(user, showNotification);

  const value: ShoppingContextType = {
    ...cart,
    ...wishlist,
    ...orders,
    ...addresses,
    loading: cart.loading || wishlist.loading || orders.loading || addresses.loading
  };

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
};
