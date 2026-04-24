import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Smartphone, Building, Wallet, Banknote, 
  Shield, CheckCircle, X, Lock, ArrowRight, Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { CartItem } from '../../types';
import { loadRazorpayScript, getRazorpayInstance } from '../../utils/loadRazorpay';
import { apiClient } from '../../lib/apiClient';

interface RazorpayPaymentProps {
  amount: number;       // final total to charge (already includes GST + shipping)
  subtotal?: number;    // for display only
  gstAmount?: number;   // for display only
  shippingAmount?: number; // for display only
  items: CartItem[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  razorpayOrderId?: string;
  orderId?: string;     // DB order ID for payment status update
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  subtotal,
  gstAmount,
  shippingAmount,
  items,
  customerInfo,
  shippingAddress,
  razorpayOrderId,
  orderId,
  onSuccess,
  onError,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const { showNotification } = useNotification();

  // Use passed breakdown for display; `amount` is the verified final total to charge
  const displaySubtotal = subtotal ?? amount;
  const displayGst = gstAmount ?? 0;
  const displayShipping = shippingAmount ?? 0;
  const total = amount;

  const paymentMethods = [
    { id: 'card', name: 'Card', description: 'Debit/Credit', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'upi', name: 'UPI', description: 'GPay, PhonePe', icon: Smartphone, color: 'from-green-500 to-green-600' },
    { id: 'netbanking', name: 'Net Banking', description: 'All banks', icon: Building, color: 'from-purple-500 to-purple-600' },
    { id: 'wallet', name: 'Wallet', description: 'Paytm, etc', icon: Wallet, color: 'from-orange-500 to-orange-600' }
  ];

  useEffect(() => {
    loadRazorpayScript().catch((error) => {
      console.error('Failed to preload Razorpay script:', error);
    });
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      await loadRazorpayScript();

      let razorpayOrderIdToUse = razorpayOrderId;

      if (!razorpayOrderIdToUse) {
        const data = await apiClient.post<{ orderId: string, key: string }>('/dashboard/billing/create-order', {
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            items_count: items.length,
            payment_method: selectedMethod
          }
        });
        
        if (!data?.orderId) {
          throw new Error('Failed to create payment order');
        }
        razorpayOrderIdToUse = data.orderId;
      }

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error('Payment service not configured. Please add VITE_RAZORPAY_KEY_ID.');
      }

      const options: any = {
        key: razorpayKeyId,
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'Sufi Essences',
        description: `Payment for ${items.length} item(s)`,
        order_id: razorpayOrderIdToUse,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        notes: {
          shipping_address: `${shippingAddress.street}, ${shippingAddress.city}`,
          payment_method: selectedMethod
        },
        theme: { color: '#7C3AED' },
        method: selectedMethod !== 'card' ? selectedMethod : undefined,
        handler: async function (response: any) {
          try {
            const verifyData = await apiClient.post<{ success: boolean }>('/dashboard/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId
            });

            if (verifyData.success) {
              onSuccess(response.razorpay_payment_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error: any) {
            setIsProcessing(false);
            onError(error.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            showNotification({
              type: 'info',
              title: 'Payment Cancelled',
              message: 'You can try again when ready'
            });
          }
        }
      };

      const razorpayInstance = await getRazorpayInstance(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        onError(response.error.description || 'Payment failed');
      });
      razorpayInstance.open();

    } catch (error: any) {
      setIsProcessing(false);
      onError(error.message || 'Failed to initiate payment');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full mx-auto"
    >
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 px-6 py-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWNkg0djJoMzJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Secure Payment</h2>
              <p className="text-purple-200 text-xs">256-bit SSL encryption</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">Amount to Pay</p>
          <p className="text-4xl font-bold text-white mt-1">₹{total.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({items.length} items)</span>
              <span className="font-medium">₹{displaySubtotal.toLocaleString('en-IN')}</span>
            </div>
            {displayGst > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-medium">₹{displayGst.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className={`font-medium ${displayShipping === 0 ? 'text-green-600' : ''}`}>
                {displayShipping === 0 ? 'FREE' : `₹${displayShipping}`}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Payment Method</h3>
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    relative p-3 rounded-xl border-2 transition-all duration-200 text-center
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/10' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`
                    w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center
                    ${isSelected ? `bg-gradient-to-br ${method.color}` : 'bg-gray-100'}
                  `}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-xs font-medium text-gray-900">{method.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6 py-3 bg-gray-50 rounded-xl">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Secured by Razorpay</span>
          <span className="text-gray-300">|</span>
          <span>PCI DSS Compliant</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handlePayment}
          disabled={isProcessing}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold text-white
            flex items-center justify-center gap-2 shadow-lg
            ${isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
            }
            transition-all duration-200
          `}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Pay ₹{total.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Cancel and go back
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </motion.div>
  );
};
