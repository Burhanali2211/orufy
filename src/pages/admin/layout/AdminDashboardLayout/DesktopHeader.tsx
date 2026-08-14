import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, HelpCircle, Settings, Bell } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  user: User | null;
  getInitials: () => string;
}

// Google-style breadcrumb from path
function buildBreadcrumb(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1));
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  title,
  user,
  getInitials,
}) => {
  const { store } = useAuth();
  const location = useLocation();
  const crumbs = buildBreadcrumb(location.pathname);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="hidden lg:flex items-center justify-between sticky top-0 z-30 px-6 h-16"
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8eaed',
      }}
    >
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-[13px]" style={{ color: '#bdc1c6' }}>/</span>
            )}
            <span
              className="text-[13px] font-medium"
              style={{
                color: i === crumbs.length - 1 ? '#202124' : '#5f6368',
                fontFamily: "'Google Sans', Inter, sans-serif",
              }}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* ── Search bar (Google style) ── */}
      <div className="flex-1 max-w-md mx-8">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-150"
          style={{
            background: searchFocused ? '#fff' : '#f1f3f4',
            border: searchFocused ? '1px solid #1a73e8' : '1px solid transparent',
            boxShadow: searchFocused ? '0 1px 6px rgba(32,33,36,.28)' : 'none',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#5f6368' }} />
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: '#202124', fontFamily: "'Google Sans', Inter, sans-serif" }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1">
        {/* Help */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors relative"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-2" style={{ background: '#e8eaed' }} />

        {/* User avatar */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: '#1a73e8' }}
          title={user?.fullName || 'Account'}
        >
          {getInitials()}
        </button>
      </div>
    </header>
  );
};
