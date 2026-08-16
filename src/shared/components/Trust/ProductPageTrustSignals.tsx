import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Truck,
  RotateCcw,
  Star,
  Users,
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle,
  Award
} from 'lucide-react';

interface ProductPageTrustSignalsProps {
  className?: string;
}

export const ProductPageTrustSignals: React.FC<ProductPageTrustSignalsProps> = ({
  className = ''
}) => {
  const [currentViewers, setCurrentViewers] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState(0);

  // Simulate real-time activity
  useEffect(() => {
    const updateViewers = () => {
      setCurrentViewers(Math.floor(Math.random() * 50) + 15);
    };

    const updatePurchases = () => {
      setRecentPurchases(Math.floor(Math.random() * 20) + 5);
    };

    updateViewers();
    updatePurchases();

    const viewerInterval = setInterval(updateViewers, 8000);
    const purchaseInterval = setInterval(updatePurchases, 12000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(purchaseInterval);
    };
  }, []);

  const trustFeatures = [
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "256-bit SSL encryption"
    },
    {
      icon: Truck,
      title: "Fast Shipping",
      description: "On orders over $50"
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day return policy"
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "Premium products only"
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Trust Features Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {trustFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-luxury p-4 text-center border border-neutral-100 hover:border-neutral-200 transition-colors duration-200"
          >
            <feature.icon className="h-6 w-6 text-neutral-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900 mb-1">
              {feature.title}
            </h4>
            <p className="text-xs text-neutral-600">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Social Proof Indicators */}
      <div className="bg-gradient-to-r from-neutral-50 to-white rounded-luxury-lg p-6 border border-neutral-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Viewers */}
          <motion.div
            className="flex items-center space-x-3"
            key={currentViewers}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-2 bg-blue-100 rounded-full">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {currentViewers} people
              </p>
              <p className="text-xs text-neutral-600">viewing now</p>
            </div>
          </motion.div>

          {/* Recent Purchases */}
          <motion.div
            className="flex items-center space-x-3"
            key={recentPurchases}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-2 bg-green-100 rounded-full">
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {recentPurchases} sold
              </p>
              <p className="text-xs text-neutral-600">in last 24h</p>
            </div>
          </motion.div>

          {/* Customer Satisfaction */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Star className="h-4 w-4 text-yellow-600 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                4.8/5 rating
              </p>
              <p className="text-xs text-neutral-600">from 2,847 reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center space-x-6 py-4">
        <div className="flex items-center space-x-2 text-neutral-600">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">SSL Secured</span>
        </div>
        <div className="flex items-center space-x-2 text-neutral-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Verified Store</span>
        </div>
        <div className="flex items-center space-x-2 text-neutral-600">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">50K+ Customers</span>
        </div>
      </div>
    </div>
  );
};

// Recent Purchase Notification Component
interface RecentPurchaseNotificationProps {
  productName: string;
  customerLocation: string;
  timeAgo: string;
}

export const RecentPurchaseNotification: React.FC<RecentPurchaseNotificationProps> = ({
  productName,
  customerLocation,
  timeAgo
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), Math.random() * 5000 + 2000);
    const hideTimer = setTimeout(() => setIsVisible(false), 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="fixed bottom-6 left-6 bg-white rounded-luxury-lg shadow-luxury border border-neutral-200 p-4 max-w-sm z-50"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {productName}
              </p>
              <p className="text-xs text-neutral-600">
                Purchased by someone in {customerLocation}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {timeAgo}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Urgency Indicator Component
interface UrgencyIndicatorProps {
  stock: number;
  threshold?: number;
  className?: string;
}

export const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({
  stock,
  threshold = 10,
  className = ''
}) => {
  if (stock > threshold) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-red-50 border border-red-200 rounded-luxury p-3 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-red-600" />
        <div>
          <p className="text-sm font-semibold text-red-900">
            Only {stock} left in stock!
          </p>
          <p className="text-xs text-red-700">
            Order soon to avoid disappointment
          </p>
        </div>
      </div>
    </motion.div>
  );
};
