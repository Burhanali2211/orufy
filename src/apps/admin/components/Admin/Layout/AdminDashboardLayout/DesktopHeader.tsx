import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, HelpCircle, Settings, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@/shared/types';
import { useAuth } from '@/shared/contexts/AuthContext';

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
  const { store, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = buildBreadcrumb(location.pathname);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real app, you would navigate to a search results page or filter the current view
      console.log('Searching for:', searchQuery);
      alert(`Search feature coming soon! (Query: ${searchQuery})`);
    }
  };

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
        <form
          onSubmit={handleSearch}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, products, customers..."
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: '#202124', fontFamily: "'Google Sans', Inter, sans-serif" }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </form>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1 relative" ref={dropdownRef}>
        {/* Help */}
        <button
          onClick={() => window.open('https://help.orufy.com', '_blank')}
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
          onClick={() => navigate('/admin/settings')}
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
          onClick={() => alert('No new notifications')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors relative"
          style={{ color: '#5f6368' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Unread badge indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white hidden" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-2" style={{ background: '#e8eaed' }} />

        {/* User avatar / Dropdown Toggle */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ background: '#1a73e8' }}
          title={user?.fullName || 'Account'}
        >
          {getInitials()}
        </button>

        {/* User Dropdown Menu */}
        {isDropdownOpen && (
          <div 
            className="absolute top-12 right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="px-4 py-3 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Admin User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/admin/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <UserIcon className="w-4 h-4 text-gray-400" />
              Profile & Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium mt-1"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
