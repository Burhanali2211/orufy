import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, LogOut, LayoutDashboard, Store, ChevronRight } from 'lucide-react';
import { NavItem } from './types';
import { User } from '@/types';
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
  const storeUrl = store ? `https://${store.hostname}` : null;

  return (
    <aside className="flex flex-col h-full select-none" style={{ background: '#fff', borderRight: '1px solid #e8eaed' }}>

      {/* ── Brand / App header ── */}
      <div className="flex items-center justify-between px-4 h-16 flex-shrink-0" style={{ borderBottom: '1px solid #e8eaed' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#1a73e8' }}>
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: '#202124', fontFamily: "'Google Sans', Inter, sans-serif" }}>
              {store?.name || 'Orufy'}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: '#5f6368' }}>Admin Console</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-full transition-colors"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Live store chip ── */}
      {storeUrl && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-medium transition-colors"
            style={{ background: '#e8f0fe', color: '#1a73e8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#d2e3fc')}
            onMouseLeave={e => (e.currentTarget.style.background = '#e8f0fe')}
          >
            <Store className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate flex-1">{store?.hostname}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
          </a>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-full text-[13px] font-medium transition-all duration-100 min-h-[40px] mb-0.5"
              style={{
                background: active ? '#e8f0fe' : 'transparent',
                color: active ? '#1a73e8' : '#3c4043',
                fontFamily: "'Google Sans', Inter, sans-serif",
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f1f3f4'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon
                className="w-[18px] h-[18px] flex-shrink-0"
                style={{ color: active ? '#1a73e8' : '#5f6368' }}
              />
              <span className="flex-1 tracking-[0.01em]">{item.name}</span>
              {active && <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: '#1a73e8' }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid #e8eaed' }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mb-1"
          style={{ background: '#f8f9fa' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: '#1a73e8' }}
          >
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#202124' }}>{user?.fullName || 'Admin'}</p>
            <p className="text-[10px] truncate" style={{ color: '#5f6368' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] font-medium transition-colors"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fce8e6';
            e.currentTarget.style.color = '#d93025';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#5f6368';
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
