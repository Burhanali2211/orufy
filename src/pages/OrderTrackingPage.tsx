import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, MapPin,
  ArrowRight, AlertCircle,
  Copy, Check, Search, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackingOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  carrier?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  items: OrderItem[];
}

const fmt = (n: number) =>
  `₹${Number((n || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // Lookup form state
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [identifierInput, setIdentifierInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Active tracking state
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId, token);
    }
  }, [orderId, token]);

  const fetchOrderById = async (id: string, trackingToken?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/customer/orders/${id}${trackingToken ? `?token=${encodeURIComponent(trackingToken)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || 'Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim() || !identifierInput.trim()) {
      setLookupError('Please enter both Order Number and Email or Phone Number');
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);
      const res = await fetch('/api/customer/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumberInput.trim(),
          emailOrPhone: identifierInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found');
      }

      // Fetch full order with the returned tracking token
      await fetchOrderById(data.orderId, data.trackingToken);
    } catch (err: any) {
      setLookupError(err.message || 'Order lookup failed');
    } finally {
      setLookupLoading(false);
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

  const fulfillmentStatus = order?.fulfillment_status || 'UNFULFILLED';
  const isPaid = order?.payment_status === 'PAYMENT_CAPTURED' || order?.payment_status === 'ORDER_PAID';

  const steps = [
    { key: 'RECEIVED', label: 'Order Placed', done: true, desc: 'Received & verified' },
    { key: 'PAID', label: 'Payment Confirmed', done: isPaid, desc: isPaid ? 'Payment received' : 'Payment pending' },
    { key: 'PACKED', label: 'Packed', done: fulfillmentStatus === 'PACKED' || fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED', desc: 'Ready for dispatch' },
    { key: 'SHIPPED', label: 'Shipped', done: fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED', desc: order?.carrier ? `Via ${order.carrier}` : 'In transit' },
    { key: 'DELIVERED', label: 'Delivered', done: fulfillmentStatus === 'DELIVERED', desc: 'Package arrived' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Track Your Order</h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            View live progression, courier details, and fulfillment updates in real-time.
          </p>
        </div>

        {/* Lookup Form (Always accessible) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-700" />
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Lookup Order</h2>
          </div>

          <form onSubmit={handleLookupSubmit} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Order Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. ORD-123456-789"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email or Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. yourname@gmail.com or 9876543210"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 pt-1">
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {lookupLoading ? <></> : <Search className="w-4 h-4" />}
                <span>Track Order →</span>
              </button>
            </div>
          </form>

          {lookupError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}
        </div>

        {/* Loading Active Order */}
        {loading && (
          <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/80 shadow-sm">
            <></>
            <p className="text-xs text-stone-500">Retrieving live tracking updates...</p>
          </div>
        )}

        {/* Order Details & Timeline (When loaded) */}
        {!loading && order && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Live Timeline Progression */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-stone-800 font-bold">
                    <span>Order #{order.order_number}</span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-900 transition-colors"
                      title="Copy"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-stone-900 text-white">
                  {fulfillmentStatus === 'DELIVERED' ? 'Delivered' : fulfillmentStatus === 'SHIPPED' ? 'In Transit' : fulfillmentStatus === 'PACKED' ? 'Packed' : 'Processing'}
                </span>
              </div>

              {/* Goal-Gradient Step Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
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

              {/* Courier & AWB Banner */}
              {order.tracking_number && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-blue-900">
                        Courier: {order.carrier || 'Standard Courier'}
                      </div>
                      <div className="font-mono text-xs text-blue-700 font-semibold flex items-center gap-1.5 mt-0.5">
                        AWB: {order.tracking_number}
                        <button
                          onClick={copyTrackingNumber}
                          className="p-0.5 hover:bg-blue-200 rounded text-blue-800 transition-colors"
                          title="Copy AWB"
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

            {/* Items in Order */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Ordered Items</h3>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item) => (
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

              <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-xs">
                <span className="text-stone-500">Total Paid</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
