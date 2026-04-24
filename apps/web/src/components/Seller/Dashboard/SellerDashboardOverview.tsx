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
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/apiClient';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';

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
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [ordersResponse, productsResponse] = await Promise.all([
        apiClient.get<{ data: { orders: any[] } }>('/seller/orders?limit=5'),
        apiClient.get<{ data: { products: any[] } }>('/seller/products?limit=100')
      ]);

      const orders = ordersResponse.data?.orders || [];
      const products = productsResponse.data?.products || [];

      // Calculate stats from real data
      const totalProducts = products.length;
      const activeProducts = products.filter((p: any) => p.is_active).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const processingOrders = orders.filter((o: any) => o.status === 'processing').length;
      const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);
      
      // Set calculated stats
      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
        monthlyRevenue: 0, // TODO: Calculate from date-filtered orders
        weeklyRevenue: 0, // TODO: Calculate from date-filtered orders
        todayRevenue: 0, // TODO: Calculate from date-filtered orders
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalViews: 0, // TODO: Fetch from analytics
        conversionRate: 0, // TODO: Calculate from analytics
        averageRating: 0, // TODO: Calculate from product reviews
        totalReviews: 0 // TODO: Fetch from reviews
      });

      // Set recent orders
      setRecentOrders(orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: parseFloat(order.total) || 0,
        createdAt: order.created_at,
        customerName: order.customer_name || 'Customer',
        itemCount: order.items?.length || 0
      })));

      // Set top products (by sales - placeholder until sales data available)
      setTopProducts(products.slice(0, 3).map((product: any) => ({
        id: product.id,
        name: product.name,
        image: product.images?.[0] || '/placeholder-image.jpg',
        price: parseFloat(product.price) || 0,
        sold: 0, // TODO: Calculate from order items
        views: 0, // TODO: Fetch from analytics
        rating: parseFloat(product.rating) || 0
      })));

      // Set low stock products
      setLowStockProducts(
        products
          .filter((p: any) => p.stock !== null && p.stock < 10)
          .slice(0, 5)
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
      // Set empty state on error
      setStats({
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
      setRecentOrders([]);
      setTopProducts([]);
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SellerDashboardLayout title="Dashboard" subtitle="Welcome back!">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 animate-pulse border border-white/10">
                <div className="h-4 bg-white/10 rounded w-20 mb-3" />
                <div className="h-8 bg-white/10 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout 
      title="Dashboard" 
      subtitle={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'Seller'}!`}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl p-6 lg:p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  Welcome to Seller Hub! 🚀
                </h2>
                <p className="text-cyan-100">Manage your business from one place</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                to="/dashboard/products"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                <Package className="w-5 h-5" />
                Add Product
              </Link>
              <Link
                to="/dashboard/orders"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                View Orders
              </Link>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-cyan-400/20 rounded-full translate-y-1/2 blur-2xl" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +12.5%
              </span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +8.3%
              </span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Total Orders</p>
            <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalOrders}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-white/50 text-sm">{stats.activeProducts} active</span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Products</p>
            <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalProducts}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-white/50 text-sm">{stats.totalReviews} reviews</span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Average Rating</p>
            <p className="text-2xl lg:text-3xl font-bold text-white">{stats.averageRating}/5</p>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
              <p className="text-white/60 text-sm">Track your earnings over time</p>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-white/60 text-sm">Today</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.todayRevenue)}</p>
              <span className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> +15% vs yesterday
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-white/60 text-sm">This Week</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.weeklyRevenue)}</p>
              <span className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> +8% vs last week
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-white/60 text-sm">This Month</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
              <span className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> +12% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Orders and Performance Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending Orders Alert */}
          {stats.pendingOrders > 0 && (
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{stats.pendingOrders} Pending Orders</h4>
                    <p className="text-amber-200 text-sm">Orders waiting for your action</p>
                  </div>
                </div>
                <Link
                  to="/dashboard/orders?status=pending"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  Process Now
                </Link>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
              <Link
                to="/dashboard/orders"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-white/10">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/10">
                        <ShoppingCart className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          #{order.orderNumber}
                        </p>
                        <p className="text-sm text-white/60">
                          {order.customerName} • {order.itemCount} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatCurrency(order.total)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60 mb-4">No orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Order Status Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Order Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span className="text-white/70 text-sm">Pending</span>
                  </div>
                  <span className="text-white font-semibold">{stats.pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    <span className="text-white/70 text-sm">Processing</span>
                  </div>
                  <span className="text-white font-semibold">{stats.processingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="text-white/70 text-sm">Completed</span>
                  </div>
                  <span className="text-white font-semibold">{stats.completedOrders}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Conversion Rate</span>
                    <span className="text-white font-semibold">{stats.conversionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.conversionRate * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Avg Order Value</span>
                    <span className="text-white font-semibold">{formatCurrency(stats.averageOrderValue)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-sm">Product Views</span>
                    <span className="text-white font-semibold">{stats.totalViews.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-5 border border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-semibold">Low Stock Alert</h3>
                </div>
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center">
                          <Package className="w-5 h-5 text-red-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{product.name}</p>
                        <p className="text-red-400 text-xs">Only {product.stock} left</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/dashboard/inventory"
                  className="mt-4 inline-flex items-center gap-1 text-red-400 text-sm font-medium hover:text-red-300"
                >
                  Manage Inventory <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Top Selling Products</h3>
            <Link
              to="/dashboard/products"
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/10">
                    <span className="text-2xl font-bold text-white/60">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{product.name}</p>
                    <p className="text-cyan-400 font-medium">{formatCurrency(product.price)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-white/60">
                    <ShoppingCart className="w-4 h-4" />
                    <span>{product.sold} sold</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/60">
                    <Eye className="w-4 h-4" />
                    <span>{product.views}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{product.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerDashboardOverview;

