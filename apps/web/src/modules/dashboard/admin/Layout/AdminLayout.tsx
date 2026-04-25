import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Close mobile sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        isMobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Content Area - Pushes content on desktop, overlays on mobile */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}>
        {/* Header */}
        <AdminHeader
          onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay - Must be above sidebar (z-50) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

