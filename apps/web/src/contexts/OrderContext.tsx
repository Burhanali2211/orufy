import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, Address, OrderContextType, ApiResponse } from '../types';
import { apiClient } from '../lib/apiClient';
import { transformKeysToCamel } from '../lib/dataTransform';
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

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<Order[]>>('/dashboard/orders');
      setOrders(transformKeysToCamel<Order[]>(res.data || []));
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load orders. Please try again later.'
      });
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
    razorpayOrderId?: string
  ): Promise<string | null> => {
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
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shippingAmount = total > 1000 ? 0 : 50; 

      const orderData = {
        orderNumber,
        customerName: user.name || user.email,
        customerEmail: user.email,
        customerPhone: shippingAddress.phone,
        shippingAddress,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity
        })),
        subtotal,
        shippingFee: shippingAmount,
        total,
        paymentMethod,
        razorpayOrderId,
      };

      const res = await apiClient.post<ApiResponse<Order>>('/dashboard/orders', orderData);
      const newOrder = transformKeysToCamel<Order>(res.data);

      await fetchUserOrders();
      
      showNotification({
        type: 'success',
        title: 'Order Placed!',
        message: `Order ${orderNumber} created successfully.`
      });

      return newOrder.id;
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'Failed to create order. Please try again.'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      await apiClient.patch(`/dashboard/orders/${orderId}/status`, { status });
      await fetchUserOrders();
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const res = await apiClient.get<ApiResponse<Order>>(`/dashboard/orders/${orderId}`);
      return res.data ? transformKeysToCamel<Order>(res.data) : null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return orders.find(o => o.id === orderId) || null;
    }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Order[]>>('/dashboard/orders');
      return transformKeysToCamel<Order[]>(res.data || []);
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
