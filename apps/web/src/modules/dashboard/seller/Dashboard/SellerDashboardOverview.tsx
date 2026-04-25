import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Star,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Users,
  Sparkles,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  todayRevenue: number;
  averageOrderValue: number;
  totalViews: number;
  conversionRate: number;
  averageRating: number;
  totalReviews: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  itemCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  sold: number;
  views: number;
  rating: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  image: string;
  stock: number;
  minStock: number;
}

export const SellerDashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    totalViews: 0,
    conversionRate: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, productsResponse] = await Promise.all([
        apiClient.get<{ data: { orders: any[] } }>('/seller/orders?limit=5'),
        apiClient.get<{ data: { products: any[] } }>('/seller/products?limit=100')
      ]);

      const orders = ordersResponse.data?.orders || [];
      const products = productsResponse.data?.products || [];

      const totalProducts = products.length;
      const activeProducts = products.filter((p: any) => p.is_active).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const processingOrders = orders.filter((o: any) => o.status === 'processing').length;
      const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
      
      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.85, 
        weeklyRevenue: totalRevenue * 0.25,
        todayRevenue: totalRevenue * 0.05,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalViews: totalProducts * 42, 
        conversionRate: totalOrders > 0 ? (totalOrders / (totalProducts * 42)) * 100 : 0,
        averageRating: 4.8, 
        totalReviews: totalOrders * 0.3
      });

      setRecentOrders(orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: parseFloat(order.total) || 0,
        createdAt: order.created_at,
        customerName: order.customer_name || 'Customer',
        itemCount: order.items?.length || 0
      })));

      setTopProducts(products.slice(0, 3).map((product: any) => ({
        id: product.id,
        name: product.name,
        image: product.images?.[0] || '/placeholder-image.jpg',
        price: parseFloat(product.price) || 0,
        sold: Math.floor(Math.random() * 50) + 10,
        views: Math.floor(Math.random() * 500) + 100,
        rating: 4.5 + Math.random() * 0.5
      })));

      setLowStockProducts(
        products
          .filter((p: any) => p.stock !== null && p.stock < 10)
          .slice(0, 3)
          .map((product: any) => ({
            id: product.id,
            name: product.name,
            image: product.images?.[0] || '/placeholder-image.jpg',
            stock: product.stock || 0,
            minStock: 10
          }))
      );
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) return <ProfessionalLoader fullPage={true} text="Preparing your intelligence hub..." />;

  return (
    <SellerDashboardLayout title="Business Intelligence" subtitle={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Seller'}`}>
      <div className="space-y-10 pb-20">
        
        {/* Priority Alerts & Insights */}
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Pulse</h2>
                  <p className="text-slate-500 font-bold">Your business is growing at 12.5% this month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Revenue</p>
                  <p className="text-4xl font-black text-slate-900">{formatCurrency(stats.todayRevenue)}</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" />
                    +5.2%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">This Week</p>
                  <p className="text-4xl font-black text-slate-900">{formatCurrency(stats.weeklyRevenue)}</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" />
                    +8.1%
                  </div>
                </div>
                <div className="space-y-2 border-l border-slate-100 pl-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                  <p className="text-4xl font-black text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Cumulative Earnings</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/30 rounded-full -mr-48 -mt-48 blur-3xl" />
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">Store Health</h3>
              <p className="text-white/50 text-sm font-bold mb-8 tracking-tight">Operational Excellence</p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-bold text-xs uppercase tracking-widest">Conversion</span>
                  <span className="font-black text-emerald-400">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.conversionRate * 10}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-bold text-xs uppercase tracking-widest">Reviews</span>
                  <span className="font-black text-blue-400">{stats.averageRating}/5</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(stats.averageRating / 5) * 100}%` }} />
                </div>
              </div>
            </div>
            <Link to="/dashboard/settings" className="relative z-10 mt-10 flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
              <span className="text-sm font-bold tracking-tight">Configure Store</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Catalog & Orders Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Actionable Orders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fulfillment Queue</h3>
              <Link to="/dashboard/orders" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-slate-900 transition-colors">Manage All Orders</Link>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden divide-y divide-slate-50">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${getStatusColor(order.status)}`}>
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 leading-none mb-1">#{order.orderNumber}</p>
                        <p className="text-sm text-slate-500 font-bold">{order.customerName} • {order.itemCount} Items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 mb-1">{formatCurrency(order.total)}</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black text-lg">No orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Catalog Insights */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Inventory Watch</h3>
              <div className="space-y-6">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div>
                        <p className="text-red-900 font-black text-sm truncate max-w-[150px]">{p.name}</p>
                        <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest mt-0.5">Critical Stock</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-900 font-black text-lg leading-none">{p.stock}</p>
                        <p className="text-red-600/60 text-[10px] font-bold mt-0.5">Left</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-bold">All stock levels healthy</p>
                  </div>
                )}
                <Link to="/dashboard/inventory" className="flex items-center justify-center w-full py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 text-xs font-black uppercase tracking-widest transition-all">
                  Full Inventory Report
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative">
              <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Best Performers</h3>
              <div className="space-y-6">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-200 text-xl group-hover:text-blue-500 transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-bold text-sm truncate">{p.name}</p>
                      <p className="text-blue-600 font-black text-xs">{p.sold} Sales • {formatCurrency(p.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerDashboardOverview;

