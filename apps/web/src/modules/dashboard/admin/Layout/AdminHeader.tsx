import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, Home } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200 flex-shrink-0"
            title="Toggle menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>

          {/* Page Title */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
          {/* Home Link */}
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200 flex-shrink-0"
            title="Go to Home"
            aria-label="Go to home page"
          >
            <Home className="h-5 w-5 text-gray-600" />
          </Link>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200 flex-shrink-0"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors active:bg-gray-200 flex-shrink-0"
              aria-label="User menu"
              aria-expanded={showProfileMenu}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role || 'admin'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/admin/settings"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-500 flex-shrink-0" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

