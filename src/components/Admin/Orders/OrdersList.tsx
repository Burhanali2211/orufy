import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Search, Eye, Filter, X, ShoppingCart, DollarSign, Clock,
  AlertCircle, ChevronLeft, ChevronRight,
  BarChart3, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../../lib/legacyDb';
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
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        { count: totalOrders },
        { count: pendingOrders },
        { count: ordersToday },
        { data: revenueRows },
        { data: todayRevenueRows },
        { data: paidRows },
        { data: statusRows },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('total_amount').in('status', ['delivered', 'shipped']),
        supabase.from('orders').select('total_amount').in('status', ['delivered', 'shipped']).gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('orders').select('status'),
      ]);

      const totalRevenue = (revenueRows || []).reduce((s, o: any) => s + parseFloat(o.total_amount || '0'), 0);
      const revenueToday = (todayRevenueRows || []).reduce((s, o: any) => s + parseFloat(o.total_amount || '0'), 0);
      const paidTotal = (paidRows || []).reduce((s, o: any) => s + parseFloat(o.total_amount || '0'), 0);
      const avgOrderValue = paidRows && paidRows.length > 0 ? paidTotal / paidRows.length : 0;

      const statusBreakdown: Record<string, number> = {};
      (statusRows || []).forEach((o: any) => {
        statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
      });

      const newStats: OrderStats = { totalOrders: totalOrders ?? 0, totalRevenue, pendingOrders: pendingOrders ?? 0, ordersToday: ordersToday ?? 0, revenueToday, avgOrderValue, statusBreakdown };
      setStats(newStats);
      _orderStatsCache = newStats;
    } catch {
      // non-critical
    } finally {
      if (!background) setStatsLoading(false);
    }
  };

  const fetchOrders = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (paymentStatusFilter) query = query.eq('payment_status', paymentStatusFilter);
      if (searchTerm) query = query.ilike('order_number', `%${searchTerm}%`);

      const { data, error, count } = await query.range(from, to);
      

      const ordersRaw = data || [];
      const userIds = [...new Set(ordersRaw.map((o: any) => o.user_id).filter(Boolean))];
      const profileMap: Record<string, { full_name?: string; email?: string }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await apiClient.get('/profiles');
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      const mappedOrders = ordersRaw.map((o: any) => ({
        ...o,
        customer_name: profileMap[o.user_id]?.full_name || 'Guest',
        customer_email: profileMap[o.user_id]?.email || '',
      }));
      const ti = count ?? 0;
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f3e8fd] rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-[#a142f4]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Orders</h1>
            <p className="text-[13px] text-[#5f6368] font-medium">Manage and track customer orders</p>
          </div>
        </div>
        <button
          onClick={() => { fetchOrders(); fetchStats(); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#f8f9fa] border border-[#e8eaed] rounded-full font-medium text-[14px] text-[#5f6368] hover:text-[#202124] transition-colors min-h-[44px] flex-shrink-0"
        >
          <RefreshCw className="h-5 w-5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats grid — matches Products/Categories style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5 text-[#5f6368]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Total Orders</p>
          {statsLoading
            ? <div className="h-8 w-16 bg-[#f1f3f4] rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{stats?.totalOrders ?? 0}</p>
          }
          {stats && stats.ordersToday > 0 && (
            <p className="text-[12px] text-[#5f6368] mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />{stats.ordersToday} today
            </p>
          )}
        </div>

        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#e6f4ea] rounded-full flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-[#137333]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Revenue</p>
          {statsLoading
            ? <div className="h-8 w-20 bg-[#e8f0fe] rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-[#137333]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{fmt(stats?.totalRevenue ?? 0)}</p>
          }
          {stats && stats.revenueToday > 0 && (
            <p className="text-[12px] text-[#137333] mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />{fmt(stats.revenueToday)} today
            </p>
          )}
        </div>

        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#fef7e0] rounded-full flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-[#f29900]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Pending</p>
          {statsLoading
            ? <div className="h-8 w-12 bg-[#fef7e0] rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-[#f29900]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{stats?.pendingOrders ?? 0}</p>
          }
          {stats && stats.pendingOrders > 0 && (
            <p className="text-[12px] text-[#f29900] mt-1">Need attention</p>
          )}
        </div>

        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-[#1a73e8]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Avg Order</p>
        { statsLoading
            ? <div className="h-8 w-16 bg-[#e8f0fe] rounded hidden mt-1" />
            : <p className="text-[28px] font-normal text-[#1a73e8]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{fmt(stats?.avgOrderValue ?? 0)}</p>
          }
        </div>
      </div>

      {/* Status breakdown chips */}
      {stats && Object.keys(stats.statusBreakdown).length > 0 && (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-4">
          <p className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wide mb-3 pl-2">Status Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const config = getOrderStatusConfig(status);
              const cls = getAdminStatusClasses(status, false);
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-medium transition-all ${cls} ${statusFilter === status ? 'ring-2 ring-offset-1 ring-[#1a73e8]' : 'hover:opacity-80'}`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                  <span className="font-bold ml-1">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); handleSearchChange(e.target.value); }}
              className="w-full pl-11 pr-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Statuses</option>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Payments</option>
            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setPaymentStatusFilter(''); setCurrentPage(1); }}
              className="flex items-center gap-1.5 px-5 py-3 text-[14px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
        {totalItems > 0 && (
          <p className="text-[12px] text-[#5f6368] mt-3 pl-2">{totalItems} order{totalItems !== 1 ? 's' : ''} found</p>
        )}
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-2">
        {loading ? (
          <div className="bg-white border border-[#e8eaed] rounded-[24px] p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-[#5f6368]">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#e8eaed] rounded-[24px] p-8 text-center">
            <ShoppingCart className="w-10 h-10 text-[#dadce0] mx-auto mb-2" />
            <p className="text-[14px] text-[#5f6368]">No orders found</p>
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#e8eaed] rounded-[24px] p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-[15px] text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{order.order_number}</p>
                      {renderStatusBadge(order.status)}
                    </div>
                    <p className="text-[13px] text-[#5f6368]">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="font-medium text-[16px] text-[#1a73e8] flex-shrink-0" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{fmt(order.total_amount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-[13px]">
                  <div>
                    <p className="text-[#9aa0a6] mb-1">Customer</p>
                    <p className="font-medium text-[#202124] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{order.customer_name}</p>
                    <p className="text-[#5f6368] truncate">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-[#9aa0a6] mb-1">Payment</p>
                    <div className="mb-2">{renderPaymentMethod(order.payment_method)}</div>
                    {renderStatusBadge(order.payment_status, true)}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#e8eaed] hover:bg-[#f8f9fa] text-[#1a73e8] rounded-full font-medium text-[14px] transition-colors"
                >
                  <Eye className="h-5 w-5" />
                  View Details
                </button>
              </div>
            ))}

            {/* Mobile pagination */}
            <div className="bg-white border border-[#e8eaed] rounded-[24px] px-5 py-4 flex items-center justify-between">
              <p className="text-[13px] text-[#5f6368]">
                {totalItems > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}` : '0'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                  className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 text-[14px] font-medium text-[#202124]">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e8eaed]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide">Order #</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide">Date</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide">Customer</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide text-right">Amount</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide">Order Status</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide">Payment</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] uppercase tracking-wide text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[14px] text-[#5f6368]">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <ShoppingCart className="w-10 h-10 text-[#dadce0] mx-auto mb-2" />
                    <p className="text-[14px] text-[#5f6368]">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[14px] text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{order.order_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[14px] text-[#202124] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[12px] text-[#5f6368]">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      <p className="font-medium text-[14px] text-[#202124] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{order.customer_name}</p>
                      <p className="text-[12px] text-[#5f6368] truncate">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-[15px] text-[#1a73e8] whitespace-nowrap" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{fmt(order.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {renderStatusBadge(order.payment_status, true)}
                        <div>{renderPaymentMethod(order.payment_method)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors font-medium text-[13px] min-h-[40px]"
                        aria-label="View order details"
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

        {/* Desktop pagination */}
        {!loading && orders.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e8eaed] flex items-center justify-between">
            <p className="text-[13px] text-[#5f6368]">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`min-w-[32px] h-8 rounded-full text-[13px] font-medium transition-colors ${page === currentPage ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="w-8 h-8 flex items-center justify-center text-[#9aa0a6] text-[13px]">…</span>;
                  }
                  return null;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
