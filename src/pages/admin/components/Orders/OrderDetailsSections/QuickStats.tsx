import React from 'react';
import { DollarSign, Package, CreditCard, Truck } from 'lucide-react';
import { OrderData } from '../types';
import { fmt } from './OrderDetailsComponents';

interface QuickStatsProps {
  order: OrderData;
  renderStatusBadge: (status: string, isPayment?: boolean) => React.ReactNode;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ order, renderStatusBadge }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-amber-600" />
        <p className="text-xs text-gray-500 font-medium">Total</p>
      </div>
      <p className="text-xl font-bold text-amber-700">{fmt(order.total_amount)}</p>
    </div>
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Package className="h-4 w-4 text-blue-600" />
        <p className="text-xs text-gray-500 font-medium">Items</p>
      </div>
      <p className="text-xl font-bold text-blue-700">{order.items.length}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="h-4 w-4 text-gray-500" />
        <p className="text-xs text-gray-500 font-medium">Payment</p>
      </div>
      <div className="mt-0.5">{renderStatusBadge(order.payment_status, true)}</div>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Truck className="h-4 w-4 text-gray-500" />
        <p className="text-xs text-gray-500 font-medium">Tracking</p>
      </div>
      <p className="text-sm font-medium text-gray-700 truncate">
        {order.tracking_number || '—'}
      </p>
    </div>
  </div>
);

