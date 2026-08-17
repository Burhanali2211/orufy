import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  Heart,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Bell,
  Star
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useCustomerStats } from '@/shared/hooks/customer/useCustomerStats';
import { useCustomerOrders } from '@/shared/hooks/customer/useCustomerOrders';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading: statsLoading } = useCustomerStats();
  const { data: ordersData, isLoading: ordersLoading } = useCustomerOrders();
  const loading = statsLoading || ordersLoading;

  const ordersList: any[] = ordersData || [];
  const recentOrders = ordersList.slice(0, 5);

  const stats = {
    totalOrders: ordersList.length || (data as any)?.orders || 0,
    pendingOrders: ordersList.filter(o => o.status === 'pending' || o.status === 'processing').length,
    deliveredOrders: ordersList.filter(o => o.status === 'delivered').length,
    totalSpent: ordersList.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0),
    wishlistCount: (data as any)?.wishlistCount || 0,
    addressCount: (data as any)?.addressCount || 1
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <CustomerDashboardLayout title="Dashboard" subtitle="Welcome back!">
        <div className="space-y-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 hidden">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
          {/* Content Skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 hidden h-64" />
            <div className="bg-white rounded-2xl p-6 hidden h-64" />
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout 
      title="Dashboard" 
      subtitle={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'there'}!`}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 lg:p-8 text-white">
          <div className="relative z-10">
            <h2 className="text-xl lg:text-2xl font-bold mb-2">
              Welcome to your dashboard! 🎉
            </h2>
            <p className="text-purple-100 mb-4 max-w-xl">
              Track your orders, manage your addresses, and explore your wishlist all in one place.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Orders</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">In Transit</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Delivered</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.deliveredOrders}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Spent</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
              ₹{(stats.totalSpent / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link
                to="/dashboard/orders"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    to={`/dashboard/orders`}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)} • {order.itemCount} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(order.total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Start Shopping
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/dashboard/addresses"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Addresses</p>
                    <p className="text-sm text-gray-500">{stats.addressCount} saved</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Wishlist</p>
                    <p className="text-sm text-gray-500">{stats.wishlistCount} items</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/dashboard/payments"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Payment Methods</p>
                    <p className="text-sm text-gray-500">Manage cards</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Edit Profile</p>
                    <p className="text-sm text-gray-500">Update your info</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </div>
            </div>

            {/* Notification Prompt */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Stay Updated</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Get notified about order updates and exclusive offers.
                  </p>
                  <Link
                    to="/dashboard/notifications"
                    className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                  >
                    Manage Notifications →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default DashboardOverview;

