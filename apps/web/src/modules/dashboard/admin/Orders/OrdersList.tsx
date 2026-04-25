import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Search, Eye, Filter, X, ShoppingCart, DollarSign, Clock,
  AlertCircle, Loader2, ChevronLeft, ChevronRight,
  BarChart3, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { OrderDetails } from './OrderDetails';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  getAdminStatusClasses,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../../../utils/orderStatusUtils';

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

// Module-level cache – survives SPA navigation, cleared on hard refresh
let _ordersCache: { orders: Order[]; totalItems: number; totalPages: number } | null = null;
let _orderStatsCache: OrderStats | null = null;

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(_ordersCache?.orders ?? []);
  const [loading, setLoading] = useState(_ordersCache === null);
  const [statsLoading, setStatsLoading] = useState(_orderStatsCache === null);
  const [stats, setStats] = useState<OrderStats | null>(_orderStatsCache);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(_ordersCache?.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(_ordersCache?.totalItems ?? 0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

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

  const pageSize = 10;

  useEffect(() => {
    const background = isFirstMount.current && _orderStatsCache !== null;
    fetchStats(background);
  }, []);
  useEffect(() => {
    const background = isFirstMount.current && _ordersCache !== null;
    isFirstMount.current = false;
    fetchOrders(background);
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter]);

  const fetchStats = async (background = false) => {
    try {
      if (!background) setStatsLoading(true);
      const res = await apiClient.get<{ data: OrderStats }>('/api/dashboard/orders/stats');
      if (res.data) {
        setStats(res.data);
        _orderStatsCache = res.data;
      }
    } catch {
      // non-critical
    } finally {
      if (!background) setStatsLoading(false);
    }
  };

  const fetchOrders = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const limit = pageSize;
      const offset = (currentPage - 1) * pageSize;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (paymentStatusFilter) params.append('paymentStatus', paymentStatusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await apiClient.get<{data: any, count: number}>(`/api/dashboard/orders?${params.toString()}`);
      
      const ordersRaw = res.data?.data || [];
      const count = res.data?.count || 0;

      const mappedOrders = ordersRaw.map((o: any) => ({
        ...o,
        // Map camelCase to snake_case for frontend UI compatibility
        order_number: o.orderNumber,
        customer_name: o.customerName || 'Guest',
        customer_email: o.customerEmail || '',
        total_amount: o.total,
        payment_status: o.paymentStatus,
        payment_method: o.paymentMethod || 'Razorpay',
        created_at: o.createdAt,
      }));
      
      const ti = count;
      const tp = Math.max(1, Math.ceil(ti / pageSize));
      setOrders(mappedOrders);
      setTotalItems(ti);
      setTotalPages(tp);
      // Cache only the default (page 1, no filters) result
      if (currentPage === 1 && !searchTerm && !statusFilter && !paymentStatusFilter) {
        _ordersCache = { orders: mappedOrders, totalItems: ti, totalPages: tp };
      }
    } catch (error: any) {
      if (!background) showNotification({ type: 'error', title: 'Error', message: error.message || 'Failed to load orders' });
    } finally {
      if (!background) setLoading(false);
    }
  };

  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
        onClose={() => { setSelectedOrderId(null); fetchOrders(); fetchStats(); }}
      />
    );
  }

  const hasActiveFilters = searchInput || statusFilter || paymentStatusFilter;

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
          onClick={() => { fetchOrders(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors min-h-[44px] flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats grid — matches Products/Categories style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          {statsLoading
            ? <div className="h-8 w-16 bg-amber-100 rounded animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-amber-700">{stats?.totalOrders ?? 0}</p>
          }
          {stats && stats.ordersToday > 0 && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />{stats.ordersToday} today
            </p>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Revenue</p>
          {statsLoading
            ? <div className="h-8 w-20 bg-emerald-100 rounded animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-emerald-700">{fmt(stats?.totalRevenue ?? 0)}</p>
          }
          {stats && stats.revenueToday > 0 && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />{fmt(stats.revenueToday)} today
            </p>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          {statsLoading
            ? <div className="h-8 w-12 bg-orange-100 rounded animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-orange-700">{stats?.pendingOrders ?? 0}</p>
          }
          {stats && stats.pendingOrders > 0 && (
            <p className="text-xs text-orange-600 mt-1">Need attention</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Avg Order</p>
          {statsLoading
            ? <div className="h-8 w-16 bg-blue-100 rounded animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-blue-700">{fmt(stats?.avgOrderValue ?? 0)}</p>
          }
        </div>
      </div>

      {/* Status breakdown chips */}
      {stats && Object.keys(stats.statusBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const config = getOrderStatusConfig(status);
              const cls = getAdminStatusClasses(status, false);
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${cls} ${statusFilter === status ? 'ring-2 ring-offset-1 ring-amber-400' : 'hover:opacity-80'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                  <span className="font-bold ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); handleSearchChange(e.target.value); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white"
          >
            <option value="">All Status</option>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white"
          >
            <option value="">All Payments</option>
            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setPaymentStatusFilter(''); setCurrentPage(1); }}
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

      {/* Mobile card list */}
      <div className="lg:hidden space-y-2">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Desktop table */}
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
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
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
    </div>
  );
};
