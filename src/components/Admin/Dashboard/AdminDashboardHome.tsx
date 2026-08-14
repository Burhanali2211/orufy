import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, DollarSign,
  AlertTriangle, Clock, ArrowUpRight, ArrowRight,
  RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
import { supabase } from '../../../lib/legacyDb';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { getAdminStatusClasses, getOrderStatusConfig } from '../../../utils/orderStatusUtils';

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
  const [loading, setLoading] = useState(_dashboardCache === null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(_dashboardCache?.metrics ?? null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(_dashboardCache?.topProducts ?? []);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(_dashboardCache?.recentOrders ?? []);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(_dashboardCache?.lowStockProducts ?? []);
  const { showError } = useNotification();
  const isFirstMount = React.useRef(true);

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

      setMetrics({
        totalUsers: totalUsers ?? 0,
        totalProducts: totalProducts ?? 0,
        totalOrders: totalOrders ?? 0,
        totalRevenue,
        pendingOrders: pendingOrders ?? 0,
        lowStockProducts: lowStockCount,
        newUsersToday: newUsersToday ?? 0,
        ordersToday,
        revenueToday,
      });

      setRecentOrders(orders.slice(0, 5).map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        customer_name: profileMap[o.user_id]?.full_name || 'Guest',
      })));

      setLowStockProducts((lowStockRes.data || []).map((p: any) => ({
        id: p.id, name: p.name, stock: p.stock,
        min_stock_level: p.min_stock_level ?? 20, images: p.images || [],
      })));

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

      // Update module-level cache so next navigation is instant
      _dashboardCache = {
        metrics: {
          totalUsers: totalUsers ?? 0,
          totalProducts: totalProducts ?? 0,
          totalOrders: totalOrders ?? 0,
          totalRevenue,
          pendingOrders: pendingOrders ?? 0,
          lowStockProducts: lowStockCount,
          newUsersToday: newUsersToday ?? 0,
          ordersToday,
          revenueToday,
        },
        topProducts: computedTopProducts,
        recentOrders: orders.slice(0, 5).map((o: any) => ({
          id: o.id,
          order_number: o.order_number || o.id,
          total_amount: o.total_amount,
          status: o.status,
          created_at: o.created_at,
          customer_name: profileMap[o.user_id]?.full_name || 'Guest',
        })),
        lowStockProducts: (lowStockRes.data || []).map((p: any) => ({
          id: p.id, name: p.name, stock: p.stock,
          min_stock_level: p.min_stock_level ?? 20, images: p.images || [],
        })),
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

  if (loading) {
    return (
      <AdminDashboardLayout title="Dashboard" subtitle="Welcome back, Admin!">
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-xl p-4 hidden">
                <div className="h-3 bg-zinc-100 rounded w-16 mb-3" />
                <div className="h-6 bg-zinc-100 rounded w-12 mb-1" />
                <div className="h-2.5 bg-zinc-100 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const statCards = metrics ? [
    {
      title: 'Total Revenue', value: fmt(metrics.totalRevenue),
      sub: metrics.revenueToday > 0 ? `+${fmt(metrics.revenueToday)} today` : 'All time total',
      icon: DollarSign,
    },
    {
      title: 'Total Orders', value: String(metrics.totalOrders),
      sub: metrics.ordersToday > 0 ? `${metrics.ordersToday} placed today` : 'Total completed',
      icon: ShoppingCart,
    },
    {
      title: 'Active Products', value: String(metrics.totalProducts),
      sub: metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} items low stock` : 'Catalog healthy',
      icon: Package,
    },
    {
      title: 'Registered Customers', value: String(metrics.totalUsers),
      sub: metrics.newUsersToday > 0 ? `${metrics.newUsersToday} new today` : 'Total customer base',
      icon: Users,
    },
  ] : [];

  return (
    <AdminDashboardLayout title="Overview" subtitle="Monitor sales, orders, and product performance">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Quick actions banner - Clean Human SaaS Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight mb-1">Store Dashboard</h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium">Quick shortcuts for daily catalog and order management</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/admin/products/add"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs min-h-[44px]">
              <Package className="w-4 h-4 text-zinc-300" />
              <span>+ Quick Add Product</span>
            </Link>
            <Link to="/admin/orders"
              className="inline-flex items-center justify-center gap-2 bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px]">
              <ShoppingCart className="w-4 h-4 text-zinc-400" />
              <span>View Orders</span>
            </Link>
            <button onClick={fetchDashboardData}
              className="inline-flex items-center justify-center gap-2 bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
              title="Refresh Data">
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Stat cards - 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 hover:border-zinc-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight leading-none mb-1.5">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-wide leading-tight">{stat.title}</p>
              {stat.sub && <p className="text-[10px] text-zinc-400 mt-1 leading-tight hidden sm:block">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Action Alerts */}
        {metrics && (metrics.pendingOrders > 0 || metrics.lowStockProducts > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {metrics.pendingOrders > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{metrics.pendingOrders} Pending Orders</p>
                    <p className="text-xs text-zinc-400">Awaiting fulfillment</p>
                  </div>
                </div>
                <Link to="/admin/orders"
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex-shrink-0">
                  Review
                </Link>
              </div>
            )}
            {metrics.lowStockProducts > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{metrics.lowStockProducts} Low Stock Items</p>
                    <p className="text-xs text-zinc-400">Re-stock threshold reached</p>
                  </div>
                </div>
                <Link to="/admin/products"
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex-shrink-0">
                  Manage
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Recent orders + top products */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Recent Orders</h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">Latest customer purchases</p>
              </div>
              <Link to="/admin/orders"
                className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1">
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentOrders.length > 0 ? recentOrders.map((order) => {
                const cfg = getOrderStatusConfig(order.status);
                const cls = getAdminStatusClasses(order.status);
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/80 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-zinc-900">{order.order_number}</p>
                        <p className="text-xs text-zinc-500 font-medium truncate">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cls}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </div>
                      <p className="font-bold text-sm text-zinc-900">{fmt(order.total_amount)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-6 py-12 text-center">
                  <ShoppingCart className="w-10 h-10 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No recent orders found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Top Products */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Top Selling</h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">Best performing items</p>
                </div>
                <Link to="/admin/products" className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold">View Catalog</Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {topProducts.slice(0, 4).map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-zinc-50/80 transition-colors">
                    <span className="text-xs font-bold text-zinc-400 w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{product.name}</p>
                      <p className="text-[11px] text-zinc-400 font-medium">{product.total_sold} units sold</p>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-zinc-900 flex-shrink-0">{fmt(product.price)}</p>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <p className="text-xs text-zinc-400 font-medium">No sales data recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today summary */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs">
              <h3 className="text-base font-bold text-zinc-900 mb-1">Daily Summary</h3>
              <p className="text-xs text-zinc-400 font-medium mb-5">Activity recorded today</p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1.5">
                    <span>New Orders</span>
                    <span className="font-bold text-zinc-900">{metrics?.ordersToday ?? 0}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${Math.min((metrics?.ordersToday ?? 0) * 10, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1.5">
                    <span>New Customers</span>
                    <span className="font-bold text-zinc-900">{metrics?.newUsersToday ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${Math.min((metrics?.newUsersToday ?? 0) * 10, 100)}%` }} />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Today's Revenue</span>
                  <span className="text-sm font-extrabold text-zinc-900">{fmt(metrics?.revenueToday ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
              <AlertTriangle className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-bold text-zinc-900">Low Stock Alert</h3>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="border border-zinc-100 rounded-lg p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-zinc-300" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-zinc-400">{product.stock} left</p>
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
