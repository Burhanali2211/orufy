import { apiClient } from '@/shared/lib/apiClient';
import { useState, useCallback, useEffect } from 'react';
import { Order, CartItem, Address } from '../../types';
import api from '@/shared/config/api';
import { mapDbOrderToAppOrder } from '../../utils/shoppingMapper';
import * as optimized from '../../lib/optimized-queries';

export const useShoppingOrders = (user: any, showNotification: any) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserOrders = useCallback(async () => {
    if (!user) { setOrders([]); return; }
    setLoading(true);
    try {
      const data = await optimized.getUserActiveOrders(user.id);
      setOrders(data.map(d => ({ ...d, items: [] } as unknown as Order)));
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to load orders. Please try again later.' });
    } finally { setLoading(false); }
  }, [user, showNotification]);

  useEffect(() => { fetchUserOrders(); }, [fetchUserOrders]);

  const createOrder = async (items: CartItem[], shippingAddress: Address, paymentMethod: string, total: number, razorpay_order_id?: string): Promise<string | null> => {
    if (!user) {
      showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
      return null;
    }
    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shippingAmount = total > 1000 ? 0 : 50;
      const taxAmount = subtotal * 0.18;

      const orderData = {
        user_id: user.id, order_number: orderNumber, total_amount: total,
        subtotal, tax_amount: taxAmount, shipping_amount: shippingAmount,
        status: 'pending', payment_status: 'pending', payment_method: paymentMethod,
        razorpay_order_id, shipping_address: shippingAddress, billing_address: shippingAddress,
      };

      const order = await apiClient.post('/orders', orderData);

      const orderItems = items.map(item => ({
        order_id: order.id, product_id: item.product.id, variant_id: item.variantId,
        quantity: item.quantity, unit_price: item.product.price, 
        total_price: item.product.price * item.quantity, product_snapshot: item.product
      }));

      await apiClient.post('/order-items', orderItems);

      await (api.cart as any).clear?.();
      await fetchUserOrders();
      showNotification({ type: 'success', title: 'Order Placed!', message: `Order ${orderNumber} created successfully.` });
      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification({ type: 'error', title: 'Order Failed', message: 'Failed to create order. Please try again.' });
      return null;
    } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status });
      await fetchUserOrders();
      return true;
    } catch (error) { console.error('Error updating order status:', error); return false; }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const data = await apiClient.get(`/orders/${orderId}`);
      return mapDbOrderToAppOrder(data);
    } catch (error) { console.error('Error fetching order:', error); return orders.find(o => o.id === orderId) || null; }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];
    try {
      const data = await apiClient.get(`/orders?userId=${targetUserId}`);
      return data.map(mapDbOrderToAppOrder);
    } catch (error) { console.error('Error fetching user orders:', error); return []; }
  };

  return { orders, loading, createOrder, updateOrderStatus, getOrderById, getUserOrders };
};
