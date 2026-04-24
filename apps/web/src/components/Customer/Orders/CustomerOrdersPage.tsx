import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Clock, XCircle,
  Search, ShoppingBag, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { CustomerDashboardLayout } from '../Layout/CustomerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useAuth } from '../../../contexts/AuthContext';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    classes: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed:  { label: 'Confirmed',  classes: 'bg-blue-50 text-blue-700 border-blue-200',      icon: <Package className="w-3.5 h-3.5" /> },
  processing: { label: 'Processing', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Package className="w-3.5 h-3.5" /> },
  shipped:    { label: 'Shipped',    classes: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:  { label: 'Delivered',  classes: 'bg-green-50 text-green-700 border-green-200',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled:  { label: 'Cancelled',  classes: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle className="w-3.5 h-3.5" /> },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Package className="w-3.5 h-3.5" /> };

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped',   label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.get<any>('/api/user/orders');
      if (res.error) throw new Error(res.error.message || 'Failed to fetch orders');
      
      const ordersData = res.data?.data || res.data || [];

      // Map to ensure it fits the Order interface
      const ordersWithItems: Order[] = ordersData.map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.id.slice(0, 8).toUpperCase(),
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        total_amount: Number(o.total_amount),
        created_at: o.created_at,
        items: (o.items || []).map((i: any) => ({
          id: i.id,
          product_name: i.product_name || i.products?.name || 'Product',
          product_image: i.product_image || (Array.isArray(i.products?.images) ? i.products.images[0] : ''),
        })),
      }));

      setOrders(ordersWithItems);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = activeFilter === 'all' || o.status === activeFilter;
    const matchSearch = searchQuery === '' ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filterCount = (id: string) =>
    id === 'all' ? orders.length : orders.filter(o => o.status === id).length;

  if (loading) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track and manage your orders">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-36" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (error) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track and manage your orders">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="My Orders" subtitle="Track and manage your orders">
      <div className="space-y-4">

        {/* Search + filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => {
              const count = filterCount(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeFilter === f.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeFilter === f.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-sm text-gray-500 mb-5">
              {searchQuery ? 'Try a different search term.' : "You haven't placed any orders yet."}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const cfg = getStatusConfig(order.status);
              const isCOD = order.payment_method?.toLowerCase().includes('cash') ||
                order.payment_method?.toLowerCase() === 'cod';
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {/* Product thumbnails */}
                      <div className="flex -space-x-2 flex-shrink-0">
                        {order.items.length === 0 && (
                          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border-2 border-white">
                            <Package className="w-5 h-5 text-purple-400" />
                          </div>
                        )}
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-gray-100 flex-shrink-0"
                            style={{ zIndex: order.items.length - idx }}
                          >
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            #{order.order_number}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${cfg.classes}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          {isCOD && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              COD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {' · '}
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                        {order.items.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {order.items.map(i => i.product_name).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </p>
                        {order.payment_status === 'paid' && (
                          <p className="text-xs text-green-600 font-medium">Paid</p>
                        )}
                        {order.payment_status === 'pending' && (
                          <p className="text-xs text-amber-600 font-medium">
                            {isCOD ? 'Pay on delivery' : 'Pending'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                      <Link
                        to={`/track-order/${order.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Track Order
                      </Link>
                      <Link
                        to={`/track-order/${order.id}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerOrdersPage;
