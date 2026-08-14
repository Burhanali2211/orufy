import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ShoppingCart, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';
import { OrderDetails } from './OrderDetails';

// Modular Components
import { OrderStatsGrid } from './OrderStatsGrid';
import { OrderFilters } from './OrderFilters';
import { OrderMobileList } from './List/OrderMobileList';
import { OrderDesktopTable } from './List/OrderDesktopTable';
import { Order, OrderStats } from './types';

// Module-level cache – survives SPA navigation, cleared on hard refresh
import { useOrdersQuery, useOrderStatsQuery } from '@/hooks/admin/useOrderQueries';

import { AttentionQueueBanner } from './AttentionQueueBanner';

export const OrdersList: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const pageSize = 10;

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useOrdersQuery(currentPage, pageSize, {
    status: statusFilter,
    paymentStatus: paymentStatusFilter,
    searchTerm: searchTerm,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useOrderStatsQuery();

  const orders = ordersData?.orders ?? [];
  const totalItems = ordersData?.totalItems ?? 0;
  const totalPages = ordersData?.totalPages ?? 1;

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  const handleRefresh = () => {
    refetchOrders();
    refetchStats();
  };

  if (selectedOrderId) {
    return (
      <OrderDetails
        orderId={selectedOrderId}
        onClose={() => { setSelectedOrderId(null); fetchOrders(); fetchStats(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">Manage and track customer orders</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors min-h-[44px] flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${(ordersLoading || statsLoading) ? 'hidden' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <AttentionQueueBanner onFilterSelect={(status) => { setStatusFilter(status); setCurrentPage(1); }} />

      <OrderStatsGrid
        stats={stats}
        loading={statsLoading}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
      />

      <OrderFilters
        searchInput={searchInput}
        onSearchInputChange={(val) => { setSearchInput(val); handleSearchChange(val); }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusFilterChange={(s) => { setPaymentStatusFilter(s); setCurrentPage(1); }}
        onClearFilters={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setPaymentStatusFilter(''); setCurrentPage(1); }}
        totalItems={totalItems}
      />

      <OrderMobileList 
        loading={ordersLoading}
        orders={orders}
        setSelectedOrderId={setSelectedOrderId}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        ChevronLeft={ChevronLeft}
        ChevronRight={ChevronRight}
      />

      <OrderDesktopTable 
        loading={ordersLoading}
        orders={orders}
        setSelectedOrderId={setSelectedOrderId}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        ChevronLeft={ChevronLeft}
        ChevronRight={ChevronRight}
      />
    </div>
  );
};


