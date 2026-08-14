import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ImprovedCheckoutPage } from '../src/pages/ImprovedCheckoutPage';

// Mock contexts
vi.mock('../src/contexts/CartContext', () => ({
  useCart: () => ({
    items: [{ id: '1', name: 'Test Product', price: 100, quantity: 1, image: 'test.jpg' }],
    total: 100,
    clearCart: vi.fn(),
    itemCount: 1,
  }),
}));

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test_user_id', email: 'test@example.com' },
  }),
}));

vi.mock('../src/contexts/OrderContext', () => ({
  useOrders: () => ({
    createOrder: vi.fn().mockResolvedValue('test_order_123'),
  }),
}));

vi.mock('../src/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

// Mock payment component since we don't want to load actual Razorpay script in test
vi.mock('../src/components/Payment/RazorpayPayment', () => ({
  RazorpayPayment: () => <div data-testid="razorpay-mock">Payment Modal</div>,
}));

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('Checkout Flow', () => {
  it('renders checkout page with items', () => {
    render(
      <BrowserRouter>
        <ImprovedCheckoutPage />
      </BrowserRouter>
    );

    // Verify it renders the checkout header
    expect(screen.getByText('Checkout')).toBeDefined();
    
    // Verify it renders the "Shipping" step as active (Step 1)
    expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0);
    
    // Verify it displays the Continue to Payment button
    expect(screen.getByText('Continue to Payment')).toBeDefined();
  });
});
