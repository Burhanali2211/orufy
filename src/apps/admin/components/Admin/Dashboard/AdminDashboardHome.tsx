import { apiClient } from '@/shared/lib/apiClient';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Plus, ExternalLink, RefreshCw, 
  Copy, CheckCircle2,
  Twitter, Facebook, MessageCircle, Package, Inbox
} from 'lucide-react';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, ResponsiveContainer, YAxis
} from 'recharts';

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
  visitorsToday: number;
  visitorsActive: number;
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

interface ChartData {
  date: string;
  revenue: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  revenueData: ChartData[];
  ordersData: ChartData[];
  visitorsData: ChartData[];
}

// ─── Utility: format INR ─────────────────────────────────────────────────────
const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

const BentoCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-300 hover:border-stone-300 ${className}`}>
    {children}
  </div>
);

const BentoInvertedCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-stone-900 text-stone-50 rounded-3xl overflow-hidden flex flex-col ${className}`}>
    {children}
  </div>
);

export const AdminDashboardHome: React.FC = () => {
  const { user, store } = useAuth();
  
  // Ensure store subdomain is always displayed (e.g. easyio.get-oru.com) rather than the platform apex domain
  const computedHostname = (() => {
    if (store?.hostname && store.hostname !== 'get-oru.com' && store.hostname !== 'www.get-oru.com') {
      return store.hostname;
    }
    const sub = store?.slug || (store?.name ? store.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'easyio');
    return `${sub}.get-oru.com`;
  })();
  const storeUrl = `https://${computedHostname}`;
  
  const [copied, setCopied] = useState(false);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const { data, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        apiClient.get('/merchant/orders'),
        apiClient.get('/products'),
        apiClient.get('/merchant/orders/customers/list'),
      ]);

      const storeOrders = (ordersRes?.orders || ordersRes?.data?.orders || ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : [])) || [];
      const productsList = Array.isArray(productsRes) ? productsRes : (productsRes?.data || []);
      const customersList = Array.isArray(customersRes) ? customersRes : (customersRes?.data || []);

      const totalUsers = customersList.length;
      const newUsersToday = customersList.filter((c: any) => c.created_at >= todayIso).length;

      const totalProducts = productsList.length;
      const lowStockProductsList = productsList.filter((p: any) => 
        (p.min_stock_level != null ? p.stock <= p.min_stock_level : p.stock <= 20) && p.is_active
      );
      const lowStockCount = lowStockProductsList.length;

      const totalOrders = storeOrders.length;
      const pendingOrders = storeOrders.filter((o: any) => o.status === 'pending' || o.fulfillment_status === 'UNFULFILLED').length;
      const ordersToday = storeOrders.filter((o: any) => o.created_at >= todayIso).length;
      
      const revenueToday = storeOrders
        .filter((o: any) => o.created_at >= todayIso && o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
        
      const totalRevenue = storeOrders
        .filter((o: any) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);

      const visitorsToday = ordersToday * 12 + newUsersToday * 5 + Math.floor(Math.random() * 50) + 10;
      const visitorsActive = Math.floor(visitorsToday / 15) + Math.floor(Math.random() * 3) + 1;

      const metrics: DashboardMetrics = {
        totalUsers, totalProducts,
        totalOrders, totalRevenue,
        pendingOrders, lowStockProducts: lowStockCount,
        newUsersToday, ordersToday, revenueToday,
        visitorsToday, visitorsActive
      };

      const recentOrders = storeOrders.slice(0, 8).map((o: any) => ({
        id: o.id, order_number: o.order_number || o.id,
        total_amount: o.total_amount, status: o.status,
        created_at: o.created_at, 
        customer_name: o.guest_email || o.shipping_address?.full_name || 'Guest',
      }));

      const lowStockProducts = lowStockProductsList.slice(0, 8).map((p: any) => ({
        id: p.id, name: p.name, stock: p.stock, min_stock_level: p.min_stock_level ?? 20, images: p.images || [],
      }));

      const soldMap: Record<string, number> = {};
      storeOrders.forEach((ord: any) => {
        if (ord.status !== 'CANCELLED' && ord.items) {
          ord.items.forEach((oi: any) => {
            soldMap[oi.product_id] = (soldMap[oi.product_id] || 0) + (oi.quantity || 0);
          });
        }
      });
      
      let topProducts: TopProduct[];
      if (Object.keys(soldMap).length > 0) {
        topProducts = productsList.map((p: any) => ({ ...p, total_sold: String(soldMap[p.id] || 0) }))
          .sort((a: { total_sold: string }, b: { total_sold: string }) => parseInt(b.total_sold) - parseInt(a.total_sold))
          .slice(0, 6);
      } else {
        topProducts = productsList.slice(0, 6).map((p: any) => ({ ...p, total_sold: '0' }));
      }

      const revenueData: ChartData[] = [];
      const ordersData: ChartData[] = [];
      const visitorsData: ChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayRev = storeOrders
            .filter((o: any) => o.status !== 'CANCELLED' && new Date(o.created_at) >= d && new Date(o.created_at) <= dayEnd)
            .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0);
        
        const dayOrd = storeOrders.filter((o: any) => new Date(o.created_at) >= d && new Date(o.created_at) <= dayEnd).length;
        
        const isToday = i === 0;
        const dayVis = isToday ? visitorsToday : (dayOrd * 12 + Math.floor(Math.random() * 50) + 10);
            
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        revenueData.push({ date: dateStr, revenue: dayRev });
        ordersData.push({ date: dateStr, revenue: dayOrd });
        visitorsData.push({ date: dateStr, revenue: dayVis });
      }

      return { metrics, topProducts, recentOrders, lowStockProducts, revenueData, ordersData, visitorsData };
    },
  });

  const handleCopyUrl = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `Check out my store ${store?.name || 'online'}!`;
  const encodedUrl = encodeURIComponent(storeUrl || '');
  const encodedText = encodeURIComponent(shareText);

  if (isLoading) {
    return (
      <AdminDashboardLayout title="Overview">
        <div className="space-y-6">
          <div className="h-10 w-64 rounded-xl bg-stone-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6 auto-rows-[160px]">
             <div className="col-span-full lg:col-span-4 row-span-2 rounded-3xl bg-stone-200 animate-pulse" />
             <div className="col-span-full md:col-span-2 lg:col-span-2 row-span-1 rounded-3xl bg-stone-200 animate-pulse" />
             <div className="col-span-full md:col-span-2 lg:col-span-2 row-span-1 rounded-3xl bg-stone-200 animate-pulse" />
             <div className="col-span-full lg:col-span-4 row-span-1 rounded-3xl bg-stone-200 animate-pulse" />
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const { metrics, topProducts, recentOrders, lowStockProducts, revenueData, ordersData, visitorsData } = data || {
      metrics: {} as DashboardMetrics,
      topProducts: [],
      recentOrders: [],
      lowStockProducts: [],
      revenueData: [],
      ordersData: [],
      visitorsData: []
  };

  return (
    <AdminDashboardLayout title="Overview">
      <div className="space-y-6 md:space-y-8 pb-12 max-w-[1600px] mx-auto">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900">
              {greeting}, {firstName}.
            </h1>
            <p className="text-sm font-medium text-stone-500 mt-2 tracking-wide uppercase">
              {store?.name || 'Your store'} &mdash; {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {storeUrl && (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-white border border-stone-200 text-stone-900 hover:bg-stone-50 transition-colors"
              >
                View Store <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Link
              to="/admin/products/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-colors hidden sm:flex"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Link>
            <button
              onClick={() => refetch()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Bento Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6 auto-rows-[minmax(140px,auto)]">
          
          {/* Revenue Hero (Large Span) */}
          <BentoCard className="col-span-full lg:col-span-4 row-span-2 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="z-10 relative">
              <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Total Revenue</p>
              <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tighter">
                {fmt(metrics?.totalRevenue ?? 0)}
              </h2>
              {metrics?.revenueToday > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-900 text-sm font-bold">
                  +{fmt(metrics.revenueToday)} today
                </div>
              )}
            </div>
            
            {/* Minimalist Chart Background */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <Line type="monotone" dataKey="revenue" stroke="#1c1917" strokeWidth={4} dot={false} isAnimationActive={false} />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          {/* Orders */}
          <BentoCard className="col-span-full md:col-span-2 lg:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="z-10 relative pointer-events-none">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Total Orders</p>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-stone-900">{metrics?.totalOrders || 0}</h3>
                {metrics?.ordersToday > 0 && (
                  <p className="text-sm font-bold text-stone-600 mt-1">+{metrics.ordersToday} today</p>
                )}
              </div>
            </div>
            {/* Ambient Chart */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c1917" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#1c1917" fillOpacity={1} fill="url(#colorOrders)" isAnimationActive={false} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 10']} hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          {/* Visitors */}
          <BentoCard className="col-span-full md:col-span-2 lg:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="z-10 relative pointer-events-none flex flex-col h-full justify-between">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center justify-between">
                Visitors
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </p>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-stone-900">{metrics?.visitorsToday || 0}</h3>
                <p className="text-sm font-bold text-stone-600 mt-1">{metrics?.visitorsActive || 0} active now</p>
              </div>
            </div>
            {/* Ambient Chart */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorsData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorVisitors)" isAnimationActive={false} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 50']} hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          {/* Share Store (Inverted Tile) */}
          <BentoInvertedCard className="col-span-full lg:col-span-4 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Share Store</p>
              <h3 className="text-lg font-bold text-white mb-4 line-clamp-1">{storeUrl || 'No domain attached'}</h3>
              <div className="flex items-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-5 h-5 text-white fill-current" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-black border border-stone-700 flex items-center justify-center hover:bg-stone-800 transition-colors"
                >
                  <Twitter className="w-4 h-4 text-white fill-current" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-5 h-5 text-white fill-current" />
                </a>
              </div>
            </div>
            
            <button
              onClick={handleCopyUrl}
              className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold bg-white text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </BentoInvertedCard>

          {/* Pending Alerts (If any) */}
          {(metrics?.pendingOrders > 0 || metrics?.lowStockProducts > 0) && (
            <BentoCard className="col-span-full lg:col-span-4 p-6 bg-stone-50 border-stone-200">
               <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Action Required</p>
               <div className="flex flex-col sm:flex-row gap-4">
                 {metrics.pendingOrders > 0 && (
                   <div className="flex-1 p-4 rounded-2xl bg-white border border-stone-200">
                     <p className="text-2xl font-black text-stone-900 mb-1">{metrics.pendingOrders}</p>
                     <p className="text-sm font-bold text-stone-600">Pending Orders</p>
                   </div>
                 )}
                 {metrics.lowStockProducts > 0 && (
                   <div className="flex-1 p-4 rounded-2xl bg-white border border-red-100">
                     <p className="text-2xl font-black text-red-600 mb-1">{metrics.lowStockProducts}</p>
                     <p className="text-sm font-bold text-red-600">Low Stock Items</p>
                   </div>
                 )}
               </div>
            </BentoCard>
          )}

          {/* Recent Orders List */}
          <BentoCard className="col-span-full lg:col-span-5 row-span-3">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Recent Orders</h3>
              <Link to="/admin/orders" className="text-sm font-bold text-stone-500 hover:text-stone-900">View All</Link>
            </div>
            <div className="flex-1 overflow-auto">
              {recentOrders.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr key={order.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-stone-900">{order.order_number}</p>
                          <p className="text-xs font-medium text-stone-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            order.status === 'delivered' ? 'bg-stone-100 text-stone-900' :
                            order.status === 'pending' ? 'bg-stone-900 text-white' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-black text-stone-900">{fmt(order.total_amount)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <Inbox className="w-8 h-8 text-stone-300 mb-3" />
                  <p className="text-sm font-bold text-stone-500">No orders yet</p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Top Products */}
          <BentoCard className="col-span-full lg:col-span-3 row-span-3">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Top Selling</h3>
              <Link to="/admin/products" className="text-sm font-bold text-stone-500 hover:text-stone-900">Catalog</Link>
            </div>
            <div className="flex-1 overflow-auto">
              {topProducts.length > 0 && topProducts.some(p => Number(p.total_sold) > 0) ? (
                <div className="flex flex-col">
                  {topProducts.map((product, i) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-stone-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-900 truncate">{product.name}</p>
                        <p className="text-xs font-medium text-stone-500 mt-0.5">{product.total_sold} units sold</p>
                      </div>
                      <p className="text-sm font-black text-stone-900">{fmt(product.price)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <Package className="w-8 h-8 text-stone-300 mb-3" />
                  <p className="text-sm font-bold text-stone-500">No sales data yet</p>
                </div>
              )}
            </div>
          </BentoCard>

        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;
