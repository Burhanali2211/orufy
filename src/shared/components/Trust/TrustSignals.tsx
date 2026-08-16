import React from 'react';
import { Shield, Truck, RotateCcw, Headphones, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrustSignal {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface TrustSignalWithId extends TrustSignal {
  id: string;
}

const trustSignals: TrustSignalWithId[] = [
  {
    id: 'fast-shipping',
    icon: Truck,
    title: 'Fast Shipping',
    description: 'On orders over $50',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: '30-Day Returns',
    description: 'Hassle-free returns',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'secure-checkout',
    icon: Shield,
    title: 'Secure Checkout',
    description: 'SSL encrypted & protected',
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100'
  },
  {
    id: 'support',
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert customer care',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
];

interface TrustSignalsProps {
  variant?: 'grid' | 'horizontal' | 'vertical' | 'compact';
  showIcons?: boolean;
  className?: string;
}

export const TrustSignals: React.FC<TrustSignalsProps> = ({
  variant = 'grid',
  showIcons = true,
  className = ''
}) => {
  const containerClasses = {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    horizontal: 'flex flex-wrap justify-center gap-6',
    vertical: 'space-y-4',
    compact: 'flex flex-wrap justify-center gap-3'
  };

  const itemClasses = {
    grid: 'text-center p-4',
    horizontal: 'flex items-center space-x-3 p-3',
    vertical: 'flex items-center space-x-4 p-4',
    compact: 'flex items-center space-x-2 p-2 text-sm'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {trustSignals.map((signal, index) => (
        <motion.div
          key={signal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`
            ${itemClasses[variant]}
            bg-white border border-neutral-200 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 luxury-transition
          `}
        >
          {showIcons && (
            <div className={`
              ${signal.bgColor} p-3 rounded-full
              ${variant === 'grid' ? 'mx-auto mb-3' : ''}
              ${variant === 'compact' ? 'p-2' : ''}
            `}>
              <signal.icon className={`
                ${signal.color}
                ${variant === 'compact' ? 'h-4 w-4' : 'h-6 w-6'}
              `} />
            </div>
          )}
          <div className={variant === 'grid' ? 'text-center' : 'text-left'}>
            <h3 className={`
              font-semibold text-gray-900
              ${variant === 'compact' ? 'text-sm' : 'text-base'}
            `}>
              {signal.title}
            </h3>
            <p className={`
              text-gray-600
              ${variant === 'compact' ? 'text-xs' : 'text-sm'}
            `}>
              {signal.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Product page specific trust signals
export const ProductTrustSignals: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Why Shop With Us?</h3>
        <TrustSignals variant="vertical" className="space-y-3" />
      </div>
    </div>
  );
};

// Checkout page trust signals
export const CheckoutTrustSignals: React.FC<{ className?: string }> = ({ className = '' }) => {
  const checkoutSignals = [
    {
      id: 'checkout-secure',
      icon: Shield,
      title: 'Secure Checkout',
      description: 'Your data is protected with 256-bit SSL encryption'
    },
    {
      id: 'checkout-trusted',
      icon: Award,
      title: 'Trusted by 50,000+',
      description: 'Join thousands of satisfied customers'
    },
    {
      id: 'checkout-quick',
      icon: Clock,
      title: 'Quick Processing',
      description: 'Orders processed within 24 hours'
    }
  ];

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Shop with Confidence
      </h3>
      <div className="space-y-3">
        {checkoutSignals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className="p-2 bg-white rounded-full shadow-sm">
              <signal.icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{signal.title}</h4>
              <p className="text-xs text-gray-600">{signal.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Homepage trust section
export const HomepageTrustSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Why Choose Us?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            We're committed to providing you with the best shopping experience possible.
          </motion.p>
        </div>

        <TrustSignals variant="grid" className="mb-12" />

        {/* Additional trust metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">10+</div>
            <div className="text-gray-600">Years of Excellence</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Mini trust indicators for product cards
export const MiniTrustIndicators: React.FC<{
  freeShipping?: boolean;
  warranty?: boolean;
  returns?: boolean;
  className?: string;
}> = ({ freeShipping, warranty, returns, className = '' }) => {
  const indicators: Array<{ id: string; icon: React.ElementType; text: string; color: string }> = [];

  if (freeShipping) {
    indicators.push({ id: 'free-shipping', icon: Truck, text: 'Fast Shipping', color: 'text-blue-600' });
  }
  if (warranty) {
    indicators.push({ id: 'warranty', icon: Shield, text: 'Warranty', color: 'text-green-600' });
  }
  if (returns) {
    indicators.push({ id: 'returns', icon: RotateCcw, text: 'Returns', color: 'text-purple-600' });
  }

  if (indicators.length === 0) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {indicators.map((indicator, index) => (
        <div
          key={indicator.id}
          className="flex items-center space-x-1 text-xs text-gray-600"
          title={indicator.text}
        >
          <indicator.icon className={`h-3 w-3 ${indicator.color}`} />
          <span>{indicator.text}</span>
        </div>
      ))}
    </div>
  );
};
