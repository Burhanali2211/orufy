import React from 'react';
import { Package, Banknote, CreditCard } from 'lucide-react';
import { CartItem } from '../../../types';
import { ShippingInfo } from '../types';

interface ReviewOrderProps {
  items: CartItem[];
  itemCount: number;
  formData: ShippingInfo;
  selectedPaymentMethod: string;
  onEditShipping: () => void;
  onEditPayment: () => void;
}

export const ReviewOrder: React.FC<ReviewOrderProps> = ({
  items,
  itemCount,
  formData,
  selectedPaymentMethod,
  onEditShipping,
  onEditPayment
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
          <Package className="h-4 w-4 text-stone-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Review Your Order</h2>
          <p className="text-xs text-gray-500">Check everything before placing</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Items ({itemCount})</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                ₹{((item.product.price * item.quantity) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping recap */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Shipping Address</span>
          <button onClick={onEditShipping} className="text-xs text-stone-600 font-medium">Edit</button>
        </div>
        <p className="text-sm text-gray-900 font-medium">{formData.firstName} {formData.lastName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formData.address}</p>
        <p className="text-xs text-gray-500">{formData.city}, {formData.state} {formData.zipCode}</p>
        <p className="text-xs text-gray-500">{formData.phone}</p>
      </div>

      {/* Payment recap */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Payment</span>
          <button onClick={onEditPayment} className="text-xs text-stone-600 font-medium">Edit</button>
        </div>
        <div className="flex items-center gap-2">
          {selectedPaymentMethod === 'cod'
            ? <><Banknote className="h-4 w-4 text-green-600" /><span className="text-sm text-gray-900">Cash on Delivery</span></>
            : <><CreditCard className="h-4 w-4 text-stone-600" /><span className="text-sm text-gray-900">Online Payment (Razorpay)</span></>
          }
        </div>
      </div>
    </div>
  );
};
