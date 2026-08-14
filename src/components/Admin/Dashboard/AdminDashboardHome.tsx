import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, DollarSign,
  AlertTriangle, Clock, ArrowRight,
  RefreshCw, TrendingUp, Globe, Plus,
  ArrowUpRight, Zap
} from 'lucide-react';
import { supabase } from '../../../lib/legacyDb';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { getAdminStatusClasses, getOrderStatusConfig } from '../../../utils/orderStatusUtils';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardMetrics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
}

interface TopProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
  stock: number;
  total_sold: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
  customer_name: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock_level: number;
  images: string[];
}

// Module-level cache – survives SPA navigation, cleared on hard refresh
let _dashboardCache: {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
} | null = null;

export const AdminDashboardHome: React.FC = () => {
  const { user, store } = useAuth();
  const [loading, setLoading] = useState(_dashboardCache === null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(_dashboardCache?.metrics ?? null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(_dashboardCache?.topProducts ?? []);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(_dashboardCache?.recentOrders ?? []);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(_dashboardCache?.lowStockProducts ?? []);
  const { showError } = useNotification();
  const isFirstMount = React.useRef(true);

  const storeUrl = store ? `https://${store.hostname}` : null;
  const isNewStore = !loading && metrics?.totalProducts === 0 && metrics?.totalOrders === 0;

  useEffect(() => {
    const background = isFirstMount.current && _dashboardCache !== null;
    isFirstMount.current = false;
    fetchDashboardData(background);
  }, []);

  const fetchDashboardData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: totalProducts },
        { count: totalOrders },
        { count: pendingOrders },
        ordersRes,
        profilesRes,
        productsAllRes,
        lowStockRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id, order_number, total_amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('products').select('id, name, price, images, stock, min_stock_level'),
        supabase.from('products').select('id, name, price, images, stock, min_stock_level').lte('stock', 20).limit(8),
      ]);

      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
      const ordersToday = orders.filter((o: any) => o.created_at >= todayIso).length;
      const revenueToday = orders
        .filter((o: any) => o.created_at >= todayIso && (o.status === 'delivered' || o.status === 'shipped'))
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);

      const allOrdersForRevenue = await apiClient.get('/orders');
      const totalRevenue = (allOrdersForRevenue.data || []).reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);

      const lowStockCount = (productsAllRes.data || []).filter((p: any) =>
        p.min_stock_level != null ? p.stock <= p.min_stock_level : p.stock <= 20
      ).length;

      const newMetrics = {
        totalUsers: totalUsers ?? 0,
        totalProducts: totalProducts ?? 0,
        totalOrders: totalOrders ?? 0,
        totalRevenue,
        pendingOrders: pendingOrders ?? 0,
        lowStockProducts: lowStockCount,
        newUsersToday: newUsersToday ?? 0,
        ordersToday,
        revenueToday,
      };
      setMetrics(newMetrics);

      const newRecentOrders = orders.slice(0, 5).map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        customer_name: profileMap[o.user_id]?.full_name || 'Guest',
      }));
      setRecentOrders(newRecentOrders);

      const newLowStock = (lowStockRes.data || []).map((p: any) => ({
        id: p.id, name: p.name, stock: p.stock,
        min_stock_level: p.min_stock_level ?? 20, images: p.images || [],
      }));
      setLowStockProducts(newLowStock);

      const orderItemsRes = await apiClient.get('/order-items');
      const soldByProduct: Record<string, number> = {};
      (orderItemsRes.data || []).forEach((oi: any) => {
        soldByProduct[oi.product_id] = (soldByProduct[oi.product_id] || 0) + (oi.quantity || 0);
      });
      const topIds = Object.entries(soldByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      let computedTopProducts: TopProduct[];
      if (topIds.length > 0) {
        const topRes = await apiClient.get('/products');
        computedTopProducts = (topRes.data || [])
          .map((p: any) => ({ ...p, total_sold: String(soldByProduct[p.id] || 0) }))
          .sort((a, b) => parseInt(b.total_sold) - parseInt(a.total_sold));
      } else {
        computedTopProducts = (productsAllRes.data || []).slice(0, 5).map((p: any) => ({ ...p, total_sold: '0' }));
      }
      setTopProducts(computedTopProducts);

      _dashboardCache = {
        metrics: newMetrics,
        topProducts: computedTopProducts,
        recentOrders: newRecentOrders,
        lowStockProducts: newLowStock,
      };
    } catch (error: any) {
      if (!background) showError('Error', error.message || 'Failed to load dashboard data');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const fmt = (n: number | string) => {
    const v = typeof n === 'string' ? parseFloat(n) : n;
    return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <AdminDashboardLayout title="Dashboard" subtitle="Loading your store overview...">
        <div className="space-y-6 animate-pulse">
          <div className="h-36 bg-zinc-100 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-100 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-zinc-100 rounded-2xl" />
            <div className="h-64 bg-zinc-100 rounded-2xl" />
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const statCards = metrics ? [
    {
      title: 'Total Revenue',
      value: fmt(metrics.totalRevenue),
      sub: metrics.revenueToday > 0 ? `+${fmt(metrics.revenueToday)} today` : 'All time',
      icon: DollarSign,
      trend: metrics.revenueToday > 0 ? 'up' : null,
    },
    {
      title: 'Orders',
      value: String(metrics.totalOrders),
      sub: metrics.ordersToday > 0 ? `${metrics.ordersToday} today` : 'Total placed',
      icon: ShoppingCart,
      trend: metrics.ordersToday > 0 ? 'up' : null,
    },
    {
      title: 'Products',
      value: String(metrics.totalProducts),
      sub: metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} low stock` : 'Catalog healthy',
      icon: Package,
      trend: metrics.lowStockProducts > 0 ? 'warn' : null,
    },
    {
      title: 'Customers',
      value: String(metrics.totalUsers),
      sub: metrics.newUsersToday > 0 ? `${metrics.newUsersToday} new today` : 'Total registered',
      icon: Users,
      trend: metrics.newUsersToday > 0 ? 'up' : null,
    },
  ] : [];

  return (
    <AdminDashboardLayout title="Overview" subtitle="Monitor your store performance">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ── Hero Welcome Section ── */}
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px, 30px 30px'
          }} />

          <div className="relative px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-zinc-400 text-[13px] font-medium mb-1">{greeting}, {firstName} 👋</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
                {store?.name || 'Your Store'}
              </h2>
              {storeUrl && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {store?.hostname}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/admin/products/add"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 rounded-xl text-[13px] font-bold hover:bg-zinc-50 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Link>
              {storeUrl && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-[13px] font-semibold hover:bg-white/15 active:scale-95 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  View Live Store
                </a>
              )}
              <button
                onClick={() => fetchDashboardData()}
                className="inline-flex items-center justify-center px-3 py-2.5 bg-white/10 text-white/70 border border-white/10 rounded-xl hover:bg-white/15 transition-all"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── New Store Empty State ── */}
        {isNewStore && (
          <div className="bg-white border border-zinc-200 rounded-2xl px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">Ready to launch? Start building your catalog</h3>
            <p className="text-sm text-zinc-500 mb-5 max-w-md mx-auto">
              Add your first product to start selling. Your store is live — customers are already able to browse it!
            </p>
            <Link
              to="/admin/products/add"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </Link>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white border border-zinc-200/80 rounded-xl p-4 sm:p-5 hover:shadow-sm hover:border-zinc-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-zinc-500" />
                </div>
                {stat.trend === 'up' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> UP
                  </span>
                )}
                {stat.trend === 'warn' && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                    LOW
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold uppercase tracking-wide">{stat.title}</p>
              {stat.sub && (
                <p className="text-[10px] text-zinc-400 mt-1 hidden sm:block">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Action Alerts ── */}
        {metrics && (metrics.pendingOrders > 0 || metrics.lowStockProducts > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {metrics.pendingOrders > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{metrics.pendingOrders} Pending Orders</p>
                    <p className="text-xs text-zinc-400">Awaiting fulfillment</p>
                  </div>
                </div>
                <Link
                  to="/admin/orders"
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex-shrink-0"
                >
                  Review
                </Link>
              </div>
            )}
            {metrics.lowStockProducts > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{metrics.lowStockProducts} Low Stock Items</p>
                    <p className="text-xs text-zinc-400">Re-stock threshold reached</p>
                  </div>
                </div>
                <Link
                  to="/admin/products"
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex-shrink-0"
                >
                  Manage
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Orders + Top Products ── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div>
                <h3 className="text-[14px] font-bold text-zinc-900">Recent Orders</h3>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Latest customer purchases</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-[12px] text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-50">
              {recentOrders.length > 0 ? recentOrders.map((order) => {
                const cfg = getOrderStatusConfig(order.status);
                const cls = getAdminStatusClasses(order.status);
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/60 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[13px] text-zinc-900">{order.order_number}</p>
                        <p className="text-[11px] text-zinc-400 font-medium truncate">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${cls}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </div>
                      <p className="font-bold text-[13px] text-zinc-900 w-20 text-right">{fmt(order.total_amount)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-6 py-14 text-center">
                  <ShoppingCart className="w-10 h-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-[12px] text-zinc-400 font-medium">No orders yet</p>
                  <p className="text-[11px] text-zinc-300 mt-0.5">Share your store to start receiving orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Top Selling */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-[14px] font-bold text-zinc-900">Top Selling</h3>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Best performers</p>
                </div>
                <Link to="/admin/products" className="text-[12px] text-zinc-500 hover:text-zinc-900 font-semibold transition-colors">
                  Catalog
                </Link>
              </div>
              <div className="divide-y divide-zinc-50">
                {topProducts.slice(0, 4).map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/60 transition-colors">
                    <span className="text-[11px] font-bold text-zinc-300 w-4 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-zinc-400">{product.total_sold} sold</p>
                    </div>
                    <p className="text-[12px] font-extrabold text-zinc-900 flex-shrink-0">{fmt(product.price)}</p>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[11px] text-zinc-400">No sales data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today Summary */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5">
              <h3 className="text-[14px] font-bold text-zinc-900 mb-0.5">Daily Summary</h3>
              <p className="text-[11px] text-zinc-400 font-medium mb-5">Activity recorded today</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[12px] font-semibold text-zinc-700 mb-1.5">
                    <span>New Orders</span>
                    <span className="text-zinc-900 font-bold">{metrics?.ordersToday ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full transition-all duration-700" style={{ width: `${Math.min((metrics?.ordersToday ?? 0) * 10, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[12px] font-semibold text-zinc-700 mb-1.5">
                    <span>New Customers</span>
                    <span className="text-zinc-900 font-bold">{metrics?.newUsersToday ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full transition-all duration-700" style={{ width: `${Math.min((metrics?.newUsersToday ?? 0) * 10, 100)}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-zinc-500">Revenue Today</span>
                  <span className="text-[13px] font-extrabold text-zinc-900">{fmt(metrics?.revenueToday ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Low Stock Alert ── */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-zinc-900">Low Stock Alert</h3>
                <p className="text-[10px] text-zinc-400">{lowStockProducts.length} items need restocking</p>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="border border-zinc-100 rounded-xl p-2.5 flex items-center gap-2.5 hover:border-zinc-200 transition-colors">
                  <div className="w-8 h-8 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-zinc-300" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-amber-500 font-semibold">{product.stock} left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;
