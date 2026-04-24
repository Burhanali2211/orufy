import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Package,
  Edit2,
  CheckCircle,
  Truck,
  Shield,
  Banknote
} from 'lucide-react';
import { MobileFormInput, MobileSecurityIndicator } from './MobileCheckout';

// Indian states for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu and Kashmir', 'Ladakh', 'Delhi', 'Puducherry', 'Chandigarh'
];

interface MobileShippingFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: Record<string, string>;
}

export const MobileShippingForm: React.FC<MobileShippingFormProps> = ({
  formData,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <MobileSecurityIndicator />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          Delivery Address
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MobileFormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              placeholder="John"
              required
              error={errors.firstName || ''}
            />
            <MobileFormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              placeholder="Doe"
              required
              error={errors.lastName || ''}
            />
          </div>

          <MobileFormInput
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="john@example.com"
            required
            error={errors.email || ''}
            icon={Mail}
          />

          <MobileFormInput
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="9876543210"
            required
            error={errors.phone || ''}
            icon={Phone}
          />

          <MobileFormInput
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="123, Main Street, Apartment 4B"
            required
            error={errors.address || ''}
            icon={MapPin}
          />

          <div className="grid grid-cols-2 gap-3">
            <MobileFormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="Mumbai"
              required
              error={errors.city || ''}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={onChange}
                className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all duration-200 touch-manipulation"
              >
                <option value="">Select</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileFormInput
              label="PIN Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={onChange}
              placeholder="400001"
              required
              error={errors.zipCode || ''}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Country</label>
              <input
                type="text"
                value="India"
                disabled
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
        <Truck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-purple-900">Free Delivery on orders ₹2,000+</p>
          <p className="text-xs text-purple-700 mt-0.5">Expected delivery: 3-5 business days</p>
        </div>
      </div>
    </div>
  );
};

interface MobilePaymentFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string>;
  selectedPaymentMethod: string;
}

export const MobilePaymentForm: React.FC<MobilePaymentFormProps> = ({
  formData,
  onChange,
  errors = {},
  selectedPaymentMethod
}) => {
  const [showCVV, setShowCVV] = useState(false);

  // For Razorpay or COD, we don't need card details - Razorpay handles it
  if (selectedPaymentMethod === 'razorpay' || selectedPaymentMethod === 'cod') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          selectedPaymentMethod === 'cod' ? 'bg-green-100' : 'bg-purple-100'
        }`}>
          {selectedPaymentMethod === 'cod' ? (
            <Banknote className="w-8 h-8 text-green-600" />
          ) : (
            <CreditCard className="w-8 h-8 text-purple-600" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
        </h3>
        <p className="text-gray-600 text-sm">
          {selectedPaymentMethod === 'cod' 
            ? 'Pay with cash when your order is delivered to you.'
            : 'You\'ll be redirected to Razorpay\'s secure payment page.'}
        </p>
        
        {/* Trust indicators */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-green-500" />
            <span>100% Secure & Protected</span>
          </div>
        </div>
      </div>
    );
  }

  // Legacy card form (kept for backward compatibility)
  return (
    <div className="space-y-6">
      <MobileSecurityIndicator />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Card Details
        </h2>

        <div className="space-y-4">
          <MobileFormInput
            label="Card Number"
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={onChange}
            placeholder="1234 5678 9012 3456"
            required
            error={errors.cardNumber || ''}
            icon={CreditCard}
          />

          <div className="grid grid-cols-2 gap-3">
            <MobileFormInput
              label="Expiry Date"
              type="text"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={onChange}
              placeholder="MM/YY"
              required
              error={errors.expiryDate || ''}
              icon={Calendar}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                CVV <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showCVV ? 'text' : 'password'}
                  name="cvv"
                  value={formData.cvv}
                  onChange={onChange}
                  placeholder="123"
                  required
                  maxLength={4}
                  className={`
                    w-full px-4 py-4 pl-12 pr-12 text-base bg-gray-50 border border-gray-200 rounded-xl
                    focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white
                    transition-all duration-200 touch-manipulation
                    ${errors.cvv ? 'border-rose-500' : ''}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowCVV(!showCVV)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showCVV ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <MobileFormInput
            label="Name on Card"
            name="cardName"
            value={formData.cardName}
            onChange={onChange}
            placeholder="JOHN DOE"
            required
            error={errors.cardName || ''}
            icon={User}
          />
        </div>
      </div>
    </div>
  );
};

interface MobileOrderSummaryProps {
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  formData?: any;
  selectedPaymentMethod?: string;
  onEditShipping?: () => void;
  onEditPayment?: () => void;
}

export const MobileOrderSummary: React.FC<MobileOrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  total,
  formData,
  selectedPaymentMethod,
  onEditShipping,
  onEditPayment
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Shipping Address Card */}
      {formData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Delivery Address</h3>
            </div>
            {onEditShipping && (
              <button
                onClick={onEditShipping}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
            <p className="text-sm text-gray-600 mt-1">{formData.address}</p>
            <p className="text-sm text-gray-600">{formData.city}, {formData.state} {formData.zipCode}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {formData.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {formData.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Card */}
      {selectedPaymentMethod && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedPaymentMethod === 'cod' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {selectedPaymentMethod === 'cod' ? (
                  <Banknote className="h-4 w-4 text-green-600" />
                ) : (
                  <CreditCard className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900">Payment Method</h3>
            </div>
            {onEditPayment && (
              <button
                onClick={onEditPayment}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            selectedPaymentMethod === 'cod' ? 'bg-green-50' : 'bg-purple-50'
          }`}>
            <CheckCircle className={`h-5 w-5 ${
              selectedPaymentMethod === 'cod' ? 'text-green-600' : 'text-purple-600'
            }`} />
            <div>
              <span className="font-medium text-gray-900">
                {selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedPaymentMethod === 'cod' 
                  ? 'Pay when delivered' 
                  : 'Cards, UPI, Net Banking'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              <p className="text-sm text-gray-500">{items.length} items</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</div>
            <div className="text-xs text-purple-600 font-medium">
              {isExpanded ? 'Hide details' : 'View details'}
            </div>
          </div>
        </button>

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <div className="border-t border-gray-100 p-5 space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id || item.product?.id} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{item.product?.name || 'Product'}</h4>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ₹{item.product?.price ? (Number(item.product.price) * item.quantity).toLocaleString('en-IN') : '0'}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-medium">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-purple-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
