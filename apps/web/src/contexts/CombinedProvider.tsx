import React, { memo, ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { NotificationProvider } from './NotificationContext';
import { ProductProvider } from './ProductContext';
import { OrderProvider } from './OrderContext';
import { SettingsProvider } from './SettingsContext';

interface CombinedProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps all context providers in a single component
 * This reduces the nesting level and improves performance
 */
export const CombinedProvider = memo<CombinedProviderProps>(({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <SettingsProvider>
          <ProductProvider>
            <CartProvider>
              <WishlistProvider>
                <OrderProvider>
                  {children}
                </OrderProvider>
              </WishlistProvider>
            </CartProvider>
          </ProductProvider>
        </SettingsProvider>
      </AuthProvider>
    </NotificationProvider>
  );
});

CombinedProvider.displayName = 'CombinedProvider';