import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Settings,
  Globe,
  Palette,
  Share2,
  Phone,
  Link2,
  Mail,
  Warehouse,
  Store,
  MessageSquare,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileToggle: () => void;
}

interface SubMenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Products',
    path: '/admin/products',
    icon: <Package className="h-5 w-5" />,
    subItems: [
      {
        name: 'All Products',
        path: '/admin/products',
        icon: <Package className="h-4 w-4" />,
      },
      {
        name: 'Categories',
        path: '/admin/categories',
        icon: <Tag className="h-4 w-4" />,
      },
      {
        name: 'Inventory',
        path: '/admin/inventory',
        icon: <Warehouse className="h-4 w-4" />,
      },
      {
        name: 'Quick Sale',
        path: '/admin/pos',
        icon: <Store className="h-4 w-4" />,
      },
    ],
  },
  {
    name: 'Orders',
    path: '/admin/orders',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    name: 'Customers',
    path: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    subItems: [
      {
        name: 'All Users',
        path: '/admin/users',
        icon: <Users className="h-4 w-4" />,
      },
      {
        name: 'Inquiries',
        path: '/admin/contact-submissions',
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ],
  },
  {
    name: 'Analytics',
    path: '/admin/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: <Settings className="h-5 w-5" />,
    subItems: [
      {
        name: 'Site Settings',
        path: '/admin/settings/site',
        icon: <Globe className="h-4 w-4" />,
      },
      {
        name: 'Theme',
        path: '/admin/settings/theme',
        icon: <Palette className="h-4 w-4" />,
      },
      {
        name: 'Social Media',
        path: '/admin/settings/social-media',
        icon: <Share2 className="h-4 w-4" />,
      },
      {
        name: 'Contact Info',
        path: '/admin/settings/contact',
        icon: <Phone className="h-4 w-4" />,
      },
      {
        name: 'Footer Links',
        path: '/admin/settings/footer-links',
        icon: <Link2 className="h-4 w-4" />,
      },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  isMobileOpen,
  onToggle,
  onMobileToggle
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/admin/products', '/admin/settings']);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/dashboard';
    }
    // Customers group: active when on users OR contact-submissions
    if (path === '/admin/users') {
      return location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/contact-submissions');
    }
    return location.pathname.startsWith(path);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-white border-r border-gray-200 hidden lg:flex lg:flex-col ${isOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          {isOpen ? (
            <Link to="/" className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent truncate">
                Admin
              </span>
            </Link>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.subItems ? (
                // Parent item with submenu
                <div>
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group min-h-[44px] ${isActive(item.path)
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    title={!isOpen ? item.name : undefined}
                  >
                    <div className="flex items-center">
                      <span
                        className={`flex-shrink-0 ${isActive(item.path)
                          ? 'text-amber-600'
                          : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                      >
                        {item.icon}
                      </span>
                      {isOpen && (
                        <span className="ml-3 text-sm font-medium truncate">{item.name}</span>
                      )}
                    </div>
                    {isOpen && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${expandedItems.includes(item.path) ? 'rotate-180' : ''
                          }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {isOpen && expandedItems.includes(item.path) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 group min-h-[40px] ${location.pathname === subItem.path
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                        >
                          <span
                            className={`flex-shrink-0 ${location.pathname === subItem.path
                              ? 'text-amber-600'
                              : 'text-gray-400 group-hover:text-gray-600'
                              }`}
                          >
                            {subItem.icon}
                          </span>
                          <span className="ml-2 text-sm truncate">{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular item without submenu
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group min-h-[44px] ${isActive(item.path)
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  title={!isOpen ? item.name : undefined}
                >
                  <span
                    className={`flex-shrink-0 ${isActive(item.path)
                      ? 'text-amber-600'
                      : 'text-gray-500 group-hover:text-gray-700'
                      }`}
                  >
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="ml-3 text-sm font-medium truncate">{item.name}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="absolute bottom-4 right-0 transform translate-x-1/2 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 max-w-[85vw] transition-transform duration-300 bg-white border-r border-gray-200 lg:hidden flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent truncate">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          {navItems.map((item) => (
            <div key={item.path}>
              {item.subItems ? (
                // Parent item with submenu
                <div>
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] ${isActive(item.path)
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`flex-shrink-0 ${isActive(item.path)
                          ? 'text-amber-600'
                          : 'text-gray-500'
                          }`}
                      >
                        {item.icon}
                      </span>
                      <span className="ml-3 text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${expandedItems.includes(item.path) ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {/* Submenu */}
                  {expandedItems.includes(item.path) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={onMobileToggle}
                          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 min-h-[40px] ${location.pathname === subItem.path
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                        >
                          <span
                            className={`flex-shrink-0 ${location.pathname === subItem.path
                              ? 'text-amber-600'
                              : 'text-gray-400'
                              }`}
                          >
                            {subItem.icon}
                          </span>
                          <span className="ml-2 text-sm truncate">{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular item without submenu
                <Link
                  to={item.path}
                  onClick={onMobileToggle}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] ${isActive(item.path)
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                >
                  <span
                    className={`flex-shrink-0 ${isActive(item.path)
                      ? 'text-amber-600'
                      : 'text-gray-500'
                      }`}
                  >
                    {item.icon}
                  </span>
                  <span className="ml-3 text-sm font-medium truncate">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

