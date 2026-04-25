import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Package, Truck, Printer, Loader2, AlertCircle,
  DollarSign, User, MapPin, Calendar, CreditCard, Edit, Save, Phone
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { ConfirmModal } from '@/components/Common/Modal';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  getAdminStatusClasses,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  OrderStatus
} from '@/utils/orderStatusUtils';

interface OrderDetailsProps {
  orderId: string;
  onClose: () => void;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
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
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <div className="text-sm font-medium text-gray-900">{value}</div>
  </div>
);

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
      const res = await apiClient.get<any>(`/api/dashboard/orders/${orderId}`);
      if (!res.data) {
        setOrder(null);
        return;
      }
      
      const orderRow = res.data;

      const orderData: OrderData = {
        id: orderRow.id,
        order_number: orderRow.orderNumber || orderRow.order_number || orderRow.id,
        customer_name: orderRow.customerName || orderRow.customer_name || 'Guest',
        customer_email: orderRow.customerEmail || orderRow.customer_email || '',
        customer_phone: orderRow.customerPhone || orderRow.customer_phone || orderRow.shippingAddress?.phone || orderRow.shippingAddress?.phoneNumber || orderRow.shipping_address?.phone || '',
        status: orderRow.status,
        payment_status: orderRow.paymentStatus || orderRow.payment_status || 'pending',
        payment_method: orderRow.paymentMethod || orderRow.payment_method || 'cod',
        razorpay_payment_id: orderRow.razorpayPaymentId || orderRow.razorpay_payment_id,
        razorpay_order_id: orderRow.razorpayOrderId || orderRow.razorpay_order_id,
        payment_method_details: orderRow.paymentMethodDetails || orderRow.payment_method_details,
        subtotal: String(orderRow.subtotal || 0),
        tax_amount: String(orderRow.taxAmount || orderRow.tax_amount || 0),
        shipping_amount: String(orderRow.shippingFee || orderRow.shipping_amount || 0),
        discount_amount: String(orderRow.discountAmount || orderRow.discount_amount || 0),
        total_amount: String(orderRow.total || orderRow.total_amount || 0),
        shipping_address: orderRow.shippingAddress || orderRow.shipping_address || {},
        billing_address: orderRow.billingAddress || orderRow.billing_address || {},
        tracking_number: orderRow.trackingNumber || orderRow.tracking_number || '',
        notes: orderRow.notes || '',
        created_at: orderRow.createdAt || orderRow.created_at,
        items: (orderRow.items || []).map((i: any, index: number) => ({
          id: i.id || String(index),
          product_id: i.productId || i.product_id,
          product_name: i.name || i.productName || i.product_name || 'Product',
          product_image: i.image || i.imageUrl || i.product_image || (Array.isArray(i.products?.images) ? i.products.images[0] : ''),
          quantity: i.quantity || 1,
          unit_price: String(i.price || i.unitPrice || i.unit_price || 0),
          total_price: String((i.quantity || 1) * parseFloat(i.price || i.unitPrice || i.unit_price || '0')),
        })),
      };
      setOrder(orderData);
      setNewStatus(orderData.status);
      setNewPaymentStatus(orderData.payment_status);
      setTrackingNumber(orderData.tracking_number || '');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) { setShowStatusModal(false); return; }
    try {
      setUpdating(true);
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'shipped') updates.shippedAt = new Date().toISOString();
      if (newStatus === 'delivered') updates.deliveredAt = new Date().toISOString();

      await apiClient.patch(`/api/dashboard/orders/${orderId}`, updates);

      showSuccess('Success', 'Order status updated');
      setShowStatusModal(false);
      fetchOrderDetails();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!order || newPaymentStatus === order.payment_status) return;
    try {
      setUpdating(true);
      await apiClient.patch(`/api/dashboard/orders/${orderId}`, { paymentStatus: newPaymentStatus });
      showSuccess('Success', 'Payment status updated');
      await fetchOrderDetails();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!order) return;
    const trimmed = trackingNumber.trim();
    if (trimmed === (order.tracking_number || '')) return;
    try {
      setUpdating(true);
      await apiClient.patch(`/api/dashboard/orders/${orderId}`, { trackingNumber: trimmed || null });
      showSuccess('Success', trimmed ? 'Tracking number updated' : 'Tracking number cleared');
      await fetchOrderDetails();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update tracking number');
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading order details...</p>
        </div>
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
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors flex-shrink-0"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
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
          <p className="text-xl font-bold text-blue-700">{order.items.length}</p>
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
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Order Items */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
                <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
              </div>
            </div>

            {/* Items list */}
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                    <img
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-amber-600 flex-shrink-0">{fmt(item.total_price)}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{fmt(order.subtotal)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-emerald-600">−{fmt(order.discount_amount)}</span>
                </div>
              )}
              {Number(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium text-gray-900">{fmt(order.tax_amount)}</span>
                </div>
              )}
              {Number(order.shipping_amount) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{fmt(order.shipping_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-amber-600">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <SectionCard
            icon={<User className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50"
            title="Customer"
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
                  disabled={updating}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
                >
                  {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                {newStatus !== order.status && (
                  <button
                    onClick={() => setShowStatusModal(true)}
                    disabled={updating}
                    className="mt-2.5 w-full px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                  disabled={updating}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
                >
                  {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                {newPaymentStatus !== order.payment_status && (
                  <button
                    onClick={handleUpdatePaymentStatus}
                    disabled={updating}
                    className="mt-2.5 w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                  disabled={updating}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
                />
                {trackingNumber.trim() !== (order.tracking_number || '').trim() && (
                  <button
                    onClick={handleUpdateTracking}
                    disabled={updating}
                    className="mt-2.5 w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {trackingNumber.trim() ? 'Save Tracking' : 'Clear Tracking'}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Status Update Confirmation */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        title="Update Order Status"
        message={`Change status from "${getOrderStatusConfig(order.status).label}" to "${getOrderStatusConfig(newStatus).label}"?`}
        confirmText="Update"
        variant="warning"
        loading={updating}
      />
    </div>
  );
};
