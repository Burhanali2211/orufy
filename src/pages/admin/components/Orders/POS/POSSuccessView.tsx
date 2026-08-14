import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface POSSuccessViewProps {
  successOrder: {
    order_number: string;
    total_amount: number;
    payment_method: string;
  };
  onNewOrder: () => void;
}

export const POSSuccessView: React.FC<POSSuccessViewProps> = ({ successOrder, onNewOrder }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h2>
        <p className="text-gray-500 mb-6">Order #{successOrder.order_number} has been created and marked as paid.</p>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Total Amount:</span>
            <span className="font-bold text-gray-900">₹{(Number(successOrder.total_amount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment:</span>
            <span className="font-medium text-gray-900">{successOrder.payment_method}</span>
          </div>
        </div>

        <button 
          onClick={onNewOrder}
          className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
        >
          Create New Order
        </button>
      </div>
    </div>
  );
};

