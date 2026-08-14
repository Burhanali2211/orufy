import React, { memo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { NotificationProvider } from './NotificationContext';
import { ProductProvider } from './ProductContext';
import { ErrorProvider } from './ErrorContext';
import { OrderProvider } from './OrderContext';
import { AddressProvider } from './AddressContext';
import { ThemeProvider } from './ThemeContext';
import { AuthModalProvider } from './AuthModalContext';
import { SettingsProvider } from './SettingsContext';
import { SecurityProvider } from '../components/Security/SecurityProvider';
import { NetworkStatusProvider } from '../components/Common/NetworkStatusProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60_000, retry: 1 },
    },
});

interface CombinedProviderProps {
    children: ReactNode;
}

export const CombinedProvider = memo<CombinedProviderProps>(({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorProvider>
                <ThemeProvider>
                    <NotificationProvider>
                        <AuthProvider>
                            <SecurityProvider>
                                <AuthModalProvider>
                                    <SettingsProvider>
                                        <ProductProvider>
                                            <CartProvider>
                                                <WishlistProvider>
                                                    <OrderProvider>
                                                        <AddressProvider>
                                                            <NetworkStatusProvider>
                                                                {children}
                                                            </NetworkStatusProvider>
                                                        </AddressProvider>
                                                    </OrderProvider>
                                                </WishlistProvider>
                                            </CartProvider>
                                        </ProductProvider>
                                    </SettingsProvider>
                                </AuthModalProvider>
                            </SecurityProvider>
                        </AuthProvider>
                    </NotificationProvider>
                </ThemeProvider>
            </ErrorProvider>
        </QueryClientProvider>
    );
});

CombinedProvider.displayName = 'CombinedProvider';
