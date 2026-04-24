import React, { useState, useEffect } from 'react';
import { Eye, ShoppingBag, Users, Star, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentPurchase {
  id: string;
  customerName: string;
  productName: string;
  location: string;
  timeAgo: string;
  verified: boolean;
}

interface SocialProofProps {
  className?: string;
  productId?: string;
  showRecentPurchases?: boolean;
  showViewingCount?: boolean;
  showCustomerCount?: boolean;
}

// Recent purchases will be fetched from API in production
const mockRecentPurchases: RecentPurchase[] = [];

export const SocialProof: React.FC<SocialProofProps> = ({
  className = '',
  productId,
  showRecentPurchases = true,
  showViewingCount = true,
  showCustomerCount = true
}) => {
  const [currentPurchaseIndex, setCurrentPurchaseIndex] = useState(0);
  const [viewingCount, setViewingCount] = useState(Math.floor(Math.random() * 15) + 3);

  // Rotate through recent purchases
  useEffect(() => {
    if (!showRecentPurchases || mockRecentPurchases.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPurchaseIndex((prev) => (prev + 1) % mockRecentPurchases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [showRecentPurchases]);

  // Simulate viewing count changes
  useEffect(() => {
    if (!showViewingCount) return;

    const interval = setInterval(() => {
      setViewingCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(1, Math.min(25, newCount));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [showViewingCount, productId]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recent Purchase Notification */}
      {showRecentPurchases && mockRecentPurchases.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPurchaseIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white border border-green-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {mockRecentPurchases[currentPurchaseIndex]?.customerName || 'Customer'}
                  </p>
                  {mockRecentPurchases[currentPurchaseIndex]?.verified && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified Purchase" />
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  from {mockRecentPurchases[currentPurchaseIndex]?.location || 'Unknown'} purchased{' '}
                  <span className="font-medium">
                    {mockRecentPurchases[currentPurchaseIndex]?.productName || 'Product'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {mockRecentPurchases[currentPurchaseIndex]?.timeAgo || 'Recently'}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Live Viewing Count */}
      {showViewingCount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              <span className="font-semibold">{viewingCount}</span> people are viewing this product
            </span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Customer Count Indicator */}
      {showCustomerCount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-800">
              Join <span className="font-semibold">50,000+</span> happy customers
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Review Summary Component
export const ReviewSummary: React.FC<{
  rating: number;
  reviewCount: number;
  className?: string;
}> = ({ rating, reviewCount, className = '' }) => {
  // Ensure rating is a number
  const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
  const percentage = (numericRating / 5) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < Math.floor(numericRating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
                }`}
            />
          ))}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">{numericRating.toFixed(1)}</span>
            <span className="text-sm text-gray-600">
              ({reviewCount.toLocaleString()} reviews)
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {percentage.toFixed(0)}% of customers recommend this product
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Trending Indicator
export const TrendingIndicator: React.FC<{
  isHot?: boolean;
  salesIncrease?: number;
  className?: string;
}> = ({ isHot = false, salesIncrease = 0, className = '' }) => {
  if (!isHot && salesIncrease <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${isHot
          ? 'bg-red-100 text-red-700 border border-red-200'
          : 'bg-green-100 text-green-700 border border-green-200'
        } ${className}`}
    >
      <TrendingUp className="h-3 w-3" />
      <span>
        {isHot ? 'Hot Item' : `+${salesIncrease}% sales`}
      </span>
    </motion.div>
  );
};

// Stock Urgency Indicator
export const StockUrgency: React.FC<{
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}> = ({ stock, lowStockThreshold = 10, className = '' }) => {
  if (stock > lowStockThreshold) return null;

  const isVeryLow = stock <= 3;
  const urgencyLevel = isVeryLow ? 'high' : 'medium';

  const styles = {
    high: 'bg-red-50 border-red-200 text-red-700',
    medium: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border rounded-lg p-3 ${styles[urgencyLevel]} ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isVeryLow ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
          }`} />
        <span className="text-sm font-medium">
          {isVeryLow ? 'Almost sold out!' : 'Low stock alert'}
        </span>
      </div>
      <p className="text-xs mt-1">
        Only {stock} left in stock - order soon!
      </p>
    </motion.div>
  );
};
