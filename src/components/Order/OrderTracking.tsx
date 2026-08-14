import React from 'react';
import { CheckCircle, Truck, Package, Clock } from 'lucide-react';
import { TrackingEvent } from '../../types';
import { motion } from 'framer-motion';

interface OrderTrackingProps {
  history: TrackingEvent[];
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ history }) => {
  const getIcon = (eventStatus: string) => {
    switch (eventStatus) {
      case 'Order Placed': return <Package className="h-5 w-5" />;
      case 'Processing': return <Clock className="h-5 w-5" />;
      case 'Shipped': return <Truck className="h-5 w-5" />;
      case 'Delivered': return <CheckCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const isCompleted = (index: number) => {
    return index < history.length;
  };

  return (
    <div className="py-4">
      <h4 className="font-semibold text-gray-800 mb-4">Tracking History</h4>
      <div className="space-y-8">
        {history.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex space-x-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted(index) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {getIcon(event.status)}
              </div>
              {index < history.length - 1 && (
                <div className={`w-0.5 flex-grow ${isCompleted(index + 1) ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{event.status}</p>
              <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</p>
              <p className="text-sm text-gray-500">{event.location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
