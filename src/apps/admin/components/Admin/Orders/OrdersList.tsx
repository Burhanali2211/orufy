import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useRef, useCallback } from 'react';
import {
  Search, Eye, X, ShoppingCart, DollarSign, Clock, ChevronLeft, ChevronRight,
  BarChart3, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { OrderDetails } from './OrderDetails';
import { useQuery } from '@tanstack/react-query';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  getAdminStatusClasses,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/shared/utils/orderStatusUtils';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count?: number;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
}

export const OrdersList: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageSize = 10;

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<OrderStats>({
    queryKey: ['admin-orders-stats'],
    queryFn: () => apiClient.get('/merchant/orders').then((res: any) => {
      const q = res?.attentionQueue || {};
      return {
        totalOrders: q.totalActiveOrders || 0,
        totalRevenue: 0,
        pendingOrders: q.toPackCount || 0,
        ordersToday: q.newOrdersCount || 0,
        revenueToday: 0,
        avgOrderValue: 0,
        statusBreakdown: {}
      };
    }),
  });

  const { data: ordersData, isLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders', currentPage, searchTerm, statusFilter, paymentStatusFilter],
    queryFn: () => {
      return apiClient.get(`/merchant/orders`).then((res: any) => {
        // Backend currently returns all orders under 'orders', so we map it here
        const allOrders = res?.orders || [];
        return { data: allOrders, total: allOrders.length };
      });
    },
  });

  const orders = (ordersData?.data || []) as Order[];
  const totalItems = ordersData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;
  };

  const renderStatusBadge = (status: string, isPayment = false) => {
    const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
    const Icon = config.icon;
    const cls = getAdminStatusClasses(status, isPayment);
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cls}`}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{config.label}</span>
      </div>
    );
  };

  const renderPaymentMethod = (method: string) => {
    const config = getPaymentMethodConfig(method);
    const Icon = config.icon;
    return (
      <div className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-xs text-gray-700">{config.label}</span>
      </div>
    );
  };

  if (selectedOrderId) {
    return (
      <OrderDetails
        orderId={selectedOrderId}
        onClose={() => { 
          setSelectedOrderId(null); 
          refetchOrders(); 
          refetchStats(); 
        }}
      />
    );
  }

  const hasActiveFilters = searchInput || statusFilter || paymentStatusFilter;

  const clearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setCurrentPage(1);
  };

  const Pagination = () => (
    totalPages > 1 ? (
      <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 rounded-full text-sm font-medium transition-colors ${p === currentPage ? 'bg-stone-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>;
              return null;
            })}
          </div>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-600 font-medium">Manage and track customer orders</p>
          </div>
        </div>
        <button
          onClick={() => { refetchOrders(); refetchStats(); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full font-medium text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-11 flex-shrink-0"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading || statsLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats grid — matches Products/Categories style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Orders</p>
          {statsLoading
            ? <div className="h-8 w-16 bg-gray-100 rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-gray-900">{stats?.totalOrders ?? 0}</p>
          }
          {stats && stats.ordersToday > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{stats.ordersToday} today</span>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
          {statsLoading
            ? <div className="h-8 w-24 bg-gray-100 rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-green-600">{fmt(stats?.totalRevenue ?? 0)}</p>
          }
          {stats && stats.revenueToday > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{fmt(stats.revenueToday)} today</span>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Pending</p>
          {statsLoading
            ? <div className="h-8 w-16 bg-gray-100 rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-amber-600">{stats?.pendingOrders ?? 0}</p>
          }
          <div className="mt-2 text-xs text-gray-500">Requires attention</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Avg Order Value</p>
          {statsLoading
            ? <div className="h-8 w-20 bg-gray-100 rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-blue-600">{fmt(stats?.avgOrderValue ?? 0)}</p>
          }
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-600 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-600 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10 whitespace-nowrap"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="">All Statuses</option>
              {Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-600 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10 whitespace-nowrap"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="">All Payments</option>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-full transition-colors whitespace-nowrap">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mb-4" />
                      <p>Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                      <p>Try adjusting your search or filters to find what you're looking for.</p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-purple-600 hover:bg-gray-50">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          #{order.order_number || order.id.slice(0, 8)}
                        </span>
                        {order.item_count && order.item_count > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {order.item_count} items
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {renderStatusBadge(order.payment_status, true)}
                        {renderPaymentMethod(order.payment_method)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(order.status, false)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{fmt(order.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-purple-600 transition-colors group-hover:border-purple-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  );
};
