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
import { useAuth } from '@/shared/contexts/AuthContext';
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
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
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
    <div className="min-h-screen font-sans antialiased bg-stone-50/60 text-stone-900">
      <MobileHeader 
        setSidebarOpen={setSidebarOpen} 
        title={title} 
        subtitle={subtitle} 
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 shadow-xl lg:shadow-none transform transition-transform duration-250 ease-in-out flex flex-col lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar 
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
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
