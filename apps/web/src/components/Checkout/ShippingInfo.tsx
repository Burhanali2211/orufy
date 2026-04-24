/**
 * ShippingInfo Component
 * 
 * Displays shipping cost, delivery estimates, and free shipping progress
 */

import React from 'react';
import { Truck, Package, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShippingInfoProps {
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  currentTotal: number;
  zoneName?: string;
  deliveryEstimate?: string;
  courierPartner?: string;
}

export const ShippingInfo: React.FC<ShippingInfoProps> = ({
  shippingCost,
  isFreeShipping,
  freeShippingThreshold,
  currentTotal,
  zoneName,
  deliveryEstimate,
  courierPartner
}) => {
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - currentTotal);
  const progressPercentage = Math.min(100, (currentTotal / freeShippingThreshold) * 100);

  return (
    <div className="space-y-4">
      {/* Shipping Cost Display */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Shipping Cost</p>
            {zoneName && (
              <p className="text-xs text-gray-600">{zoneName}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          {isFreeShipping ? (
            <span className="text-lg font-bold text-green-600">FREE</span>
          ) : (
            <span className="text-lg font-bold text-gray-900">₹{shippingCost.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Free Shipping Progress */}
      {!isFreeShipping && amountToFreeShipping > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">
              Add ₹{amountToFreeShipping.toFixed(2)} more for FREE shipping!
            </p>
            <span className="text-xs font-semibold text-green-600">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Free Shipping Achieved */}
      {isFreeShipping && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">
                🎉 You've unlocked FREE shipping!
              </p>
              <p className="text-xs text-green-600">
                Your order qualifies for free delivery
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delivery Estimate */}
      {deliveryEstimate && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">Estimated Delivery</p>
            <p className="text-sm font-medium text-gray-900">{deliveryEstimate}</p>
          </div>
        </div>
      )}

      {/* Courier Partner */}
      {courierPartner && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">Courier Partner</p>
            <p className="text-sm font-medium text-gray-900">{courierPartner}</p>
          </div>
        </div>
      )}

      {/* Shipping Features */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Secure Packaging</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Real-time Tracking</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Insured Delivery</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Contactless Option</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Shipping Info for Order Summary
 */
export const CompactShippingInfo: React.FC<{
  shippingCost: number;
  isFreeShipping: boolean;
}> = ({ shippingCost, isFreeShipping }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Truck className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-600">Shipping</span>
      </div>
      <span className="text-sm font-medium">
        {isFreeShipping ? (
          <span className="text-green-600 font-semibold">FREE</span>
        ) : (
          `₹${shippingCost.toFixed(2)}`
        )}
      </span>
    </div>
  );
};

/**
 * Shipping Zone Badge
 */
export const ShippingZoneBadge: React.FC<{
  zoneName: string;
  deliveryDays: string;
}> = ({ zoneName, deliveryDays }) => {
  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
      <MapPin className="h-3 w-3" />
      <span>{zoneName}</span>
      <span className="text-blue-600">•</span>
      <span>{deliveryDays} days</span>
    </div>
  );
};

