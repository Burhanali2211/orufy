import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Package, MapPin, CreditCard,
  Truck, ArrowRight, ShoppingBag, Copy, Check, AlertCircle, Sparkles
} from 'lucide-react';

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

const fmt = (n: number) =>
  `₹${Number((n || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, token]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/customer/orders/${orderId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      const res = await fetch(url);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <></>
          <p className="text-stone-600 text-sm font-medium">Securing and fetching your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-stone-200 space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Order Verification Needed</h2>
          <p className="text-stone-500 text-xs leading-relaxed">{error || 'Unable to access order details.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/order/track"
              className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Look Up Order by Email / Phone →
            </Link>
            <Link
              to="/"
              className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-200 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fulfillmentStatus = order.fulfillment_status || 'UNFULFILLED';
  const isPaid = order.payment_status === 'PAYMENT_CAPTURED' || order.payment_status === 'ORDER_PAID' || order.payment_method === 'cod';

  const steps = [
    { key: 'RECEIVED', label: 'Order Confirmed', done: true, desc: 'Received & verified' },
    { key: 'PAID', label: 'Payment Received', done: isPaid, desc: isPaid ? 'Captured securely' : 'Pending payment' },
    { key: 'PACKED', label: 'Packed & Prepared', done: fulfillmentStatus === 'PACKED' || fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED', desc: 'Carefully packaged' },
    { key: 'SHIPPED', label: 'Shipped & In Transit', done: fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED', desc: order.carrier ? `Via ${order.carrier}` : 'Queued for dispatch' },
    { key: 'DELIVERED', label: 'Delivered', done: fulfillmentStatus === 'DELIVERED', desc: fulfillmentStatus === 'DELIVERED' ? 'Successfully delivered' : 'Final destination' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm text-center space-y-4"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Thank you for your order!</h1>
            <p className="text-stone-500 text-xs mt-1">
              Your order from <strong className="text-stone-800 font-semibold">{store?.name || 'our store'}</strong> has been placed.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100/80 rounded-xl text-xs font-mono text-stone-800">
            <span>Order #{order.order_number}</span>
            <button
              onClick={copyOrderNumber}
              className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-900 transition-colors"
              title="Copy Order Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>

        {/* Consumer Goal-Gradient Fulfillment Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Live Order Progression</h2>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-stone-900 text-white">
              {fulfillmentStatus === 'DELIVERED' ? 'Delivered' : fulfillmentStatus === 'SHIPPED' ? 'In Transit' : fulfillmentStatus === 'PACKED' ? 'Packed' : 'Processing'}
            </span>
          </div>

          {/* Goal-Gradient Visible Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={`p-3 rounded-2xl border transition-all text-left space-y-1 ${
                  step.done
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50 text-stone-400 border-stone-200/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Step {idx + 1}</span>
                  {step.done && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className={`text-xs font-semibold ${step.done ? 'text-white' : 'text-stone-700'}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] ${step.done ? 'text-stone-300' : 'text-stone-400'}`}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Carrier & Tracking AWB Card (When available) */}
          {order.tracking_number && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-900">
                    Carrier: {order.carrier || 'Standard Courier'}
                  </div>
                  <div className="font-mono text-xs text-blue-700 font-semibold flex items-center gap-1.5 mt-0.5">
                    AWB: {order.tracking_number}
                    <button
                      onClick={copyTrackingNumber}
                      className="p-0.5 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                      title="Copy Tracking Number"
                    >
                      {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-blue-600 font-medium">
                Package in transit
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Summary */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Items Purchased */}
          <div className="sm:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Ordered Items</h3>
            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-3.5 first:pt-0 last:pb-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200/80 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{item.product_name}</h4>
                    <p className="text-[11px] text-stone-500">Qty: {item.quantity} × {fmt(item.unit_price)}</p>
                  </div>
                  <div className="text-xs font-bold text-stone-900 font-mono">
                    {fmt(item.total_price || item.unit_price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-stone-100 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span className="font-mono text-stone-800">{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Estimated Tax</span>
                <span className="font-mono text-stone-800">{fmt(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Shipping</span>
                <span className="font-mono text-emerald-600 font-semibold">{order.shipping_amount === 0 ? 'Free' : fmt(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-100">
                <span>Total Paid</span>
                <span className="font-mono">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>Delivery Address</span>
            </h3>
            <div className="text-xs text-stone-600 space-y-1 leading-relaxed">
              <p className="font-bold text-stone-900">{order.shipping_address?.name || order.shipping_address?.full_name || 'Customer'}</p>
              <p>{order.shipping_address?.address_line1 || order.shipping_address?.street || order.shipping_address?.line1 || ''}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code || order.shipping_address?.pincode}</p>
              {order.shipping_address?.phone && <p className="font-mono text-stone-500 mt-2">📞 {order.shipping_address.phone}</p>}
            </div>

            <div className="pt-4 border-t border-stone-100">
              <Link
                to="/"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
