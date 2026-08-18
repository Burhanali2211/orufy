import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Settings, LogOut, User as UserIcon, Store, ExternalLink } from 'lucide-react';
import { User } from '@/shared/types';
import { useAuth } from '@/shared/contexts/AuthContext';

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  user: User | null;
  getInitials: () => string;
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((s, i) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '),
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  title,
  user,
  getInitials,
}) => {
  const { store, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = buildBreadcrumbs(location.pathname);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const computedHostname = (() => {
    if (store?.hostname && store.hostname !== 'get-oru.com' && store.hostname !== 'www.get-oru.com') {
      return store.hostname;
    }
    const sub = store?.slug || (store?.name ? store.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'easyio');
    return `${sub}.get-oru.com`;
  })();
  const storeUrl = `https://${computedHostname}`;

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

  return (
    <header className="hidden lg:flex items-center justify-between sticky top-0 z-30 px-8 h-16 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* ── Breadcrumb Hierarchy ── */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 min-w-0">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <span className="text-xs text-stone-300 font-medium">/</span>}
            {crumb.isLast ? (
              <span className="text-sm font-semibold text-stone-900 truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        {/* Quick View Live Store Link */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 transition-colors"
          title="Open live storefront in new tab"
        >
          <Store className="w-3.5 h-3.5 text-stone-600" />
          <span>View Storefront</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </a>

        {/* Settings button */}
        <button
          onClick={() => navigate('/admin/settings')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-stone-200 mx-1" />

        {/* User avatar / Dropdown Toggle */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-bold transition-all hover:bg-stone-800 cursor-pointer shadow-xs"
          title={user?.fullName || 'Account'}
        >
          {getInitials()}
        </button>

        {/* User Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-12 right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-stone-100 mb-1">
              <p className="text-sm font-bold text-stone-900 truncate">{user?.fullName || 'Admin User'}</p>
              <p className="text-xs text-stone-500 truncate mt-0.5">{user?.email}</p>
            </div>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/admin/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors text-left cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-stone-400" />
              Profile & Store Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default DesktopHeader;
