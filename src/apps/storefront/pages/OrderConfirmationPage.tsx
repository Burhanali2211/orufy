import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Package, MapPin, CreditCard,
  Truck, ArrowRight, ShoppingBag, Copy, Check, AlertCircle, Sparkles, Printer,
  Phone, Mail, ShieldCheck, Clock, ArrowLeft, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePrintWindow } from '@/shared/utils/invoiceGenerator';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ConfirmationOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  shipping_address: any;
  carrier?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  tracking_token?: string;
  items: OrderItem[];
}

interface StoreInfo {
  id: string;
  name: string;
  hostname?: string;
  subdomain?: string;
  logo_url?: string;
  primary_color?: string;
  currency?: string;
}

const fmt = (n: number) => {
  const val = typeof n === 'number' ? (n > 1000 ? n / 100 : n) : 0;
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { settings, getSiteSetting } = useSettings();

  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isResendingReceipt, setIsResendingReceipt] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendReceipt = async () => {
    if (!order || isResendingReceipt || resendCooldown > 0) return;
    try {
      setIsResendingReceipt(true);
      const url = `/api/customer/orders/${order.id}/resend-confirmation${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      const storeHost = localStorage.getItem('store_hostname');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storeHost) headers['x-store-hostname'] = storeHost;

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ token, email: order.shipping_address?.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
        throw new Error(data.message || data.error || 'Failed to resend receipt');
      }

      toast.success(data.message || 'Order confirmation receipt sent to your email!');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend receipt');
    } finally {
      setIsResendingReceipt(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, token]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/customer/orders/${orderId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      const storeHost = localStorage.getItem('store_hostname');
      const headers: Record<string, string> = {};
      if (storeHost) headers['x-store-hostname'] = storeHost;

      const res = await fetch(url, { credentials: 'include', headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load order');
      }

      setOrder(data.order);
      if (data.store) setStore(data.store);
    } catch (err: any) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTrackingNumber = () => {
    if (!order?.tracking_number) return;
    navigator.clipboard.writeText(order.tracking_number);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const storeName = store?.name || getSiteSetting('site_name') || (settings as any)?.site_name || 'Store';
  const logoUrl = store?.logo_url || getSiteSetting('logo_url') || (settings as any)?.site_logo;
  const storeInitial = storeName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-xs font-semibold">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xs border border-stone-200 space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">Order Details Unavailable</h2>
          <p className="text-stone-500 text-xs leading-relaxed">{error || 'Unable to access order information.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/store"
              className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCod = (order.payment_method || '').toLowerCase().includes('cod') || (order.payment_method || '').toLowerCase().includes('cash');
  const isPaidOnline = order.payment_status === 'PAYMENT_CAPTURED' || order.payment_status === 'ORDER_PAID' || (!isCod && order.status !== 'cancelled');
  const fulfillmentStatus = order.fulfillment_status || 'UNFULFILLED';

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const customerName = order.shipping_address?.name || order.shipping_address?.full_name || 'Valued Customer';
  const customerEmail = order.shipping_address?.email || '';

  // Order progression steps
  const steps = [
    {
      label: 'Order Placed',
      status: 'Completed',
      done: true,
      desc: orderDate,
    },
    {
      label: isCod ? 'Payment on Delivery' : 'Payment Received',
      status: isCod ? 'Pending Delivery' : 'Verified Online',
      done: isPaidOnline,
      desc: isCod ? `₹${(order.total_amount / 100).toFixed(2)} due in cash/UPI` : 'Captured securely via gateway',
    },
    {
      label: 'Processing & Packaging',
      status: fulfillmentStatus === 'PACKED' || fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED' ? 'Ready' : 'In Progress',
      done: fulfillmentStatus === 'PACKED' || fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED',
      desc: 'Quality check & parcel packaging',
    },
    {
      label: 'Out for Delivery',
      status: fulfillmentStatus === 'SHIPPED' ? 'In Transit' : fulfillmentStatus === 'DELIVERED' ? 'Delivered' : 'Pending Dispatch',
      done: fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED',
      desc: order.carrier ? `Via ${order.carrier}` : 'Dispatched via express courier',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between">
      {/* ── Minimal Top Header (Distraction-Free) ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link to="/store" className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 w-auto max-w-[120px] object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {storeInitial}
              </div>
            )}
            <span className="font-extrabold text-sm tracking-tight text-stone-900 font-serif">
              {storeName}
            </span>
          </Link>

          <Link
            to="/store"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Main Order Confirmation Body ── */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Confirmation Hero & Status (7 cols) ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
                    Thank you, {customerName.split(' ')[0]}!
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Your order has been placed and confirmed.
                  </p>
                </div>
              </div>

              {/* Order Reference Pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500">Order Reference:</span>
                  <span className="font-mono text-xs font-bold text-stone-900">#{order.order_number}</span>
                </div>
                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Number'}</span>
                </button>
              </div>

              {customerEmail && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-600 min-w-0">
                    <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span className="truncate">Order receipt sent to <strong className="text-stone-800 font-semibold">{customerEmail}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendReceipt}
                    disabled={isResendingReceipt || resendCooldown > 0}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex-shrink-0 self-start sm:self-auto"
                  >
                    {isResendingReceipt ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-600" /> : <Mail className="w-3.5 h-3.5 text-stone-600" />}
                    <span>
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : isResendingReceipt
                        ? 'Sending...'
                        : 'Resend Receipt'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Fulfillment Progression */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-700" />
                  <span>Live Fulfillment Timeline</span>
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  isPaidOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {isCod ? 'Cash on Delivery' : 'Paid Online'}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-4 relative">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      step.done
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-400 border border-stone-200'
                    }`}>
                      {step.done ? <Check className="w-4 h-4 text-white" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${step.done ? 'text-stone-900' : 'text-stone-500'}`}>
                          {step.label}
                        </p>
                        <span className={`text-[10px] font-bold ${step.done ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carrier & Tracking AWB Card (When available) */}
              {order.tracking_number && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">{order.carrier || 'Express Courier'}</p>
                      <p className="text-[11px] font-mono text-stone-600 font-bold flex items-center gap-1.5 mt-0.5">
                        AWB: {order.tracking_number}
                        <button
                          onClick={copyTrackingNumber}
                          className="p-0.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
                          title="Copy Tracking Number"
                        >
                          {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    In Transit
                  </span>
                </div>
              )}
            </div>

            {/* Delivery & Customer Information */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <MapPin className="w-4 h-4 text-stone-700" />
                <span>Delivery Destination</span>
              </h3>

              <div className="text-xs text-stone-600 space-y-1 leading-relaxed">
                <p className="font-bold text-stone-900 text-sm">{customerName}</p>
                <p>{order.shipping_address?.address_line1 || order.shipping_address?.street || order.shipping_address?.line1 || ''}</p>
                <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code || order.shipping_address?.pincode}</p>
                <p>{order.shipping_address?.country || 'India'}</p>
                {order.shipping_address?.phone && (
                  <p className="pt-2 font-medium text-stone-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{order.shipping_address.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Receipt Summary & Actions (5 cols) ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Items & Financial Totals */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
                Order Summary ({order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'})
              </h3>

              {/* Items List */}
              <div className="divide-y divide-stone-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3.5 first:pt-0 last:pb-0">
                    <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 flex-shrink-0 flex items-center justify-center">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-stone-900 truncate font-serif">{item.product_name}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Qty: {item.quantity} &bull; {fmt(item.unit_price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-900 font-mono flex-shrink-0">
                      {fmt(item.total_price || item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-stone-900 font-bold">{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {order.shipping_amount === 0 ? 'FREE' : fmt(order.shipping_amount)}
                  </span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Estimated Tax (GST)</span>
                    <span className="font-mono text-stone-900 font-bold">{fmt(order.tax_amount)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-{fmt(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-stone-200 text-sm font-bold text-stone-900">
                  <span>{isCod ? 'Total Payable on Delivery' : 'Total Paid'}</span>
                  <span className="text-base font-mono font-bold">{fmt(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
              <button
                type="button"
                onClick={() => {
                  generateInvoicePrintWindow({
                    orderNumber: order.order_number || order.id,
                    orderDate: order.created_at,
                    customerName: order.shipping_address?.name || order.shipping_address?.full_name,
                    customerEmail: order.shipping_address?.email,
                    customerPhone: order.shipping_address?.phone,
                    shippingAddress: order.shipping_address,
                    items: order.items.map(i => ({
                      name: i.product_name,
                      quantity: i.quantity,
                      unitPrice: i.unit_price,
                      totalPrice: i.total_price || i.unit_price * i.quantity,
                    })),
                    subtotal: order.subtotal,
                    tax: order.tax_amount,
                    shipping: order.shipping_amount,
                    discount: order.discount_amount,
                    total: order.total_amount,
                    paymentMethod: isCod ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)',
                    storeName: storeName
                  });
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                <span>Download / Print Invoice</span>
              </button>

              <Link
                to="/store"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard/orders"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors text-center"
              >
                <span>View in Account Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Minimal Footer (No clutter) ── */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-400 space-y-1">
        <p>Need help with your order? Contact our concierge team at <strong className="text-stone-700">{storeName}</strong>.</p>
        <p>&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default OrderConfirmationPage;
