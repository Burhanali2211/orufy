import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Clock, XCircle,
  Search, ShoppingBag, AlertCircle, RefreshCw,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useCustomerOrders } from '@/shared/hooks/customer/useCustomerOrders';

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const OrdersPage: React.FC = () => {
  const { data: orders, isLoading: loading, error, refetch: fetchOrders } = useCustomerOrders();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const orderList: any[] = orders || [];

  const filteredOrders = orderList.filter((o: any) => {
    const status = (o.status || '').toLowerCase();
    const matchStatus = activeFilter === 'all' || status === activeFilter;
    const orderNum = (o.order_number || o.orderNumber || o.id || '').toLowerCase();
    const matchSearch =
      searchQuery === '' ||
      orderNum.includes(searchQuery.toLowerCase()) ||
      (o.items && o.items.some((item: any) => (item.product?.name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())));
    return matchStatus && matchSearch;
  });

  const filterCount = (id: string) => {
    if (id === 'all') return orderList.length;
    return orderList.filter((o: any) => (o.status || '').toLowerCase() === id).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-stone-900 text-white border-stone-900';
      case 'processing':
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  if (loading) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-stone-200 rounded-2xl" />
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (error) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-stone-800">Failed to load orders</p>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
      <div className="space-y-5">
        {/* ── Search & Status Filters ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order number or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => {
              const count = filterCount(f.id);
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Orders List ── */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => {
              const orderDate = new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              });
              const orderNum = order.order_number || order.orderNumber || `#${order.id.slice(0, 8)}`;
              const items = order.items || [];

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                        #
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-stone-900">{orderNum}</h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">Placed on {orderDate}</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-stone-500">Order Total</p>
                      <p className="text-sm sm:text-base font-bold text-stone-900">
                        {fmt(order.total_amount || order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="divide-y divide-stone-100">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200 flex items-center justify-center">
                              {item.product?.images?.[0] ? (
                                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {item.product?.name || item.name || 'Catalog Item'}
                              </p>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                Qty: {item.quantity} &bull; {fmt(item.price || item.unit_price)} each
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-stone-900 flex-shrink-0">
                            {fmt((parseFloat(item.price || item.unit_price || '0') * (item.quantity || 1)))}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tracking info if present */}
                    {order.tracking_number && (
                      <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-stone-700" />
                          <span className="text-stone-600">Tracking: <strong className="text-stone-900 font-mono">{order.tracking_number}</strong></span>
                        </div>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-900 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <span>Track Package</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">No matching orders found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : 'When you place orders, you can track their status and download invoices here.'}
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Store Catalog</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default OrdersPage;
