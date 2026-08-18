import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Heart,
  ShoppingBag,
  ArrowRight,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useCustomerStats } from '@/shared/hooks/customer/useCustomerStats';
import { useCustomerOrders } from '@/shared/hooks/customer/useCustomerOrders';
import { useCustomerAddresses } from '@/shared/hooks/customer/useCustomerAddresses';
import { useWishlist } from '@/shared/contexts/WishlistContext';

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useCustomerStats();
  const { data: ordersData, isLoading: ordersLoading } = useCustomerOrders();
  const { data: addresses = [] } = useCustomerAddresses();
  const { items: wishlistItems } = useWishlist();

  const loading = statsLoading || ordersLoading;
  const ordersList: any[] = ordersData || [];
  const recentOrders = ordersList.slice(0, 5);
  const latestOrder = ordersList[0];

  const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];

  const totalSpent = ordersList.reduce((sum, o) => sum + (parseFloat(o.total_amount || o.totalAmount || '0') || 0), 0);
  const activeOrdersCount = ordersList.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped').length;

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      <CustomerDashboardLayout title="Account Overview" subtitle="Welcome back">
        <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-stone-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-stone-200 rounded-2xl" />
            <div className="h-24 bg-stone-200 rounded-2xl" />
            <div className="h-24 bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout
      title="Account Overview"
      subtitle={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'there'}.`}
    >
      <div className="space-y-6">
        {/* ── Welcome Banner ── */}
        <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 bg-stone-800 px-2.5 py-1 rounded-full">
              Member Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
              Manage your orders & deliveries.
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed">
              Track live shipments, manage saved shipping addresses, and review previous order receipts.
            </p>
          </div>

          <div className="z-10 flex items-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>

        {/* ── 3-Metric Summary Strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Orders</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-stone-900">{activeOrdersCount}</h3>
              <p className="text-xs text-stone-400 mt-0.5">In fulfillment</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Purchases</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-stone-900">{fmt(totalSpent)}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{ordersList.length} total orders</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Saved Items</span>
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold text-stone-900">{wishlistItems?.length || 0}</h3>
              <p className="text-xs text-stone-400 mt-0.5">In wishlist</p>
            </div>
          </div>
        </div>

        {/* ── Latest Order Tracker & Address Snapshot (2 Columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Latest Order Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Latest Order Status</h3>
                <p className="text-xs text-stone-500 mt-0.5">Most recent purchase activity</p>
              </div>
              <Link
                to="/dashboard/orders"
                className="text-xs font-bold text-stone-700 hover:text-stone-900 inline-flex items-center gap-1"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestOrder ? (
              <div className="p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-stone-900">
                        {latestOrder.order_number || latestOrder.orderNumber || `#${latestOrder.id.slice(0, 8)}`}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(latestOrder.status)}`}>
                        {latestOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Placed on {new Date(latestOrder.created_at || latestOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-stone-500">Order Total</p>
                    <p className="text-base font-bold text-stone-900">
                      {fmt(latestOrder.total_amount || latestOrder.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Items in order */}
                {latestOrder.items && latestOrder.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Items in Package</p>
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {latestOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-stone-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200 flex items-center justify-center">
                              {item.product?.images?.[0] ? (
                                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900">{item.product?.name || item.name || 'Product'}</p>
                              <p className="text-[11px] text-stone-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-stone-900">
                            {fmt(item.price || item.unit_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center space-y-2">
                <Package className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-800">No orders placed yet</p>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  When you purchase items from our catalog, their live tracking and receipts will show here.
                </p>
              </div>
            )}
          </div>

          {/* Default Address & Quick Links (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Address Snapshot */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Default Shipping Address</h3>
                <Link to="/dashboard/addresses" className="text-xs font-bold text-stone-700 hover:text-stone-900">
                  Manage
                </Link>
              </div>

              {defaultAddress ? (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-1 text-xs text-stone-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900">{defaultAddress.fullName || user?.fullName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold">
                      Default
                    </span>
                  </div>
                  <p>{defaultAddress.streetAddress || defaultAddress.address_line1}</p>
                  <p>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode || defaultAddress.postal_code}</p>
                  <p>{defaultAddress.country || 'India'}</p>
                  {defaultAddress.phone && <p className="pt-1 font-medium text-stone-500">Phone: {defaultAddress.phone}</p>}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl space-y-2">
                  <MapPin className="w-6 h-6 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-500">No saved address</p>
                  <Link
                    to="/dashboard/addresses"
                    className="inline-block text-xs font-bold text-stone-900 hover:underline"
                  >
                    + Add shipping address
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Account Quick Actions</h3>
              <div className="space-y-1.5">
                <Link
                  to="/dashboard/orders"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-stone-500" />
                    <span>View Order History</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>
                <Link
                  to="/dashboard/wishlist"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-stone-500" />
                    <span>Saved Wishlist Items</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>
                <Link
                  to="/dashboard/profile"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-stone-500" />
                    <span>Update Profile & Settings</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default DashboardOverview;
