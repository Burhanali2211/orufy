import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, Address, OrderContextType, OrderItem } from '../types';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const mapDbOrderToAppOrder = (dbOrder: any): Order => ({
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    userId: dbOrder.user_id,
    items: (dbOrder.order_items || []).map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      productSnapshot: item.product_snapshot,
      createdAt: new Date(item.created_at),
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        images: item.products.images || [],
      } : undefined
    })),
    total: dbOrder.total_amount,
    subtotal: dbOrder.subtotal,
    taxAmount: dbOrder.tax_amount,
    shippingAmount: dbOrder.shipping_amount,
    discountAmount: dbOrder.discount_amount,
    status: dbOrder.status,
    paymentStatus: dbOrder.payment_status,
    paymentMethod: dbOrder.payment_method,
    paymentId: dbOrder.payment_id,
    currency: dbOrder.currency || 'INR',
    shippingAddress: dbOrder.shipping_address,
    billingAddress: dbOrder.billing_address,
    notes: dbOrder.notes,
    trackingNumber: dbOrder.tracking_number,
    shippedAt: dbOrder.shipped_at ? new Date(dbOrder.shipped_at) : undefined,
    deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
    createdAt: new Date(dbOrder.created_at),
    updatedAt: dbOrder.updated_at ? new Date(dbOrder.updated_at) : undefined,
  });

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      // TODO: Connect to local postgres API
      setOrders([]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const createOrder = async (
    items: CartItem[],
    shippingAddress: Address,
    paymentMethod: string,
    total: number,
    razorpay_order_id?: string
  ): Promise<{ orderId: string, razorpayOrderId: string | null } | null> => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to place an order'
      });
      return null;
    }

    setLoading(true);
    try {
      // Map CartItem[] to what the backend expects
      const backendItems = items.map(item => ({
        productId: item.product.id,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // Call the secure Express backend with store context
      const storeHost = localStorage.getItem('store_hostname');
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (storeHost) headers['x-store-hostname'] = storeHost;

      const response = await fetch('/api/platform/payment/checkout/orders', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          items: backendItems,
          shippingAddress,
          billingAddress: shippingAddress,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create order on server');
      }

      const result = await response.json();
      const orderId = result.order?.id || result.id;
      const razorpayOrderId = result.order?.razorpayOrderId || result.razorpayOrderId || null;

      await fetchUserOrders();
      showNotification({
        type: 'success',
        title: 'Order Placed!',
        message: `Order ${result.order?.orderNumber || orderId} created successfully.`
      });

      return { orderId, razorpayOrderId };
    } catch (error: any) {
      console.error('Error creating order:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: error.message || 'Failed to create order. Please try again.'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      // TODO: Connect to local postgres API
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      // TODO: Connect to local postgres API
      return orders.find(o => o.id === orderId) || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return orders.find(o => o.id === orderId) || null;
    }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    try {
      // TODO: Connect to local postgres API
      return [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  };

  const value: OrderContextType = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getUserOrders
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};
