import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboardSettings } from '@/hooks/useAdminDashboardSettings';
import { AdminDashboardLayoutProps, NavItem } from './AdminDashboardLayout/types';
import { Sidebar } from './AdminDashboardLayout/Sidebar';
import { DesktopHeader } from './AdminDashboardLayout/DesktopHeader';
import { MobileHeader } from './AdminDashboardLayout/MobileHeader';

// Simplified direct navigation - zero clutter, zero non-working nested submenus
const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: Tag },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', path: '/admin/users', icon: Users },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
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
  const { settings } = useAdminDashboardSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'A';
  };

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: '#f8f9fa', color: '#202124' }}>
      <MobileHeader 
        settings={settings} 
        setSidebarOpen={setSidebarOpen} 
        title={title} 
        subtitle={subtitle} 
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 shadow-none transform transition-transform duration-250 ease-in-out flex flex-col lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#fff', borderRight: '1px solid #e8eaed' }}
      >
        <Sidebar 
          settings={settings}
          user={user}
          navItems={navItems}
          setSidebarOpen={setSidebarOpen}
          expandedItems={[]}
          toggleExpanded={() => {}}
          isActive={isActive}
          handleLogout={handleLogout}
          getInitials={getInitials}
          locationPathname={location.pathname}
        />
      </aside>

      <main className="lg:ml-64 min-h-screen flex flex-col">
        <DesktopHeader 
          title={title} 
          subtitle={subtitle} 
          user={user} 
          getInitials={getInitials} 
        />

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
