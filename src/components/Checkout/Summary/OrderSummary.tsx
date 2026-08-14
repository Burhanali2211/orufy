import React from 'react';
import { Shield, Truck } from 'lucide-react';

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  gst: number;
  shipping: number;
  finalTotal: number;
  showFeatures?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  itemCount,
  subtotal,
  gst,
  shipping,
  finalTotal,
  showFeatures = false
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Items ({itemCount})</span>
          <span>₹{(subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span>₹{(gst / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-green-600 font-medium">FREE</span>
            ) : (
              `₹${(shipping / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            )}
          </span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 text-gray-900">
          <span>Total</span>
          <span className="text-stone-600">₹{(finalTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      {showFeatures && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5" /> Secure Checkout
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Truck className="h-3.5 w-3.5" /> Fast Shipping
          </div>
        </div>
      )}
    </div>
  );
};
