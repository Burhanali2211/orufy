import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useRef, useCallback } from 'react';
import {
  Search, Eye, X, ShoppingCart, DollarSign, Clock, ChevronLeft, ChevronRight,
  BarChart3, RefreshCw, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
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

  const pageSize = 12;

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 250);
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<OrderStats>({
    queryKey: ['admin-orders-stats'],
    queryFn: () => apiClient.get('/merchant/orders').then((res: any) => {
      const q = res?.attentionQueue || {};
      const allOrders = res?.orders || [];
      const totalRev = allOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) || 0), 0);
      const avgVal = allOrders.length > 0 ? totalRev / allOrders.length : 0;
      return {
        totalOrders: allOrders.length || q.totalActiveOrders || 0,
        totalRevenue: totalRev,
        pendingOrders: q.toPackCount || allOrders.filter((o: any) => o.status === 'processing' || o.status === 'pending').length || 0,
        ordersToday: q.newOrdersCount || 0,
        revenueToday: 0,
        avgOrderValue: avgVal,
        statusBreakdown: {}
      };
    }),
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', currentPage, searchTerm, statusFilter, paymentStatusFilter],
    queryFn: () => {
      return apiClient.get(`/merchant/orders`).then((res: any) => {
        const allOrders = res?.orders || [];
        return { data: allOrders, total: allOrders.length };
      });
    },
  });

  const allOrders = (ordersData?.data || []) as Order[];
  
  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch = searchTerm === '' ||
      (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    const matchesPayment = paymentStatusFilter === '' || order.payment_status === paymentStatusFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;
  };

  const renderStatusBadge = (status: string, isPayment = false) => {
    const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
    const Icon = config.icon;
    const cls = getAdminStatusClasses(status, isPayment);
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cls}`}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{config.label}</span>
      </div>
    );
  };

  const renderPaymentMethod = (method: string) => {
    const config = getPaymentMethodConfig(method);
    const Icon = config.icon;
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-stone-600 font-medium">
        <Icon className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
        <span>{config.label}</span>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchTerm || statusFilter || paymentStatusFilter);

  // If viewing single order detail
  if (selectedOrderId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedOrderId(null)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </button>
        <OrderDetails orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Customer Orders</h1>
          <p className="text-stone-500 text-sm mt-0.5">Track fulfillments, view customer receipts, and update shipping details.</p>
        </div>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{stats?.totalOrders ?? 0}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Volume</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{fmt(stats?.totalRevenue ?? 0)}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Action</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats?.pendingOrders ?? 0}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Average Order</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{fmt(stats?.avgOrderValue ?? 0)}</p>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, or email..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Fulfillment Statuses</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Payment Statuses</option>
          {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Main Editorial Orders Table ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium">Loading orders...</p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No orders found</h3>
            <p className="text-xs text-stone-500 mt-1">Orders placed on your storefront will appear here instantly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Order #</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Payment</th>
                  <th className="py-3.5 px-5">Fulfillment</th>
                  <th className="py-3.5 px-5 text-right">Total</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <p className="font-mono font-bold text-stone-900">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{order.item_count || 1} item(s)</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-stone-600 font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-stone-900 truncate max-w-xs">{order.customer_name || 'Guest Customer'}</p>
                      <p className="text-xs text-stone-400 truncate max-w-xs">{order.customer_email}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        {renderStatusBadge(order.payment_status, true)}
                        <div>{renderPaymentMethod(order.payment_method)}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {renderStatusBadge(order.status, false)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-stone-900">
                      {fmt(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/50">
            <p className="text-xs font-semibold text-stone-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-stone-900">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersList;
