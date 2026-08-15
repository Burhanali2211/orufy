import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, TrendingUp,
  AlertTriangle, Clock, ArrowRight,
  RefreshCw, Plus, ExternalLink, CheckCircle2,
  BarChart2, Inbox
} from 'lucide-react';
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

let _dashboardCache: {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
} | null = null;

// ─── Design tokens (Google Material 3) ───────────────────────────────────────
const G = {
  blue: '#1a73e8',
  blueLight: '#e8f0fe',
  blueMid: '#d2e3fc',
  green: '#34a853',
  greenLight: '#e6f4ea',
  yellow: '#fbbc04',
  yellowLight: '#fef7e0',
  red: '#ea4335',
  redLight: '#fce8e6',
  text: '#202124',
  textSec: '#5f6368',
  textTer: '#80868b',
  border: '#e8eaed',
  surface: '#fff',
  bg: '#f8f9fa',
  divider: '#f1f3f4',
};

// ─── Utility: format INR ─────────────────────────────────────────────────────
const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, trend, color = G.blue,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: 'up' | 'down' | 'warn' | null; color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-shadow duration-150"
      style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(32,33,36,.12)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {trend === 'up' && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: G.greenLight, color: G.green }}>
            <TrendingUp className="w-3 h-3" /> Up
          </span>
        )}
        {trend === 'warn' && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: G.yellowLight, color: '#b45309' }}>Low</span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: G.text, fontFamily: "'Google Sans', Inter, sans-serif" }}>
          {value}
        </p>
        <p className="text-[12px] font-medium mt-1" style={{ color: G.textSec }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: G.textTer }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, actionTo, children }: {
  title: string; subtitle?: string;
  action?: string; actionTo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: G.surface, border: `1px solid ${G.border}` }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${G.divider}` }}>
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: G.text, fontFamily: "'Google Sans', Inter, sans-serif" }}>
            {title}
          </h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: G.textSec }}>{subtitle}</p>}
        </div>
        {action && actionTo && (
          <Link
            to={actionTo}
            className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
            style={{ color: G.blue }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {action} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
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

  // Greeting
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const isNewStore = !loading && metrics?.totalProducts === 0 && metrics?.totalOrders === 0;

  useEffect(() => {
    const bg = isFirstMount.current && _dashboardCache !== null;
    isFirstMount.current = false;
    fetchDashboardData(bg);
  }, []);

  const fetchDashboardData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        apiClient.get('/merchant/orders'),
        apiClient.get('/products'),
        apiClient.get('/merchant/orders/customers/list'),
      ]);

      const storeOrders = ordersRes.data?.orders || [];
      const productsList = productsRes.data || [];
      const customersList = customersRes.data || [];

      // Customers stats
      const totalUsers = customersList.length;
      const newUsersToday = customersList.filter((c: any) => c.created_at >= todayIso).length;

      // Products stats
      const totalProducts = productsList.length;
      const lowStockProductsList = productsList.filter((p: any) => 
        (p.min_stock_level != null ? p.stock <= p.min_stock_level : p.stock <= 20) && p.is_active
      );
      const lowStockCount = lowStockProductsList.length;

      // Orders stats
      const totalOrders = storeOrders.length;
      const pendingOrders = storeOrders.filter((o: any) => o.status === 'pending' || o.fulfillment_status === 'UNFULFILLED').length;
      const ordersToday = storeOrders.filter((o: any) => o.created_at >= todayIso).length;
      
      const revenueToday = storeOrders
        .filter((o: any) => o.created_at >= todayIso && o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
        
      const totalRevenue = storeOrders
        .filter((o: any) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);

      const m: DashboardMetrics = {
        totalUsers, totalProducts,
        totalOrders, totalRevenue,
        pendingOrders, lowStockProducts: lowStockCount,
        newUsersToday, ordersToday, revenueToday,
      };
      setMetrics(m);

      const ro = storeOrders.slice(0, 5).map((o: any) => ({
        id: o.id, order_number: o.order_number || o.id,
        total_amount: o.total_amount, status: o.status,
        created_at: o.created_at, 
        customer_name: o.guest_email || (o.shipping_address as any)?.full_name || 'Guest',
      }));
      setRecentOrders(ro);

      const ls = lowStockProductsList.slice(0, 8).map((p: any) => ({
        id: p.id, name: p.name, stock: p.stock, min_stock_level: p.min_stock_level ?? 20, images: p.images || [],
      }));
      setLowStockProducts(ls);

      // Top Products (compute sold quantities from storeOrders)
      const soldMap: Record<string, number> = {};
      storeOrders.forEach((ord: any) => {
        if (ord.status !== 'CANCELLED' && ord.items) {
          ord.items.forEach((oi: any) => {
            soldMap[oi.product_id] = (soldMap[oi.product_id] || 0) + (oi.quantity || 0);
          });
        }
      });
      
      let tp: TopProduct[];
      if (Object.keys(soldMap).length > 0) {
        tp = productsList.map((p: any) => ({ ...p, total_sold: String(soldMap[p.id] || 0) }))
          .sort((a: any, b: any) => parseInt(b.total_sold) - parseInt(a.total_sold))
          .slice(0, 5);
      } else {
        tp = productsList.slice(0, 5).map((p: any) => ({ ...p, total_sold: '0' }));
      }
      setTopProducts(tp);
      
      _dashboardCache = { metrics: m, topProducts: tp, recentOrders: ro, lowStockProducts: ls };
    } catch (error: any) {
      if (!background) showError('Error', error.message || 'Failed to load dashboard');
    } finally {
      if (!background) setLoading(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminDashboardLayout title="Overview">
        <div className="space-y-5">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: G.border }} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: G.border }} />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-72 rounded-2xl animate-pulse" style={{ background: G.border }} />
            <div className="h-72 rounded-2xl animate-pulse" style={{ background: G.border }} />
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <AdminDashboardLayout title="Overview">
      <div className="space-y-6 pb-10">

        {/* ── Page title + actions ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div>
            <h1
              className="text-[22px] font-normal leading-tight"
              style={{ color: G.text, fontFamily: "'Google Sans', Inter, sans-serif" }}
            >
              {greeting}, {firstName}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: G.textSec }}>
              {store?.name || 'Your store'} · <span style={{ color: G.blue }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {storeUrl && (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border transition-colors"
                style={{ color: G.blue, borderColor: '#dadce0', background: G.surface }}
                onMouseEnter={e => (e.currentTarget.style.background = G.blueLight)}
                onMouseLeave={e => (e.currentTarget.style.background = G.surface)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View store
              </a>
            )}
            <Link
              to="/admin/products/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors"
              style={{ background: G.blue, color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1557b0')}
              onMouseLeave={e => (e.currentTarget.style.background = G.blue)}
            >
              <Plus className="w-4 h-4" />
              Add product
            </Link>
            <button
              onClick={() => fetchDashboardData()}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
              style={{ borderColor: '#dadce0', color: G.textSec, background: G.surface }}
              onMouseEnter={e => (e.currentTarget.style.background = G.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = G.surface)}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── New store empty state ──────────────────────────────────────── */}
        {isNewStore && (
          <div
            className="rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6"
            style={{ background: G.blueLight, border: `1px solid ${G.blueMid}` }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: G.blue }}>
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[15px] font-semibold mb-1" style={{ color: G.text }}>
                Your store is live — start adding products
              </p>
              <p className="text-[13px]" style={{ color: G.textSec }}>
                Customers can already browse your store at <span style={{ color: G.blue }}>{store?.hostname}</span>. Add your first product to start selling.
              </p>
            </div>
            <Link
              to="/admin/products/add"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold"
              style={{ background: G.blue, color: '#fff' }}
            >
              <Plus className="w-4 h-4" /> Add product
            </Link>
          </div>
        )}

        {/* ── Alert banners ──────────────────────────────────────────────── */}
        {metrics && (metrics.pendingOrders > 0 || metrics.lowStockProducts > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {metrics.pendingOrders > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{ background: G.blueLight, border: `1px solid ${G.blueMid}` }}>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: G.blue }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: G.blue }}>
                      {metrics.pendingOrders} orders waiting
                    </p>
                    <p className="text-[11px]" style={{ color: '#4a90d9' }}>Need fulfillment</p>
                  </div>
                </div>
                <Link to="/admin/orders"
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={{ background: G.blue, color: '#fff' }}>
                  Review
                </Link>
              </div>
            )}
            {metrics.lowStockProducts > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{ background: G.yellowLight, border: '1px solid #fce9a6' }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#b45309' }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: '#92400e' }}>
                      {metrics.lowStockProducts} items low stock
                    </p>
                    <p className="text-[11px]" style={{ color: '#b45309' }}>Restock soon</p>
                  </div>
                </div>
                <Link to="/admin/inventory"
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: '#d97706', color: '#92400e', background: 'transparent' }}>
                  Manage
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Metric cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue" icon={BarChart2}
            value={fmt(metrics?.totalRevenue ?? 0)} color={G.blue}
            sub={metrics?.revenueToday ? `+${fmt(metrics.revenueToday)} today` : 'All time'}
            trend={metrics?.revenueToday ? 'up' : null}
          />
          <MetricCard
            label="Orders" icon={ShoppingCart}
            value={String(metrics?.totalOrders ?? 0)} color={G.green}
            sub={metrics?.ordersToday ? `${metrics.ordersToday} placed today` : 'Total'}
            trend={metrics?.ordersToday ? 'up' : null}
          />
          <MetricCard
            label="Products" icon={Package}
            value={String(metrics?.totalProducts ?? 0)} color="#f9ab00"
            sub={metrics?.lowStockProducts ? `${metrics.lowStockProducts} low stock` : 'Catalog healthy'}
            trend={metrics?.lowStockProducts ? 'warn' : null}
          />
          <MetricCard
            label="Customers" icon={Users}
            value={String(metrics?.totalUsers ?? 0)} color="#a142f4"
            sub={metrics?.newUsersToday ? `+${metrics.newUsersToday} today` : 'Total registered'}
            trend={metrics?.newUsersToday ? 'up' : null}
          />
        </div>

        {/* ── Main content grid ──────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <SectionCard title="Recent Orders" subtitle="Latest transactions" action="View all" actionTo="/admin/orders">
              {recentOrders.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${G.divider}` }}>
                      {['Order', 'Customer', 'Status', 'Amount'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: G.textSec }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => {
                      const cfg = getOrderStatusConfig(order.status);
                      const Icon = cfg.icon;
                      const isLast = i === recentOrders.length - 1;

                      // Color each status distinctly
                      const statusStyle = order.status === 'delivered'
                        ? { background: G.greenLight, color: G.green }
                        : order.status === 'pending'
                        ? { background: G.blueLight, color: G.blue }
                        : order.status === 'cancelled'
                        ? { background: G.redLight, color: G.red }
                        : { background: G.yellowLight, color: '#b45309' };

                      return (
                        <tr
                          key={order.id}
                          style={{ borderBottom: isLast ? 'none' : `1px solid ${G.divider}` }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = G.bg)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          className="transition-colors cursor-default"
                        >
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-semibold" style={{ color: G.blue }}>
                              {order.order_number}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px]" style={{ color: G.text }}>{order.customer_name}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={statusStyle}
                            >
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-semibold" style={{ color: G.text }}>
                              {fmt(order.total_amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-14 text-center flex flex-col items-center gap-3">
                  <Inbox className="w-10 h-10" style={{ color: G.border }} />
                  <p className="text-[13px]" style={{ color: G.textSec }}>No orders yet</p>
                  {storeUrl && (
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] font-semibold" style={{ color: G.blue }}>
                      Share your store →
                    </a>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Top Selling */}
            <SectionCard title="Top Products" subtitle="By units sold" action="Catalog" actionTo="/admin/products">
              <div>
                {topProducts.slice(0, 5).map((product, i) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors"
                    style={{ borderBottom: i < 4 ? `1px solid ${G.divider}` : 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = G.bg)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <span className="text-[12px] font-bold w-4 flex-shrink-0" style={{ color: G.textTer }}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: G.bg }}>
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        : <Package className="w-4 h-4" style={{ color: G.textTer }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: G.text }}>{product.name}</p>
                      <p className="text-[10px]" style={{ color: G.textSec }}>{product.total_sold} sold</p>
                    </div>
                    <p className="text-[12px] font-semibold flex-shrink-0" style={{ color: G.text }}>
                      {fmt(product.price)}
                    </p>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[12px]" style={{ color: G.textSec }}>No sales data yet</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Today at a glance */}
            <SectionCard title="Today" subtitle="Activity summary">
              <div className="px-5 py-4 space-y-5">
                {/* Progress rows */}
                {[
                  { label: 'Orders', value: metrics?.ordersToday ?? 0, max: 20 },
                  { label: 'New customers', value: metrics?.newUsersToday ?? 0, max: 10 },
                ].map(({ label, value, max }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-medium" style={{ color: G.text }}>{label}</span>
                      <span className="text-[12px] font-bold" style={{ color: G.text }}>{value}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: G.divider }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: G.blue }}
                      />
                    </div>
                  </div>
                ))}

                {/* Revenue today */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${G.divider}` }}>
                  <span className="text-[12px] font-medium" style={{ color: G.textSec }}>Revenue today</span>
                  <span className="text-[14px] font-bold" style={{ color: G.text }}>
                    {fmt(metrics?.revenueToday ?? 0)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── Low Stock ──────────────────────────────────────────────────── */}
        {lowStockProducts.length > 0 && (
          <SectionCard title="Low Stock Alert" subtitle={`${lowStockProducts.length} items need restocking`}>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {lowStockProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ border: `1px solid ${G.border}`, background: G.surface }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = G.bg)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = G.surface)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: G.bg }}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4" style={{ color: G.textTer }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: G.text }}>{product.name}</p>
                    <p className="text-[10px] font-semibold" style={{ color: '#b45309' }}>{product.stock} left</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;
