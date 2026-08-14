import React from 'react';
import { CreditCard, Banknote } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (method: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selectedMethod, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-stone-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Payment Method</h2>
          <p className="text-xs text-gray-500">How would you like to pay?</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <button
          onClick={() => onSelect('razorpay')}
          className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-colors ${
            selectedMethod === 'razorpay' ? 'border-stone-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Online Payment</div>
              <div className="text-xs text-gray-500 mt-0.5">UPI, Cards, Net Banking via Razorpay</div>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selectedMethod === 'razorpay' ? 'border-stone-600 bg-stone-600' : 'border-gray-300'
          }`}>
            {selectedMethod === 'razorpay' && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        </button>

        <button
          onClick={() => onSelect('cod')}
          className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-colors ${
            selectedMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Cash on Delivery</div>
              <div className="text-xs text-gray-500 mt-0.5">Pay when your order arrives</div>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selectedMethod === 'cod' ? 'border-green-600 bg-green-600' : 'border-gray-300'
          }`}>
            {selectedMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        </button>
      </div>
    </div>
  );
};
