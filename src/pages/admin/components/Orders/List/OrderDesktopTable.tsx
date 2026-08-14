import React from 'react';
import {  ShoppingCart, Eye } from 'lucide-react';
import { Order } from '../types';
import { renderStatusBadge, renderPaymentMethod, fmt } from './utils';

interface OrderDesktopTableProps {
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

export const OrderDesktopTable: React.FC<OrderDesktopTableProps> = ({
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
  return (
    <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <></>
                  <p className="text-sm text-gray-500">Loading orders...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No orders found</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="font-medium text-gray-900 truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-amber-600 whitespace-nowrap">{fmt(order.total_amount)}</p>
                  </td>
                  <td className="px-4 py-3">{renderStatusBadge(order.status)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {renderStatusBadge(order.payment_status, true)}
                      <div>{renderPaymentMethod(order.payment_method)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium min-h-[40px]"
                      aria-label="View order details"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Desktop pagination */}
      {!loading && orders.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>;
                }
                return null;
              })}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

