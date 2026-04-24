import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, Package, MapPin, CreditCard,
  Truck, ArrowRight, ShoppingBag, Copy, Check, Loader2, AlertCircle
} from 'lucide-react';
import { useOrders } from '../contexts/OrderContext';

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
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: any;
  created_at: string;
  items: OrderItem[];
}

const fmt = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const orderData = await getOrderById(orderId);
      if (!orderData) throw new Error('Order not found');

      setOrder({
        id: orderData.id,
        order_number: orderData.orderNumber,
        status: orderData.status,
        payment_status: orderData.paymentStatus,
        payment_method: orderData.paymentMethod ?? '',
        subtotal: Number(orderData.subtotal || 0),
        tax_amount: Number(orderData.taxAmount || 0),
        shipping_amount: Number(orderData.shippingFee || 0),
        discount_amount: Number(orderData.discountAmount || 0),
        total_amount: Number(orderData.total),
        shipping_address: orderData.shippingAddress,
        created_at: typeof orderData.createdAt === 'string' ? orderData.createdAt : orderData.createdAt.toISOString(),
        items: (orderData.items || []).map((i: any) => ({
          id: i.id,
          product_name: i.name || 'Product',
          product_image: i.image || '',
          quantity: i.quantity,
          unit_price: Number(i.price || 0),
          total_price: Number(i.quantity) * Number(i.price || 0),
        })),
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-stone-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="w-full bg-stone-600 text-white py-3 rounded-xl font-semibold hover:bg-stone-700 transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const addr = order.shipping_address || {};
  const isCOD = order.payment_method?.toLowerCase().includes('cash') ||
    order.payment_method?.toLowerCase() === 'cod';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Success banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm mb-4">
            Thank you for your purchase. {isCOD
              ? 'Pay when your order arrives.'
              : 'Payment received successfully.'}
          </p>

          {/* Order number copy */}
          <button
            onClick={copyOrderNumber}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            <span className="font-mono font-semibold text-gray-800 text-sm">
              #{order.order_number}
            </span>
            {copied
              ? <Check className="w-4 h-4 text-green-600" />
              : <Copy className="w-4 h-4 text-gray-500" />}
          </button>
          <p className="text-xs text-gray-400 mt-2">Tap to copy order number</p>
        </motion.div>

        {/* Payment status badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
            isCOD
              ? 'bg-amber-50 border-amber-200'
              : order.payment_status === 'paid'
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <CreditCard className={`w-5 h-5 flex-shrink-0 ${
            isCOD ? 'text-amber-600' : order.payment_status === 'paid' ? 'text-green-600' : 'text-blue-600'
          }`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {isCOD ? 'Cash on Delivery' : order.payment_method}
            </p>
            <p className="text-xs text-gray-500">
              {isCOD
                ? 'Pay ₹' + order.total_amount.toLocaleString('en-IN') + ' when order arrives'
                : order.payment_status === 'paid'
                ? 'Payment confirmed'
                : 'Payment pending'}
            </p>
          </div>
          <span className="font-bold text-gray-900">{fmt(order.total_amount)}</span>
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <Package className="w-5 h-5 text-stone-600" />
            <h2 className="font-semibold text-gray-900">
              {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'} Ordered
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmt(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-sm text-gray-900 flex-shrink-0">
                  {fmt(item.total_price)}
                </p>
              </div>
            ))}
          </div>

          {/* Price summary */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (18%)</span>
                <span>{fmt(order.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{order.shipping_amount > 0 ? fmt(order.shipping_amount) : 'FREE'}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>−{fmt(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-stone-600">{fmt(order.total_amount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Shipping address */}
        {(addr.streetAddress || addr.street_address || addr.street) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-stone-600" />
              <h2 className="font-semibold text-gray-900">Delivering to</h2>
            </div>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-medium text-gray-900">
                {addr.fullName || addr.full_name || addr.name}
              </p>
              <p>{addr.streetAddress || addr.street_address || addr.street}</p>
              <p>
                {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode || addr.postal_code || addr.zipCode}
              </p>
              <p>{addr.country || 'India'}</p>
              {(addr.phone || addr.phoneNumber) && (
                <p className="pt-1 text-gray-500">{addr.phone || addr.phoneNumber}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Estimated delivery */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3"
        >
          <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Estimated Delivery</p>
            <p className="text-xs text-blue-600">3–7 business days from today</p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Link
            to={`/track-order/${order.id}`}
            className="w-full flex items-center justify-center gap-2 bg-stone-600 hover:bg-stone-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
          >
            <Truck className="w-5 h-5" />
            Track My Order
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 py-3.5 rounded-xl font-semibold border border-gray-200 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default OrderConfirmationPage;
