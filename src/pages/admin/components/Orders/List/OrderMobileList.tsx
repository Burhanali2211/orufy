import React from 'react';
import {  ShoppingCart, Eye } from 'lucide-react';
import { Order } from '../types';
import { renderStatusBadge, renderPaymentMethod, fmt } from './utils';

interface OrderMobileListProps {
  loading: boolean;
  orders: Order[];
  setSelectedOrderId: (id: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  ChevronLeft: any;
  ChevronRight: any;
}

export const OrderMobileList: React.FC<OrderMobileListProps> = ({
  loading,
  orders,
  setSelectedOrderId,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  setCurrentPage,
  ChevronLeft,
  ChevronRight
}) => {
  if (loading) {
    return (
      <div className="lg:hidden bg-white border border-gray-200 rounded-xl p-8 text-center">
        <></>
        <p className="text-sm text-gray-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="lg:hidden bg-white border border-gray-200 rounded-xl p-8 text-center">
        <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white border border-gray-200 rounded-xl p-4"
          onClick={() => setSelectedOrderId(order.id)}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                {renderStatusBadge(order.status)}
              </div>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className="font-bold text-base text-amber-600 flex-shrink-0">{fmt(order.total_amount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">Customer</p>
              <p className="font-medium text-gray-900 truncate">{order.customer_name}</p>
              <p className="text-gray-500 truncate">{order.customer_email}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Payment</p>
              <div className="mb-1">{renderPaymentMethod(order.payment_method)}</div>
              {renderStatusBadge(order.payment_status, true)}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-sm transition-colors border border-amber-200"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
        </div>
      ))}

      {/* Mobile pagination */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {totalItems > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}` : '0'}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs font-medium text-gray-700">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

