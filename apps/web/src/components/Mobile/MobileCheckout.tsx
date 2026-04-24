import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, CreditCard, CheckCircle, Lock, 
  Smartphone, Banknote, Building, Wallet 
} from 'lucide-react';
import { MobileTouchButton } from '../Common/Button';
import { useMobileDetection } from '../../hooks/useMobileGestures';

interface MobileCheckoutProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  onBack: () => void;
  children: React.ReactNode;
  stepTitle: string;
  canProceed: boolean;
  isLoading?: boolean;
}

export const MobileCheckoutLayout: React.FC<MobileCheckoutProps> = ({
  currentStep,
  totalSteps,
  onStepChange,
  onBack,
  children,
  stepTitle,
  canProceed,
  isLoading = false
}) => {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    return <>{children}</>;
  }

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors active:bg-gray-200 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{stepTitle}</h1>
            <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {currentStep}/{totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Mobile-optimized form input component
interface MobileFormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const MobileFormInput: React.FC<MobileFormInputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon
}) => {
  const inputId = name ? `mobile-input-${name}` : undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 rounded-xl
            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white
            transition-all duration-200 placeholder-gray-400
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
            touch-manipulation
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-rose-600" role="alert">{error}</p>
      )}
    </div>
  );
};

// Mobile payment method selector
interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  available: boolean;
  color: string;
}

interface MobilePaymentSelectorProps {
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
}

export const MobilePaymentSelector: React.FC<MobilePaymentSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'razorpay',
      name: 'Online Pay',
      icon: CreditCard,
      description: 'Cards, UPI, Net Banking',
      available: true,
      color: 'purple'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      description: 'Pay when delivered',
      available: true,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Select Payment Method</h3>

      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;
          
          return (
            <motion.button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              disabled={!method.available}
              className={`
                relative p-4 rounded-2xl border-2 transition-all text-left
                ${isSelected
                  ? method.color === 'green'
                    ? 'border-green-500 bg-green-50'
                    : 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}
                touch-manipulation
              `}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className={`w-5 h-5 ${method.color === 'green' ? 'text-green-600' : 'text-purple-600'}`} />
                </div>
              )}
              
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-3
                ${isSelected 
                  ? method.color === 'green' ? 'bg-green-600' : 'bg-purple-600'
                  : 'bg-gray-100'
                }
              `}>
                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
              </div>
              
              <div>
                <div className="font-semibold text-gray-900 text-sm">{method.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{method.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Mobile checkout step navigation
interface MobileStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: (() => void) | undefined;
  onNext: (() => void) | undefined;
  nextLabel?: string;
  canProceed: boolean;
  isLoading?: boolean;
}

export const MobileStepNavigation: React.FC<MobileStepNavigationProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  canProceed,
  isLoading = false
}) => {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-lg">
      <div className="flex gap-3">
        {currentStep > 1 && onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-4 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
          >
            Back
          </button>
        )}

        {onNext && (
          <button
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className={`
              flex-1 py-4 px-6 rounded-xl font-semibold text-white 
              flex items-center justify-center gap-2
              ${isLastStep ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}
              ${(!canProceed || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
              transition-colors touch-manipulation shadow-lg
              ${isLastStep ? 'shadow-green-500/25' : 'shadow-purple-500/25'}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isLastStep ? 'Place Order' : nextLabel}</span>
                {isLastStep ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Security indicator for mobile
export const MobileSecurityIndicator: React.FC = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lock className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-green-900 text-sm">Secure Checkout</div>
          <div className="text-xs text-green-700">256-bit SSL encryption protects your data</div>
        </div>
      </div>
    </div>
  );
};
