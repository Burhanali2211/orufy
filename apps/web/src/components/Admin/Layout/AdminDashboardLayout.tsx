import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Bell,
  Shield,
  Globe,
  Share2,
  Phone,
  Link2,
  ChevronDown,
  Crown,
  Warehouse,
  Store,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';
import { isValidImageUrl } from '../../../utils/imageUrlUtils';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: { name: string; path: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  {
    name: 'Products',
    path: '/admin/products',
    icon: Package,
    children: [
      { name: 'All Products', path: '/admin/products', icon: Package },
      { name: 'Categories', path: '/admin/categories', icon: Tag },
      { name: 'Inventory', path: '/admin/inventory', icon: Warehouse },
      { name: 'Quick Sale', path: '/admin/pos', icon: Store },
    ],
  },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  {
    name: 'Customers',
    path: '/admin/users',
    icon: Users,
    children: [
      { name: 'All Users', path: '/admin/users', icon: Users },
      { name: 'Inquiries', path: '/admin/contact-submissions', icon: MessageSquare },
    ],
  },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    children: [
      { name: 'Site Settings', path: '/admin/settings/site', icon: Globe },
      { name: 'Social Media', path: '/admin/settings/social-media', icon: Share2 },
      { name: 'Contact Info', path: '/admin/settings/contact', icon: Phone },
      { name: 'Footer Links', path: '/admin/settings/footer-links', icon: Link2 },
    ],
  },
];

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['/admin/products']);
  const { settings } = useAdminDashboardSettings();

  useEffect(() => {
    setSidebarOpen(false);
    if (location.pathname.includes('/admin/settings')) {
      setExpandedItems(prev => prev.includes('/admin/settings') ? prev : [...prev, '/admin/settings']);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    if (path === '/admin/users') {
      return location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/contact-submissions');
    }
    return location.pathname.startsWith(path);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'A';
  };

  const SidebarContent = () => (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          {settings.dashboard_logo_url && isValidImageUrl(settings.dashboard_logo_url) ? (
            <img
              src={settings.dashboard_logo_url}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-base font-bold text-gray-900 truncate">
            {settings.dashboard_name || 'Admin Panel'}
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Admin Profile Card */}
      <div className="p-3 flex-shrink-0">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 font-medium">Super Admin</p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
              <Shield className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.path);

          return (
            <div key={item.path}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.path)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-slate-700' : 'text-gray-500'}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-slate-700' : 'text-gray-500'}`} />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  {active && <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </Link>
              )}

              {hasChildren && isExpanded && (
                <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = location.pathname.startsWith(child.path);
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all min-h-[42px] ${
                          childActive
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <ChildIcon className={`w-4 h-4 flex-shrink-0 ${childActive ? 'text-slate-700' : 'text-gray-400'}`} />
                        <span className="text-sm">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div
        className="p-3 border-t border-gray-200 space-y-0.5 flex-shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <Home className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="font-medium text-sm">View Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">
              {settings.dashboard_name || 'Admin'}
            </span>
          </div>

          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="View store"
          >
            <Home className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-out flex flex-col lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 xl:px-8 py-4">
            <div>
              <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                <Link to="/admin" className="hover:text-slate-700 transition-colors">
                  Admin
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-700 font-medium">{title}</span>
              </nav>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="font-medium text-sm">Store</span>
              </Link>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'Admin'}</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">{getInitials()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Page Title */}
        <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
