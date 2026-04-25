import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, DollarSign,
  AlertTriangle, Clock, ArrowRight,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
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
  price: number;
  imageUrls: string[];
  orderCount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStockLevel: number;
  imageUrls: string[];
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

      const res = await apiClient.get<{ data: { summary: Record<string, number>; recentOrders: Record<string, unknown>[]; topProducts: Record<string, unknown>[]; lowStockProducts: Record<string, unknown>[] } }>('/api/dashboard/analytics/summary');
      if (res.data) {
        const { summary, recentOrders: apiOrders, topProducts: apiTopProducts, lowStockProducts: apiLowStock } = res.data;

        const mappedMetrics: DashboardMetrics = {
          totalUsers: summary.totalUsers,
          totalProducts: summary.totalProducts,
          totalOrders: summary.totalOrders,
          totalRevenue: summary.totalRevenue,
          pendingOrders: summary.pendingOrders,
          lowStockProducts: summary.lowStockCount,
          newUsersToday: summary.newUsersToday,
          ordersToday: summary.ordersToday,
          revenueToday: summary.revenueToday,
        };

        setMetrics(mappedMetrics);
        setRecentOrders(apiOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          customerName: o.customerName,
        })));
        setTopProducts(apiTopProducts.map((p: any) => ({
          id: p.productId,
          name: p.name,
          price: p.price,
          imageUrls: p.imageUrls,
          orderCount: p.orderCount,
        })));
        setLowStockProducts(apiLowStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStockLevel: p.minStockLevel,
          imageUrls: p.imageUrls,
        })));

        _dashboardCache = {
          metrics: mappedMetrics,
          recentOrders: apiOrders as unknown as RecentOrder[],
          topProducts: apiTopProducts as unknown as TopProduct[],
          lowStockProducts: apiLowStock as unknown as LowStockProduct[],
        };
      }
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-8 w-8 bg-gray-100 rounded-lg mb-3" />
                <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
                <div className="h-7 bg-gray-100 rounded w-14" />
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
      sub: metrics.revenueToday > 0 ? `+${fmt(metrics.revenueToday)} today` : null,
      icon: DollarSign, bg: 'bg-slate-50', border: 'border-slate-200',
      iconBg: 'bg-slate-100', iconColor: 'text-slate-600', valueColor: 'text-slate-800',
    },
    {
      title: 'Total Orders', value: String(metrics.totalOrders),
      sub: metrics.ordersToday > 0 ? `${metrics.ordersToday} today` : null,
      icon: ShoppingCart, bg: 'bg-blue-50', border: 'border-blue-100',
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-700',
    },
    {
      title: 'Products', value: String(metrics.totalProducts),
      sub: metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} low stock` : 'All stocked',
      icon: Package, bg: 'bg-purple-50', border: 'border-purple-100',
      iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-700',
    },
    {
      title: 'Users', value: String(metrics.totalUsers),
      sub: metrics.newUsersToday > 0 ? `${metrics.newUsersToday} new today` : null,
      icon: Users, bg: 'bg-emerald-50', border: 'border-emerald-100',
      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700',
    },
  ] : [];

  return (
    <AdminDashboardLayout title="Dashboard" subtitle="Here's your store overview">
      <div className="space-y-5">
        {/* Quick actions banner */}
        <div className="bg-slate-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">Admin Control Center</h2>
            <p className="text-sm text-slate-300">Manage your entire store from here</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/products/add"
              className="inline-flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Package className="w-4 h-4" /> Add Product
            </Link>
            <Link to="/admin/orders"
              className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors">
              <ShoppingCart className="w-4 h-4" /> View Orders
            </Link>
            <button onClick={() => fetchDashboardData()}
              className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.title} className={`${stat.bg} border ${stat.border} rounded-xl p-4`}>
              <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.valueColor} mt-0.5`}>{stat.value}</p>
              {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {metrics && (metrics.pendingOrders > 0 || metrics.lowStockProducts > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {metrics.pendingOrders > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{metrics.pendingOrders} Pending Orders</p>
                    <p className="text-xs text-gray-500">Need attention</p>
                  </div>
                </div>
                <Link to="/admin/orders"
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors flex-shrink-0">
                  Review
                </Link>
              </div>
            )}
            {metrics.lowStockProducts > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{metrics.lowStockProducts} Low Stock Items</p>
                    <p className="text-xs text-gray-500">Need restocking</p>
                  </div>
                </div>
                <Link to="/admin/products"
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex-shrink-0">
                  Manage
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Recent orders + top products */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/admin/orders"
                className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.length > 0 ? recentOrders.map((order) => {
                const cfg = getOrderStatusConfig(order.status);
                const cls = getAdminStatusClasses(order.status);
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 truncate">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${cls}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900">{fmt(order.total)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Top Products</h3>
                <Link to="/admin/products" className="text-xs text-slate-600 hover:text-slate-800 font-medium">View All</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {topProducts.slice(0, 4).map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-sm font-bold text-slate-400 w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.orderCount} orders</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{fmt(product.price)}</p>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-gray-400">No sales data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Today</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Orders</span>
                  <span className="font-semibold text-gray-900">{metrics?.ordersToday ?? 0}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.min((metrics?.ordersToday ?? 0) * 10, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">New Users</span>
                  <span className="font-semibold text-gray-900">{metrics?.newUsersToday ?? 0}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min((metrics?.newUsersToday ?? 0) * 10, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <span className="font-semibold text-gray-900">{fmt(metrics?.revenueToday ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-base font-semibold text-gray-900">Low Stock Alert</h3>
            </div>
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="bg-white border border-red-100 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.imageUrls?.[0]
                      ? <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-gray-300" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-red-600 font-semibold">{product.stock} left (min {product.minStockLevel})</p>
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
