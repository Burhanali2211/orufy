import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, LogOut } from 'lucide-react';
import { NavItem } from './types';
import { DashboardSettings } from '@/hooks/useAdminDashboardSettings';
import { User } from '@/types';

interface SidebarProps {
  settings: DashboardSettings;
  user: User | null;
  navItems: NavItem[];
  setSidebarOpen: (open: boolean) => void;
  expandedItems: string[];
  toggleExpanded: (path: string) => void;
  isActive: (path: string) => boolean;
  handleLogout: () => Promise<void>;
  getInitials: () => string;
  locationPathname: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  navItems,
  setSidebarOpen,
  isActive,
  handleLogout,
}) => {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-zinc-200/80 select-none">
      {/* Brand Header - Elegant Human Wordmark */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100 flex-shrink-0">
        <Link to="/admin" className="flex flex-col group">
          <span className="text-sm font-extrabold text-zinc-900 tracking-wider uppercase leading-none group-hover:text-zinc-700 transition-colors">
            {settings.dashboard_name || 'ALIGARH ATTAR'}
          </span>
          <span className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase mt-1">
            Store Management
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Spacious Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          General
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px] ${
                active
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`} />
              <span className="flex-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-zinc-100 space-y-1 flex-shrink-0">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors min-h-[40px]"
        >
          <span className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>View Public Store</span>
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-red-600 hover:bg-red-50/80 transition-colors min-h-[40px]"
        >
          <LogOut className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
