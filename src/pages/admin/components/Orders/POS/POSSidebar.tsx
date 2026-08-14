import React from 'react';
import { User, CreditCard } from 'lucide-react';

interface POSSidebarProps {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  setCustomer: (customer: any) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  subtotal: number;
  discount: number;
  setDiscount: (discount: number) => void;
  total: number;
  handleCheckout: () => void;
  submitting: boolean;
  cartLength: number;
}

export const POSSidebar: React.FC<POSSidebarProps> = ({
  customer,
  setCustomer,
  paymentMethod,
  setPaymentMethod,
  subtotal,
  discount,
  setDiscount,
  total,
  handleCheckout,
  submitting,
  cartLength
}) => {
  return (
    <div className="w-full lg:w-[400px] bg-white border-l border-gray-100 p-6 flex flex-col shadow-2xl">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <User className="h-5 w-5 text-amber-600" />
        Customer Details
      </h3>
      
      <div className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Customer Name"
          value={customer.name}
          onChange={(e) => setCustomer((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
        <input
          type="email"
          placeholder="Email (Optional)"
          value={customer.email}
          onChange={(e) => setCustomer((prev: any) => ({ ...prev, email: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={customer.phone}
          onChange={(e) => setCustomer((prev: any) => ({ ...prev, phone: e.target.value }))}
          className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-amber-600" />
        Payment Method
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
        {['Cash', 'Card', 'UPI', 'Other'].map(method => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method)}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
              paymentMethod === method 
                ? 'border-amber-600 bg-amber-50 text-amber-700 font-bold' 
                : 'border-gray-100 hover:border-gray-200 text-gray-600'
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 mb-6">
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold">₹{(subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Discount</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-red-600">-₹</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, parseInt(e.target.value) || 0))}
                className="w-20 text-right bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-amber-600">₹{(total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={cartLength === 0 || submitting}
        className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-amber-200 active:scale-[0.98]"
      >
        {submitting ? 'Creating Order...' : 'Complete Sale'}
      </button>
    </div>
  );
};

