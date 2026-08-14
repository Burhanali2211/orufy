import React from 'react';
import { ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface CheckoutBottomBarProps {
  step: number;
  isProcessing: boolean;
  finalTotal: number;
  onBack: () => void;
  onContinue: () => void;
  onPlaceOrder: () => void;
}

export const CheckoutBottomBar: React.FC<CheckoutBottomBarProps> = ({
  step,
  isProcessing,
  finalTotal,
  onBack,
  onContinue,
  onPlaceOrder
}) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Primary action */}
        {step === 1 && (
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-600 hover:bg-stone-700 text-white font-semibold text-sm transition-colors"
          >
            Continue to Payment
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {step === 2 && (
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-600 hover:bg-stone-700 text-white font-semibold text-sm transition-colors"
          >
            Review Order
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {step === 3 && (
          <button
            onClick={onPlaceOrder}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-600 hover:bg-stone-700 disabled:bg-stone-400 text-white font-semibold text-sm transition-colors"
          >
            {isProcessing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full hidden" />Processing...</>
            ) : (
              <><CheckCircle className="h-4 w-4" />Place Order — ₹{(finalTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
