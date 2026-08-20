import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { NavItem } from './types';
import { User } from '@/shared/types';
import { useAuth } from '@/shared/contexts/AuthContext';

interface SidebarProps {
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
  const computedHostname = (() => {
    if (store?.hostname && store.hostname !== 'get-oru.com' && store.hostname !== 'www.get-oru.com') {
      return store.hostname;
    }
    const sub = store?.slug || (store?.name ? store.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : 'store');
    return `${sub}.get-oru.com`;
  })();
  const storeUrl = `https://${computedHostname}`;

  return (
    <aside className="flex flex-col h-full bg-white border-r border-stone-200 select-none">

      {/* ── Brand / App header ── */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs font-bold text-xs">
            {store?.name ? store.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 leading-tight truncate">
              {store?.name || 'My Store'}
            </p>
            <p className="text-[11px] font-medium text-stone-500 leading-tight">Admin Console</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Live store chip ── */}
      {storeUrl && (
        <div className="px-3 pt-3.5 pb-1 flex-shrink-0">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200 transition-all group"
          >
            <Store className="w-4 h-4 text-stone-600 group-hover:text-stone-900 flex-shrink-0" />
            <span className="truncate flex-1">{computedHostname}</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 flex-shrink-0" />
          </a>
        </div>
      )}

      {/* ── Navigation Items ── */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-stone-500'}`} />
              <span className="flex-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-stone-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 mb-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
