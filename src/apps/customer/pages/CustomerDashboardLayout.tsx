import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  Heart,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Mail,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useCustomerStats } from '@/shared/hooks/customer/useCustomerStats';
import { normalizeImageUrl } from '@/shared/utils/imageUrlUtils';

interface CustomerDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number | string;
}

export const CustomerDashboardLayout: React.FC<CustomerDashboardLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const { user, logout, resendVerification } = useAuth();
  const { settings, getSiteSetting } = useSettings();
  const { items: wishlistItems } = useWishlist();
  const { data: stats } = useCustomerStats();

  const logoUrl = normalizeImageUrl(getSiteSetting('logo_url') || (settings as any)?.site_logo);
  const siteName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Store';
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (!user?.email || isResending || cooldown > 0) return;
    try {
      setIsResending(true);
      const res = await resendVerification(user.email);
      toast.success(res.message || 'Verification email has been resent!');
      setCooldown(60);
    } catch (err: any) {
      if (err.retryAfterSeconds) {
        setCooldown(err.retryAfterSeconds);
      }
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: NavItem[] = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
    {
      name: 'My Orders',
      path: '/dashboard/orders',
      icon: Package,
      badge: (stats as any)?.activeOrders && (stats as any).activeOrders > 0 ? (stats as any).activeOrders : undefined
    },
    {
      name: 'Wishlist',
      path: '/dashboard/wishlist',
      icon: Heart,
      badge: wishlistItems?.length && wishlistItems.length > 0 ? wishlistItems.length : undefined
    },
    { name: 'Addresses', path: '/dashboard/addresses', icon: MapPin },
    { name: 'Profile & Settings', path: '/dashboard/profile', icon: User },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const userAvatar = user?.avatar || (user as any)?.avatar_url || (user as any)?.avatarUrl;

  const getInitials = () => {
    if (user?.fullName || user?.name) {
      const name = user.fullName || user.name || '';
      return name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-stone-50/60 pb-16">
      {/* ── Sub-header / Breadcrumbs bar ── */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb path */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
              <Link to="/" className="hover:text-stone-900 transition-colors flex items-center gap-1">
                <span>Store</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <Link to="/dashboard" className="hover:text-stone-900 transition-colors">
                Account
              </Link>
              {location.pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-900 font-bold">{title}</span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Layout Container ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Desktop Sidebar (lg:col-span-3) ── */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
            {/* User Identity Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 overflow-hidden border border-stone-200">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-stone-900 truncate">
                  {user?.fullName || user?.name || 'Customer'}
                </p>
                <p className="text-xs font-medium text-stone-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs space-y-1">
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-500'}`} />
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          active ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                    </div>
                  </Link>
                );
              })}

              <div className="pt-2 mt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* ── Mobile Sidebar Drawer ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-stone-200">
                        {userAvatar ? (
                          <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          getInitials()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{user?.fullName || user?.name || 'Customer'}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const active = isActive(item);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-500'}`} />
                            <span>{item.name}</span>
                          </div>
                          {active && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Main Content Area (lg:col-span-9) ── */}
          <main className="lg:col-span-9 space-y-6">
            {/* Unverified Email Alert Banner */}
            {user && !user.email_verified && !user.emailVerified && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">Please verify your email address</h4>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                      A confirmation link was sent to <strong className="font-semibold text-amber-950">{user.email}</strong>. Verify to secure your account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || cooldown > 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-shrink-0 self-start sm:self-auto"
                >
                  {isResending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>{cooldown > 0 ? `Resend (${cooldown}s)` : isResending ? 'Sending...' : 'Resend Confirmation'}</span>
                </button>
              </div>
            )}

            {/* View Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm font-medium text-stone-500 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* View Body */}
            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardLayout;
