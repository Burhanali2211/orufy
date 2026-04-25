import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Bell,
  Store,
  TrendingUp,
  Wallet,
  FileText,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface SellerDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/dashboard/products', icon: Package },
  { name: 'Orders', path: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Earnings', path: '/dashboard/earnings', icon: Wallet },
  { name: 'Inventory', path: '/dashboard/inventory', icon: Store },
  { name: 'Reviews', path: '/dashboard/reviews', icon: MessageSquare },
  { name: 'Reports', path: '/dashboard/reports', icon: FileText },
  { name: 'Profile', path: '/dashboard/profile', icon: User },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export const SellerDashboardLayout: React.FC<SellerDashboardLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'S';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Seller Hub</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center ring-2 ring-white/20">
            <span className="text-white text-sm font-semibold">{getInitials()}</span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 border-r border-white/10 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Seller Hub</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Seller Profile Card */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
                <span className="text-lg font-bold text-white">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.fullName || 'Seller'}
                </p>
                <p className="text-sm text-cyan-300 truncate">
                  {user?.businessName || 'Business Account'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                ● Active Seller
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-300px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  active ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/70'
                }`} />
                <span className="font-medium">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 ml-auto transition-opacity ${
                  active ? 'opacity-100 text-cyan-400' : 'opacity-0 group-hover:opacity-50'
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* Help Card */}
        <div className="p-3">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Need Help?</p>
                <p className="text-xs text-white/60">Contact seller support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Visit Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <nav className="flex items-center gap-2 text-sm text-white/50 mb-1">
                <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">{title}</span>
              </nav>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-white/60 mt-1">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-white/60" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Store</span>
              </Link>
              
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.fullName || 'Seller'}</p>
                  <p className="text-xs text-white/50">{user?.businessName || 'Business'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white text-sm font-semibold">{getInitials()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Title */}
        <div className="lg:hidden px-4 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/10">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-white/60 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboardLayout;

