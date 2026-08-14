import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Store } from 'lucide-react';
import { DashboardSettings } from '@/hooks/useAdminDashboardSettings';

interface MobileHeaderProps {
  settings: DashboardSettings;
  setSidebarOpen: (open: boolean) => void;
  title: string;
  subtitle?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  settings,
  setSidebarOpen,
  title,
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="flex items-center justify-between px-3.5 py-2.5 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-1 rounded-xl hover:bg-stone-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-stone-800" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <div className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-extrabold text-stone-900 tracking-tight">
            {title || settings.dashboard_name || 'Admin'}
          </span>
        </div>

        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-700"
          aria-label="View store"
        >
          <Store className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
