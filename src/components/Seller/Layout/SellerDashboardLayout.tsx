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
  Wallet,
  FileText,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  ShieldCheck
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
    return user?.email?.charAt(0).toUpperCase() || 'M';
  };

  return (
    <div className="min-h-screen bg-stone-50/60 font-sans text-stone-900 antialiased selection:bg-stone-200">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-2xs">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-stone-900 text-base tracking-tight">Merchant Hub</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-xs text-stone-800">
            {getInitials()}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-stone-200/80 shadow-2xs transform transition-transform duration-250 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-stone-900 text-base tracking-tight block leading-tight">
                Merchant Hub
              </span>
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden" />
                Store is Live
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Profile Card */}
        <div className="p-3">
          <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-stone-900 truncate">
                {user?.fullName || user?.businessName || 'Store Owner'}
              </p>
              <p className="text-[11px] text-stone-400 truncate">
                {user?.email || 'Active Merchant'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-white' : 'text-stone-400 group-hover:text-stone-800'}`} />
                <span>{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Fast Links */}
        <div className="p-3 border-t border-stone-100 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-stone-400" />
              <span>Visit Storefront</span>
            </div>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Desktop Top Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200/70 text-stone-800 rounded-xl text-xs font-bold transition-colors border border-stone-200/80"
              >
                <span>Visit Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                to="/dashboard/settings"
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboardLayout;
