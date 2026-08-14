import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState } from 'react';
import {  AlertCircle } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';
import { ConfirmModal } from '@/components/Common/Modal';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getAdminStatusClasses,
} from '@/utils/orderStatusUtils';

// Types & Sections
import { OrderData } from './types';
import { OrderHeader } from './OrderDetailsSections/OrderHeader';
import { QuickStats } from './OrderDetailsSections/QuickStats';
import { OrderItemsSection } from './OrderDetailsSections/OrderItemsSection';
import { CustomerInfoSection } from './OrderDetailsSections/CustomerInfoSection';
import { PaymentInfoSection } from './OrderDetailsSections/PaymentInfoSection';
import { ManageOrderSection } from './OrderDetailsSections/ManageOrderSection';
import { FulfillmentActionCard } from './OrderDetailsSections/FulfillmentActionCard';

interface OrderDetailsProps {
  orderId: string;
  onClose: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => { fetchOrderDetails(); }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data: orderRow, error } = await apiClient.get('/orders');
      
      if (!orderRow) { setOrder(null); return; }

      const [itemsRes, profileRes] = await Promise.all([
        supabase.from('order_items').select('*, products(name, images)').eq('order_id', orderId),
        orderRow.user_id ? supabase.from('profiles').select('full_name, email, phone').eq('id', orderRow.user_id).single() : Promise.resolve({ data: null }),
      ]);

      const profile = profileRes.data;
      const orderData: OrderData = {
        id: orderRow.id,
        order_number: orderRow.order_number || orderRow.id,
        customer_name: profile?.full_name || 'Guest',
        customer_email: profile?.email || '',
        customer_phone: profile?.phone || orderRow.shipping_address?.phone || orderRow.shipping_address?.phoneNumber || '',
        status: orderRow.status,
        payment_status: orderRow.payment_status || 'pending',
        payment_method: orderRow.payment_method || 'cod',
        razorpay_payment_id: orderRow.razorpay_payment_id,
        razorpay_order_id: orderRow.razorpay_order_id,
        payment_method_details: orderRow.payment_method_details,
        subtotal: String(orderRow.subtotal || 0),
        tax_amount: String(orderRow.tax_amount || 0),
        shipping_amount: String(orderRow.shipping_amount || 0),
        discount_amount: String(orderRow.discount_amount || 0),
        total_amount: String(orderRow.total_amount || 0),
        shipping_address: orderRow.shipping_address || {},
        billing_address: orderRow.billing_address || {},
        tracking_number: orderRow.tracking_number || '',
        notes: orderRow.notes || '',
        created_at: orderRow.created_at,
        items: (itemsRes.data || []).map((i: any) => ({
          id: i.id, product_id: i.product_id, product_name: i.products?.name || 'Product',
          product_image: Array.isArray(i.products?.images) ? i.products.images[0] : '',
          quantity: i.quantity, unit_price: String(i.unit_price || 0),
          total_price: String((i.quantity || 0) * parseFloat(i.unit_price || '0')),
        })),
      };
      setOrder(orderData);
      setNewStatus(orderData.status);
      setNewPaymentStatus(orderData.payment_status);
      setTrackingNumber(orderData.tracking_number || '');
    } catch (error: any) { showError('Error', error.message || 'Failed to load order details'); } finally { setLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) { setShowStatusModal(false); return; }
    try {
      setUpdating(true);
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
      if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();
      await apiClient.put(`/orders/${orderId}`, updates);
      
      const statusMessages: Record<string, string> = { confirmed: 'Confirmed.', processing: 'Processing.', shipped: 'Shipped.', delivered: 'Delivered.', cancelled: 'Cancelled.' };
      await apiClient.post('/order_tracking', { order_id: orderId, status: newStatus, message: statusMessages[newStatus] || `Status updated to ${newStatus}.` });
      showSuccess('Success', 'Order status updated');
      setShowStatusModal(false);
      fetchOrderDetails();
    } catch (error: any) { showError('Error', error.message || 'Failed to update status'); } finally { setUpdating(false); }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!order || newPaymentStatus === order.payment_status) return;
    try {
      setUpdating(true);
      await apiClient.put(`/orders/${orderId}`, { payment_status: newPaymentStatus });
      
      showSuccess('Success', 'Payment status updated');
      await fetchOrderDetails();
    } catch (error: any) { showError('Error', error.message || 'Failed to update payment status'); } finally { setUpdating(false); }
  };

  const handleUpdateTracking = async () => {
    if (!order) return;
    const trimmed = trackingNumber.trim();
    if (trimmed === (order.tracking_number || '')) return;
    try {
      setUpdating(true);
      await apiClient.put(`/orders/${orderId}`, { tracking_number: trimmed || null });
      
      showSuccess('Success', trimmed ? 'Tracking updated' : 'Tracking cleared');
      await fetchOrderDetails();
    } catch (error: any) { showError('Error', error.message || 'Failed to update tracking'); } finally { setUpdating(false); }
  };

  const renderStatusBadge = (status: string, isPayment = false) => {
    const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
    const Icon = config.icon;
    const cls = getAdminStatusClasses(status, isPayment);
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cls}`}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{config.label}</span>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-center"><></><p className="text-sm text-gray-500">Loading order details...</p></div>;
  if (!order) return <div className="text-center py-16"><AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 mb-4">Order not found</p><button onClick={onClose} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors">Go Back</button></div>;

  return (
    <div className="space-y-5">
      <OrderHeader order={order} onClose={onClose} renderStatusBadge={renderStatusBadge} />
      <QuickStats order={order} renderStatusBadge={renderStatusBadge} />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <OrderItemsSection order={order} />
          <CustomerInfoSection order={order} />
          <PaymentInfoSection order={order} renderStatusBadge={renderStatusBadge} />
        </div>
        <div className="space-y-5">
          <FulfillmentActionCard order={order} onOrderUpdated={fetchOrderDetails} />
          <ManageOrderSection order={order} updating={updating} newStatus={newStatus} setNewStatus={setNewStatus} newPaymentStatus={newPaymentStatus} setNewPaymentStatus={setNewPaymentStatus} trackingNumber={trackingNumber} setTrackingNumber={setTrackingNumber} setShowStatusModal={setShowStatusModal} handleUpdatePaymentStatus={handleUpdatePaymentStatus} handleUpdateTracking={handleUpdateTracking} />
        </div>
      </div>
      <ConfirmModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} onConfirm={handleUpdateStatus} title="Update Order Status" message={`Change status to "${getOrderStatusConfig(newStatus).label}"?`} confirmText="Update" variant="warning" loading={updating} />
    </div>
  );
};

