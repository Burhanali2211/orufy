import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, LogOut, Store, Globe } from 'lucide-react';
import { NavItem } from './types';
import { DashboardSettings } from '@/hooks/useAdminDashboardSettings';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

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
  navItems,
  setSidebarOpen,
  isActive,
  handleLogout,
  user,
  getInitials,
}) => {
  const { store } = useAuth();
  const storeUrl = store ? `https://${store.hostname}` : null;

  return (
    <aside className="flex flex-col h-full bg-white border-r border-zinc-100 select-none">

      {/* ── Store Context Header ── */}
      <div className="px-5 pt-6 pb-4 border-b border-zinc-100 flex-shrink-0">
        {/* Close button (mobile only) */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 leading-tight truncate max-w-[148px]">
                {store?.name || 'Your Store'}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Store Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors lg:hidden flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Store chip */}
        {storeUrl ? (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200/70 hover:bg-zinc-100 transition-colors group"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-zinc-500 truncate flex-1 group-hover:text-zinc-800 transition-colors">
              {store?.hostname}
            </span>
            <ExternalLink className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />
          </a>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
            <Globe className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
            <span className="text-[11px] font-medium text-zinc-400">No store connected</span>
          </div>
        )}
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 min-h-[42px] ${
                active
                  ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-zinc-400'}`} />
              <span className="flex-1 tracking-tight">{item.name}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="p-3 border-t border-zinc-100 flex-shrink-0">
        {/* User info row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">{user?.fullName || 'Administrator'}</p>
            <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors min-h-[40px]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
