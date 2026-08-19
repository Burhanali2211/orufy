import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from '../src/apps/storefront/pages/CheckoutPage';

// Mock contexts
vi.mock('@/shared/contexts/CartContext', () => ({
  useCart: () => ({
    items: [{ product: { id: '1', name: 'Test Product', price: 100 }, quantity: 1 }],
    total: 100,
    clearCart: vi.fn(),
    itemCount: 1,
    subtotal: 100,
    shipping: 0,
    tax: 18,
    discount: 0,
  }),
}));

vi.mock('@/shared/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test_user_id', email: 'test@example.com' },
  }),
}));

vi.mock('@/shared/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

vi.mock('@/shared/components/Payment/RazorpayPayment', () => ({
  RazorpayPayment: () => <div data-testid="razorpay-mock">Payment Modal</div>,
}));

vi.mock('@/shared/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { id: 'order_123' } }),
  },
}));

describe('Checkout Flow', () => {
  it('renders checkout page with items and stages', () => {
    render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    // Verify checkout heading or breadcrumb
    expect(screen.getAllByText(/Checkout/i).length).toBeGreaterThan(0);
    // Verify shipping step is displayed
    expect(screen.getAllByText(/Shipping/i).length).toBeGreaterThan(0);
  });
});
