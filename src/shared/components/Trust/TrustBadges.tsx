import React from 'react';
import { Shield, Lock, CreditCard, Award, CheckCircle, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrustBadgeProps {
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  className?: string;
}

const trustBadges = [
  {
    id: 'ssl-secured',
    icon: Shield,
    label: 'SSL Secured',
    description: '256-bit encryption',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'privacy-protected',
    icon: Lock,
    label: 'Privacy Protected',
    description: 'GDPR Compliant',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'secure-payments',
    icon: CreditCard,
    label: 'Secure Payments',
    description: 'PCI DSS Certified',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'trusted-store',
    icon: Award,
    label: 'Trusted Store',
    description: 'Verified Business',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  }
];

export const TrustBadges: React.FC<TrustBadgeProps> = ({
  variant = 'horizontal',
  showLabels = true,
  className = ''
}) => {
  const containerClasses = {
    horizontal: 'flex items-center justify-center space-x-6',
    vertical: 'flex flex-col space-y-4',
    compact: 'flex items-center space-x-3'
  };

  const badgeClasses = {
    horizontal: 'flex items-center space-x-2 px-4 py-3',
    vertical: 'flex items-center space-x-3 px-4 py-3',
    compact: 'flex items-center space-x-1 px-2 py-1'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {trustBadges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`
            ${badgeClasses[variant]}
            ${badge.bgColor} ${badge.borderColor}
            border rounded-lg hover:shadow-md transition-all duration-300
            ${variant === 'compact' ? 'text-xs' : 'text-sm'}
          `}
        >
          <badge.icon className={`
            ${badge.color} 
            ${variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'}
          `} />
          {showLabels && (
            <div className={variant === 'compact' ? '' : 'text-left'}>
              <div className={`font-medium text-gray-900 ${variant === 'compact' ? 'text-xs' : ''}`}>
                {badge.label}
              </div>
              {variant !== 'compact' && (
                <div className="text-xs text-gray-600">
                  {badge.description}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Security guarantee component for checkout
export const SecurityGuarantee: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-gradient-to-r from-green-50 to-blue-50 
        border border-green-200 rounded-xl p-6 ${className}
      `}
    >
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="p-2 bg-green-100 rounded-full">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          100% Secure Checkout
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-gray-700">SSL Encrypted</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-gray-700">PCI Compliant</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-gray-700">Privacy Protected</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-gray-700">Money Back Guarantee</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          Your payment information is processed securely. We do not store credit card details.
        </p>
      </div>
    </motion.div>
  );
};

// Payment method badges
export const PaymentBadges: React.FC<{ className?: string }> = ({ className = '' }) => {
  const paymentMethods = [
    { id: 'visa', name: 'Visa', logo: '💳' },
    { id: 'mastercard', name: 'Mastercard', logo: '💳' },
    { id: 'amex', name: 'American Express', logo: '💳' },
    { id: 'paypal', name: 'PayPal', logo: '🅿️' },
    { id: 'apple-pay', name: 'Apple Pay', logo: '🍎' },
    { id: 'google-pay', name: 'Google Pay', logo: '🔵' }
  ];

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <span className="text-sm text-gray-600 font-medium">We Accept:</span>
      <div className="flex items-center space-x-2">
        {paymentMethods.map((method, index) => (
          <div
            key={method.id}
            className="flex items-center justify-center w-10 h-6 bg-white border border-gray-200 rounded text-xs"
            title={method.name}
          >
            {method.logo}
          </div>
        ))}
      </div>
    </div>
  );
};

// Company credibility indicators
export const CredibilityIndicators: React.FC<{ className?: string }> = ({ className = '' }) => {
  const stats = [
    { id: 'years-business', value: '10+', label: 'Years in Business', icon: Globe },
    { id: 'happy-customers', value: '50K+', label: 'Happy Customers', icon: Award },
    { id: 'uptime-guarantee', value: '99.9%', label: 'Uptime Guarantee', icon: Shield },
    { id: 'customer-support', value: '24/7', label: 'Customer Support', icon: CheckCircle }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-gray-100 rounded-full">
              <stat.icon className="h-6 w-6 text-gray-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-gray-600">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
