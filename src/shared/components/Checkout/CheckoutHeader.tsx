import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface CheckoutHeaderProps {
  step: number;
  onBack: () => void;
  stepLabels: string[];
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ step, onBack, stepLabels }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors py-1"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-base font-bold text-gray-900">Checkout</h1>
          <span className="text-sm text-gray-500 font-medium">Step {step}/3</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const isActive = num === step;
            const isDone = num < step;
            return (
              <React.Fragment key={num}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                    isDone ? 'bg-stone-600 text-white' : isActive ? 'bg-stone-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-3 h-3" /> : num}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-stone-600' : isDone ? 'text-stone-400' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors ${num < step ? 'bg-stone-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
