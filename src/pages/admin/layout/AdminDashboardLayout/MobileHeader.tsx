import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Store } from 'lucide-react';
import { DashboardSettings } from '@/hooks/useAdminDashboardSettings';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  settings: DashboardSettings;
  setSidebarOpen: (open: boolean) => void;
  title: string;
  subtitle?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setSidebarOpen,
  title,
}) => {
  const { store } = useAuth();

  return (
    <header
      className="lg:hidden sticky top-0 z-40"
      style={{ background: '#fff', borderBottom: '1px solid #e8eaed' }}
    >
      <div className="flex items-center justify-between px-3 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: '#1a73e8' }}
          >
            <div className="w-3 h-3 rounded-sm" style={{ background: '#fff', opacity: 0.9 }} />
          </div>
          <span
            className="text-[14px] font-semibold"
            style={{ color: '#202124', fontFamily: "'Google Sans', Inter, sans-serif" }}
          >
            {title || store?.name || 'Admin'}
          </span>
        </div>

        <Link
          to={store ? `https://${store.hostname}` : '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: '#5f6368' }}
          aria-label="View store"
        >
          <Store className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
