import React from 'react';
import { Search, X } from 'lucide-react';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/utils/orderStatusUtils';

interface OrderFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  totalItems: number;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchInput,
  onSearchInputChange,
  statusFilter,
  onStatusFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  onClearFilters,
  totalItems
}) => {
  const hasActiveFilters = searchInput || statusFilter || paymentStatusFilter;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white"
        >
          <option value="">All Status</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => onPaymentStatusFilterChange(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white"
        >
          <option value="">All Payments</option>
          {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
      {totalItems > 0 && (
        <p className="text-xs text-gray-400 mt-2">{totalItems} order{totalItems !== 1 ? 's' : ''} found</p>
      )}
    </div>
  );
};

