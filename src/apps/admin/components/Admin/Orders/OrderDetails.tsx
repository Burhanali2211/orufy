import { apiClient } from '@/shared/lib/apiClient';
import React, { useState } from 'react';
import {
  ArrowLeft, Package, Truck, Printer, AlertCircle,
  DollarSign, User, MapPin, Calendar, CreditCard, Edit, Save, RefreshCw,
  Mail, Send, History, X, CheckCircle2
} from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { ConfirmModal } from '@/shared/components/Common/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@/shared/types';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  getAdminStatusClasses,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG
} from '@/shared/utils/orderStatusUtils';

interface OrderDetailsProps {
  orderId: string;
  onBack?: () => void;
  onClose?: () => void;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_snapshot?: {
    image_url?: string;
    images?: string[];
  };
}

interface OrderData {
  id: string;
  order_number: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  payment_method_details?: any;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  shipping_address: any;
  billing_address: any;
  tracking_number: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

const SectionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, children }) => (
  <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <h2 className="text-base font-bold text-stone-900">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
    <div className="text-sm font-bold text-stone-900">{value}</div>
  </div>
);

export const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onClose }) => {
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailEventType, setEmailEventType] = useState('ORDER_CONFIRMED');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<OrderData>({
    queryKey: ['admin-order', orderId],
    queryFn: () => apiClient.get(`/merchant/orders/${orderId}`).then(res => {
        // Initialize local states once data is loaded
        setNewStatus(res.status);
        setNewPaymentStatus(res.payment_status);
        setTrackingNumber(res.tracking_number || '');
        setEmailRecipient(res.customer_email || res.user_email || res.shipping_address?.email || '');
        return res;
    }),
  });

  const { data: communications, isLoading: communicationsLoading, refetch: refetchCommunications } = useQuery({
    queryKey: ['order-communications', orderId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/merchant/orders/${orderId}/communications`);
      return res?.communications || [];
    },
    enabled: !!orderId,
  });

  const resendEmailMutation = useMutation({
    mutationFn: (payload: { eventType: string; recipientEmail?: string; customSubject?: string }) =>
      apiClient.post(`/merchant/orders/${orderId}/resend-email`, payload),
    onSuccess: (data: any) => {
      showSuccess('Email Sent', data.message || 'Notification email dispatched successfully');
      setShowEmailModal(false);
      refetchCommunications();
    },
    onError: (err: any) => {
      showError('Failed to Send', err.message || 'Failed to dispatch notification email');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => apiClient.put(`/merchant/orders/${orderId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error: Error) => {
      showError('Error', error.message || 'Failed to update order');
    }
  });

  const trackingMutation = useMutation({
    mutationFn: (data: { order_id: string; status: string; message: string }) => 
      apiClient.post('/merchant/orders/tracking', data),
    onError: (error: Error) => {
      console.error('Failed to insert tracking event', error);
      // Non-critical, so we don't necessarily show an error popup for just tracking log failure
    }
  });

  const handleUpdateStatus = () => {
    if (!order || newStatus === order.status) { setShowStatusModal(false); return; }
    
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();

    updateMutation.mutate(updates, {
        onSuccess: () => {
            const statusMessages: Record<string, string> = {
                confirmed: 'Your order has been confirmed and is being prepared.',
                processing: 'Your order is being packed and prepared for shipment.',
                shipped: 'Your order has been shipped and is on its way.',
                delivered: 'Your order has been delivered. Thank you for shopping with us!',
                cancelled: 'Your order has been cancelled.',
            };
            trackingMutation.mutate({
                order_id: orderId,
                status: newStatus,
                message: statusMessages[newStatus] || `Order status updated to ${newStatus}.`,
            });
            showSuccess('Success', 'Order status updated');
            setShowStatusModal(false);
        }
    });
  };

  const handleUpdatePaymentStatus = () => {
    if (!order || newPaymentStatus === order.payment_status) return;
    updateMutation.mutate({ payment_status: newPaymentStatus }, {
        onSuccess: () => showSuccess('Success', 'Payment status updated')
    });
  };

  const handleUpdateTracking = () => {
    if (!order) return;
    const trimmed = trackingNumber.trim();
    if (trimmed === (order.tracking_number || '')) return;
    
    updateMutation.mutate({ tracking_number: trimmed || null }, {
        onSuccess: () => showSuccess('Success', trimmed ? 'Tracking number updated' : 'Tracking number cleared')
    });
  };

  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">Order not found</p>
        <button onClick={onClose} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const addr = order.shipping_address;
  const addrLine = [
    addr?.streetAddress || addr?.street_address || addr?.street,
    addr?.city && addr?.state ? `${addr.city}, ${addr.state}` : addr?.city || addr?.state,
    addr?.postalCode || addr?.postal_code || addr?.zipCode,
    addr?.country,
  ].filter(Boolean).join('\n');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5 flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
              {renderStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const defaultEmail = order.customer_email || order.user_email || order.shipping_address?.email || '';
              setEmailRecipient(defaultEmail);
              setShowEmailModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            Resend Email
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors flex-shrink-0 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <p className="text-xs text-gray-500 font-medium">Total</p>
          </div>
          <p className="text-xl font-bold text-amber-700">{fmt(order.total_amount)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Items</p>
          </div>
          <p className="text-xl font-bold text-blue-700">{order.items?.length || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <p className="text-xs text-gray-500 font-medium">Payment</p>
          </div>
          <div className="mt-0.5">{renderStatusBadge(order.payment_status, true)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-gray-500" />
            <p className="text-xs text-gray-500 font-medium">Tracking</p>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">
            {order.tracking_number || '—'}
          </p>
        </div>
      </div>

      {/* Main layout: left (items + customer + payment) + right (manage) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100">
              <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-stone-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Order Items</h2>
                <p className="text-xs text-stone-400 font-medium">{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</p>
              </div>
            </div>

            {/* Items list */}
            <div className="divide-y divide-stone-100">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/60 transition-colors">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200">
                    <img
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-stone-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {fmt(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm text-stone-900 flex-shrink-0">{fmt(item.total_price)}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="px-6 py-5 border-t border-stone-100 bg-stone-50/50 space-y-2.5">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{fmt(order.subtotal)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Discount</span>
                  <span className="font-semibold text-emerald-600">−{fmt(order.discount_amount)}</span>
                </div>
              )}
              {Number(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Tax (GST)</span>
                  <span className="font-semibold text-stone-900">{fmt(order.tax_amount)}</span>
                </div>
              )}
              {Number(order.shipping_amount) > 0 && (
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-stone-900">{fmt(order.shipping_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-3 border-t border-stone-200">
                <span className="text-stone-900">Total Charged</span>
                <span className="text-stone-900">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <SectionCard
            icon={<User className="w-4 h-4 text-stone-700" />}
            iconBg="bg-stone-100"
            title="Customer Profile"
          >
            <div className="space-y-3">
              <InfoRow label="Name" value={order.customer_name} />
              <InfoRow label="Email" value={<span className="break-all">{order.customer_email || '—'}</span>} />
              {order.customer_phone && <InfoRow label="Phone" value={order.customer_phone} />}
              {addrLine && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs text-gray-500">Shipping Address</p>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-line pl-5">{addrLine}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Order Notes</p>
                  <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Payment Info */}
          <SectionCard
            icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            title="Payment"
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                {renderStatusBadge(order.payment_status, true)}
              </div>
              <InfoRow
                label="Method"
                value={getPaymentMethodConfig(order.payment_method).label}
              />
              {order.payment_status === 'paid' && (
                <InfoRow label="Amount Paid" value={<span className="text-emerald-600 font-semibold">{fmt(order.total_amount)}</span>} />
              )}
              {order.razorpay_payment_id && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Razorpay Payment ID</p>
                  <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block break-all">
                    {order.razorpay_payment_id}
                  </code>
                </div>
              )}
              {order.razorpay_order_id && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Razorpay Order ID</p>
                  <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block break-all">
                    {order.razorpay_order_id}
                  </code>
                </div>
              )}
              {order.payment_method_details && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1.5 text-sm">
                  {order.payment_method_details.method && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method</span>
                      <span className="font-medium text-gray-900 capitalize">{order.payment_method_details.method}</span>
                    </div>
                  )}
                  {order.payment_method_details.card?.last4 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Card</span>
                      <span className="font-medium text-gray-900">
                        ****{order.payment_method_details.card.last4} ({order.payment_method_details.card.network || 'Card'})
                      </span>
                    </div>
                  )}
                  {order.payment_method_details.vpa && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">UPI ID</span>
                      <span className="font-medium text-gray-900">{order.payment_method_details.vpa}</span>
                    </div>
                  )}
                  {order.payment_method_details.bank && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-medium text-gray-900">{order.payment_method_details.bank}</span>
                    </div>
                  )}
                  {order.payment_method_details.wallet && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Wallet</span>
                      <span className="font-medium text-gray-900">{order.payment_method_details.wallet}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right sidebar: Manage Order */}
        <div>
          <SectionCard
            icon={<Edit className="w-4 h-4 text-purple-600" />}
            iconBg="bg-purple-50"
            title="Manage Order"
          >
            <div className="space-y-5">
              {/* Order Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Order Status
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Current: <span className="font-medium text-gray-900">{getOrderStatusConfig(order.status).label}</span>
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updateMutation.isPending}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
                >
                  {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                {newStatus !== order.status && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    disabled={updateMutation.isPending}
                    className="mt-2.5 w-full px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                    Update Status
                  </button>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Payment Status
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Current: <span className="font-medium text-gray-900">{getPaymentStatusConfig(order.payment_status).label}</span>
                </p>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  disabled={updateMutation.isPending}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
                >
                  {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                {newPaymentStatus !== order.payment_status && (
                  <button
                    onClick={handleUpdatePaymentStatus}
                    disabled={updateMutation.isPending}
                    className="mt-2.5 w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                    Update Payment
                  </button>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Tracking Number
                </label>
                {order.tracking_number && (
                  <p className="text-xs text-gray-500 mb-2">
                    Current: <span className="font-medium text-gray-900 font-mono">{order.tracking_number}</span>
                  </p>
                )}
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number (optional)"
                  disabled={updateMutation.isPending}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
                />
                {trackingNumber.trim() !== (order.tracking_number || '').trim() && (
                  <button
                    onClick={handleUpdateTracking}
                    disabled={updateMutation.isPending}
                    className="mt-2.5 w-full px-4 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                    {trackingNumber.trim() ? 'Save Tracking' : 'Clear Tracking'}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Communication History Section */}
          <SectionCard
            icon={<History className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50"
            title="Communication History"
          >
            <div className="space-y-3">
              {communicationsLoading ? (
                <div className="py-6 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading communications...</span>
                </div>
              ) : !communications || communications.length === 0 ? (
                <div className="py-5 text-center bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-2">
                  <Mail className="w-6 h-6 text-stone-300 mx-auto" />
                  <p className="text-xs font-medium text-stone-500">No email history recorded for this order yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultEmail = order.customer_email || order.user_email || order.shipping_address?.email || '';
                      setEmailRecipient(defaultEmail);
                      setShowEmailModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Initial Email</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {communications.map((comm: any) => (
                    <div
                      key={comm.id}
                      className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-stone-900 uppercase tracking-wider text-[10px] px-2 py-0.5 bg-white border border-stone-200 rounded-md">
                          {comm.event_type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            comm.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {comm.status === 'DELIVERED' ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5" />
                          )}
                          <span>{comm.status}</span>
                        </span>
                      </div>
                      <div className="text-stone-600 truncate flex items-center gap-1 pt-0.5">
                        <Mail className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{comm.recipient}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 pt-0.5">
                        {new Date(comm.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const defaultEmail = order.customer_email || order.user_email || order.shipping_address?.email || '';
                      setEmailRecipient(defaultEmail);
                      setShowEmailModal(true);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Another Email</span>
                  </button>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Resend Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">Resend Order Email</h3>
                  <p className="text-xs text-stone-500">Dispatch transactional update via Resend</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!emailRecipient.trim()) {
                  showError('Missing Recipient', 'Please specify a recipient email address');
                  return;
                }
                resendEmailMutation.mutate({
                  eventType: emailEventType,
                  recipientEmail: emailRecipient.trim(),
                  customSubject: customSubject.trim() || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Email Template
                </label>
                <select
                  value={emailEventType}
                  onChange={(e) => setEmailEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="ORDER_CONFIRMED">Order Confirmation & Receipt</option>
                  <option value="ORDER_SHIPPED">Shipping & Tracking Notification</option>
                  <option value="ORDER_DELIVERED">Delivery Confirmation</option>
                  <option value="ORDER_CANCELLED">Order Cancellation Notice</option>
                  <option value="INVOICE">Official Tax Invoice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Recipient Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Custom Subject Line (Optional)
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={`e.g. Update regarding your Order #${order.order_number}`}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  disabled={resendEmailMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resendEmailMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  {resendEmailMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{resendEmailMutation.isPending ? 'Sending...' : 'Send Email Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Confirmation */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        title="Update Order Status"
        message={`Change status from "${getOrderStatusConfig(order.status).label}" to "${getOrderStatusConfig(newStatus).label}"?`}
        confirmText="Update"
        variant="warning"
        loading={updateMutation.isPending}
      />
    </div>
  );
};
