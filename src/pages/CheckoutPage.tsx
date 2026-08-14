import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/ShoppingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/ShoppingContext';
import { useNotification } from '@/contexts/NotificationContext';
import { RazorpayPayment } from '@/components/Payment/RazorpayPayment';


// Modular Components
import { CheckoutHeader } from '@/components/Checkout/CheckoutHeader';
import { ShippingForm } from '@/components/Checkout/Forms/ShippingForm';
import { PaymentMethodSelector } from '@/components/Checkout/Forms/PaymentMethodSelector';
import { OrderSummary } from '@/components/Checkout/Summary/OrderSummary';
import { ReviewOrder } from '@/components/Checkout/Summary/ReviewOrder';
import { CheckoutBottomBar } from '@/components/Checkout/CheckoutBottomBar';
import { ShippingInfo } from '@/components/Checkout/types';

const SHIPPING_INFO_KEY = 'checkout_shipping_info';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
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

  const subtotal = total; // already in paise
  const gst = Math.floor(subtotal * 0.18); // paise
  const freeShippingThreshold = 100000; // 1000 INR
  const shipping = subtotal >= freeShippingThreshold ? 0 : 5000; // 50 INR
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

  const handlePaymentSuccess = async (paymentId: string) => {
    setIsProcessing(true);
    try {
      if (orderId) {
        await supabase.from('orders').update({
          payment_status: 'paid', status: 'confirmed',
          razorpay_payment_id: paymentId, updated_at: new Date().toISOString()
        }).eq('id', orderId);

        setShowPaymentModal(false);
        await clearCart();
        localStorage.removeItem(SHIPPING_INFO_KEY);
        navigate(`/order-confirmation/${orderId}`, { replace: true });
        return;
      }
      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetAddress: formData.address, city: formData.city, state: formData.state,
        postalCode: formData.zipCode, country: formData.country, email: formData.email, phone: formData.phone
      };
      if (!user) {
        showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
        return;
      }
      const orderResult = await createOrder(items, shippingAddress as any,
        selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay', finalTotal, undefined);
      if (orderResult?.orderId) {
        const newOrderId = orderResult.orderId;
        setShowPaymentModal(false);
        await clearCart();
        localStorage.removeItem(SHIPPING_INFO_KEY);
        navigate(`/order-confirmation/${newOrderId}`, { replace: true });
      }
    } catch (error) {
      showNotification({ type: 'error', title: 'Order Failed', message: 'Failed to create order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateStep(step)) return;
    if (selectedPaymentMethod === 'cod') {
      await handlePaymentSuccess('cod_' + Date.now());
    } else {
      setIsProcessing(true);
      try {
        const shippingAddress = {
          fullName: `${formData.firstName} ${formData.lastName}`,
          streetAddress: formData.address, city: formData.city, state: formData.state,
          postalCode: formData.zipCode, country: formData.country, email: formData.email, phone: formData.phone
        };
        if (!user) {
          showNotification({ type: 'error', title: 'Authentication Required', message: 'Please log in to place an order' });
          return;
        }

        // The Express backend creates the order AND the Razorpay order atomically
        const orderResult = await createOrder(items, shippingAddress as any, 'card', finalTotal);
        
        if (orderResult?.orderId) {
          setOrderId(orderResult.orderId);
          if (orderResult.razorpayOrderId) {
            setRazorpayOrderId(orderResult.razorpayOrderId);
          }
          setShowPaymentModal(true);
        } else {
          throw new Error('Failed to create database order');
        }
      } catch (error: any) {
        showNotification({ type: 'error', title: 'Order Failed', message: error.message || 'Failed to create order. Please try again.' });
      } finally {
        setIsProcessing(false);
      }
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
      <CheckoutHeader
        step={step}
        stepLabels={stepLabels}
        onBack={() => step > 1 ? setStep(step - 1) : navigate(-1)}
      />

      <div className="min-h-screen bg-gray-50 pt-[108px] pb-[88px]">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <ShippingForm formData={formData} onChange={handleInputChange} />
                <div className="mt-4">
                  <OrderSummary itemCount={itemCount} subtotal={subtotal} gst={gst} shipping={shipping} finalTotal={finalTotal} showFeatures />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <PaymentMethodSelector selectedMethod={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Delivering to</span>
                    <button onClick={() => setStep(1)} className="text-xs text-stone-600 font-medium font-medium">Edit</button>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
                </div>
                <div className="mt-4">
                  <OrderSummary itemCount={itemCount} subtotal={subtotal} gst={gst} shipping={shipping} finalTotal={finalTotal} />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <ReviewOrder
                  items={items} itemCount={itemCount} formData={formData}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onEditShipping={() => setStep(1)} onEditPayment={() => setStep(2)}
                />
                <div className="mt-3">
                  <OrderSummary itemCount={itemCount} subtotal={subtotal} gst={gst} shipping={shipping} finalTotal={finalTotal} showFeatures />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CheckoutBottomBar
        step={step} isProcessing={isProcessing} finalTotal={finalTotal}
        onBack={() => step > 1 ? setStep(step - 1) : navigate(-1)}
        onContinue={() => validateStep(step) && setStep(step + 1)}
        onPlaceOrder={handlePlaceOrder}
      />

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <RazorpayPayment
            amount={finalTotal} subtotal={subtotal} gstAmount={gst} shippingAmount={shipping} items={items}
            customerInfo={{ name: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone }}
            shippingAddress={{ street: formData.address, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: formData.country }}
            razorpayOrderId={razorpayOrderId || undefined} orderId={orderId || undefined}
            onSuccess={handlePaymentSuccess}
            onError={(err) => { showNotification({ type: 'error', title: 'Payment Failed', message: err }); setShowPaymentModal(false); }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </>
  );
};

export default CheckoutPage;
