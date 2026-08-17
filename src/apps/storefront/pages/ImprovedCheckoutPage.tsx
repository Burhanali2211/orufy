import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  MapPin,
  CreditCard,
  ShoppingBag,
  Truck,
  Shield,
  Banknote,
  ChevronRight
} from 'lucide-react';
import { useCart } from '@/shared/contexts/CartContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { RazorpayPayment } from '@/shared/components/Payment/RazorpayPayment';
import { apiClient } from '@/shared/lib/apiClient';

const SHIPPING_INFO_KEY = 'checkout_shipping_info';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Reusable labeled field
const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full px-4 py-3 rounded-xl border-none text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all bg-gray-100 hover:bg-gray-200/50 shadow-none';

export const ImprovedCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSavedShippingInfo = (): ShippingInfo => {
    try {
      const saved = localStorage.getItem(SHIPPING_INFO_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      firstName: '', lastName: '', email: user?.email || '',
      phone: '', address: '', city: '', state: '', zipCode: '', country: 'India',
    };
  };

  const [formData, setFormData] = useState<ShippingInfo>(loadSavedShippingInfo());

  useEffect(() => {
    if (formData.firstName || formData.address) {
      try { localStorage.setItem(SHIPPING_INFO_KEY, JSON.stringify(formData)); } catch {}
    }
  }, [formData]);

  const subtotal = total;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const freeShippingThreshold = 999;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 99;
  const finalTotal = subtotal + gst + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missing = required.filter(field => !formData[field as keyof ShippingInfo]);
      if (missing.length > 0) {
        showNotification({ type: 'error', title: 'Missing Information', message: 'Please fill in all required fields.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
        return false;
      }
    }
    return true;
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await clearCart();
    localStorage.removeItem(SHIPPING_INFO_KEY);
    if (orderId) {
      navigate(`/order-confirmation/${orderId}`, { replace: true });
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(step)) return;

    if (!user) {
      showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in or sign up to place an order.' });
      return;
    }

    setIsProcessing(true);
    try {
      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        streetAddress: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
      };

      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random()}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };
      const token = apiClient.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const storeHost = apiClient.getStoreHostname();
      if (storeHost) {
        headers['x-store-hostname'] = storeHost;
      }

      const res = await fetch('/api/platform/payment/checkout/orders', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            variantId: i.variantId || null,
          })),
          shippingAddress,
          billingAddress: shippingAddress,
          paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'card',
          notes: '',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      const createdOrder = data.order;
      setOrderId(createdOrder.id);

      if (selectedPaymentMethod === 'cod' || !createdOrder.razorpayOrderId) {
        await clearCart();
        localStorage.removeItem(SHIPPING_INFO_KEY);
        navigate(`/order-confirmation/${createdOrder.id}`, { replace: true });
      } else {
        setRazorpayOrderId(createdOrder.razorpayOrderId);
        setRazorpayKeyId(createdOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID);
        setShowPaymentModal(true);
      }
    } catch (error: any) {
      showNotification({ type: 'error', title: 'Checkout Notice', message: error.message || 'Unable to place order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/products')} className="btn-primary">Continue Shopping</button>
        </div>
      </div>
    );
  }

  const stepLabels = ['Shipping', 'Payment', 'Review'];

  return (
    <>
      {/* ── Fixed top header ── */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors py-1"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-base font-bold text-gray-900">Checkout</h1>
            <div className="w-12" />
          </div>

          {/* Stepper bar */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-stone-900 transition-all duration-300 z-0"
              style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
            />
            {stepLabels.map((label, index) => {
              const stepNum = index + 1;
              const isCompleted = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={label} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isCompleted
                        ? 'bg-stone-900 text-white'
                        : isCurrent
                        ? 'bg-stone-900 text-white ring-4 ring-stone-100'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepNum}
                  </div>
                  <span className={`text-[11px] mt-1 font-medium ${isCurrent ? 'text-stone-900 font-semibold' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content (padded for fixed header & footer) ── */}
      <div className="min-h-screen bg-gray-50 pt-28 pb-36 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* ── STEP 1: Shipping Address ── */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="h-5 w-5 text-stone-700" />
                  <h2 className="font-semibold text-gray-900">Contact & Delivery Address</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" required>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First name" className={inputClass} />
                  </Field>
                  <Field label="Last Name" required>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last name" className={inputClass} />
                  </Field>
                </div>

                <Field label="Email Address" required>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" className={inputClass} />
                </Field>

                <Field label="Phone Number" required>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" className={inputClass} />
                </Field>

                <Field label="Street Address" required>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Flat / House no., Building, Street" className={inputClass} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className={inputClass} />
                  </Field>
                  <Field label="State" required>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="PIN Code" required>
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="PIN / Postal Code" className={inputClass} />
                  </Field>
                  <Field label="Country">
                    <input type="text" name="country" value={formData.country} onChange={handleInputChange} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                  </Field>
                </div>
              </div>

              {/* Delivery estimate card */}
              <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3">
                <Truck className="h-5 w-5 text-stone-700 flex-shrink-0" />
                <div className="text-xs text-stone-700">
                  <span className="font-semibold block text-stone-900">Standard Delivery (3–5 Business Days)</span>
                  {subtotal >= freeShippingThreshold ? 'FREE on orders above ₹999' : '₹99 standard rate applied'}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Payment Method ── */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <CreditCard className="h-5 w-5 text-stone-700" />
                  <h2 className="font-semibold text-gray-900">Choose Payment Method</h2>
                </div>

                {/* Razorpay option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'razorpay'
                      ? 'border-stone-900 bg-stone-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={selectedPaymentMethod === 'razorpay'}
                    onChange={() => setSelectedPaymentMethod('razorpay')}
                    className="mt-0.5 text-stone-900 focus:ring-stone-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">Online Payment (UPI, Cards, Netbanking)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Secure, instant payment powered by Razorpay</p>
                  </div>
                </label>

                {/* Cash on Delivery option */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-stone-900 bg-stone-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={selectedPaymentMethod === 'cod'}
                    onChange={() => setSelectedPaymentMethod('cod')}
                    className="mt-0.5 text-stone-900 focus:ring-stone-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                        Cash on Delivery
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Pay in cash when your order arrives</p>
                  </div>
                </label>
              </div>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-1">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>256-bit SSL encrypted · Safe & Secure Checkout</span>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Order Review ── */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Delivery address summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deliver To</span>
                  <button onClick={() => setStep(1)} className="text-xs font-medium text-stone-700 hover:underline">Change</button>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formData.firstName} {formData.lastName}</p>
                <p className="text-xs text-gray-600 mt-0.5">{formData.address}, {formData.city}, {formData.state} - {formData.zipCode}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formData.phone} · {formData.email}</p>
              </div>

              {/* Items summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items in Order</span>
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-900">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">FREE</span> : `₹${shipping}`}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ── Fixed bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-gray-500 block">Total Due</span>
            <span className="text-lg font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => { if (validateStep(step)) setStep(step + 1); }}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95"
              >
                <span>{step === 1 ? 'Continue to Payment' : 'Review Order'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full hidden" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Place Order</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Razorpay Payment Modal (if online payment) ── */}
      {showPaymentModal && orderId && razorpayOrderId && (
        <RazorpayPayment
          orderId={orderId}
          amount={finalTotal}
          razorpayOrderId={razorpayOrderId}
          items={items}
          customerInfo={{
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
          }}
          shippingAddress={{
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'India',
          }}
          onSuccess={handlePaymentSuccess}
          onError={(err) => {
            setShowPaymentModal(false);
            showNotification({ type: 'error', title: 'Payment Notice', message: err || 'Payment was not completed.' });
          }}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default ImprovedCheckoutPage;

