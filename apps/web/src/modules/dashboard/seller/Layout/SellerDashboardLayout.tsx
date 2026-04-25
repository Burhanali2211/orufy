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
  MessageSquare,
  Globe,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Products', path: '/dashboard/products', icon: Package },
      { name: 'Inventory', path: '/dashboard/inventory', icon: Store },
      { name: 'Orders', path: '/dashboard/orders', icon: ShoppingCart, badge: 3 },
    ]
  },
  {
    title: 'Performance',
    items: [
      { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Earnings', path: '/dashboard/earnings', icon: Wallet },
      { name: 'Reviews', path: '/dashboard/reviews', icon: MessageSquare },
      { name: 'Reports', path: '/dashboard/reports', icon: FileText },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Domain Setup', path: '/dashboard/domain', icon: Globe },
      { name: 'Store Settings', path: '/dashboard/settings', icon: Settings },
      { name: 'My Profile', path: '/dashboard/profile', icon: User },
    ]
  }
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">Orufy</span>
                <span className="text-[8px] text-blue-600 uppercase tracking-widest font-bold mt-1">Seller</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-white shadow-lg shadow-blue-500/10">
              <span className="text-white text-sm font-bold">{getInitials()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl shadow-slate-200/50 transform transition-transform duration-300 ease-out lg:translate-x-0 border-r border-slate-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">Orufy</span>
              <span className="text-[10px] text-blue-600 uppercase tracking-widest font-bold mt-1">Seller Hub</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-50 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Seller Profile Card */}
        <div className="p-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-4 ring-white shadow-md">
                <span className="text-lg font-bold text-white">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate text-sm">
                  {user?.fullName || 'Seller'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.businessName || 'Business Account'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                ● Active Seller
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        active
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-all ${
                        active ? 'bg-white shadow-sm ring-1 ring-blue-100' : 'bg-transparent'
                      }`}>
                        <Icon className={`w-4 h-4 transition-colors ${
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`} />
                      </div>
                      <span className="text-sm">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      {!item.badge && (
                        <ChevronRight className={`w-3 h-3 ml-auto transition-all ${
                          active ? 'opacity-100 translate-x-0 text-blue-400' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                        }`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Help Card */}
        <div className="p-4">
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Need Help?</p>
                <p className="text-[10px] text-slate-500 font-medium">Contact support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Visit Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between px-8 h-20">
            <div className="flex items-center gap-8 flex-1">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search products, orders, or analytics..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-sm">⌘</kbd>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-sm">K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Features/Quick Actions */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl">
                <button className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 hover:text-blue-600 transition-all relative group" title="Messages">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-slate-50"></span>
                </button>
                <button className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 hover:text-blue-600 transition-all relative group" title="Notifications">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-50"></span>
                </button>
                <Link
                  to="/dashboard/settings"
                  className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 hover:text-blue-600 transition-all"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName || 'Seller'}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">{user?.businessName || 'Business'}</p>
                </div>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-white shadow-lg shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-all">
                      <span className="text-white text-sm font-bold">{getInitials()}</span>
                    </div>
                  </button>
                  {/* Mini Dropdown on Hover */}
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                    <div className="p-3 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Manage Account</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-bold transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Header */}
        <div className="flex-1 px-4 lg:px-10 py-8 lg:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <nav className="flex items-center gap-2 text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-600">{title}</span>
              </nav>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-slate-500 text-base mt-2 max-w-2xl font-medium">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-bold transition-all shadow-sm">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>View Stats</span>
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                <Package className="w-4 h-4" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>

          {/* Actual Page Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </main>
    </div>

  );
};

export default SellerDashboardLayout;

