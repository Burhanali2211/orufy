import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDashboardAuth } from './hooks/useDashboardAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS: { label: string; to: string; end: boolean }[] = [
  { label: 'Overview', to: '/dashboard', end: true },
  { label: 'Products', to: '/dashboard/products', end: false },
  { label: 'Orders', to: '/dashboard/orders', end: false },
  { label: 'Domain & Settings', to: '/dashboard/settings', end: false },
];

interface SidebarContentProps {
  shopName: string;
  planLabel: string;
  storefrontUrl: string;
  onSignOut: () => void;
  onLinkClick?: () => void;
  onClose?: () => void;
}

function SidebarContent({
  shopName,
  planLabel,
  storefrontUrl,
  onSignOut,
  onLinkClick,
  onClose,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Shop name + plan */}
      <div className="relative px-4 py-5 border-b border-gray-100">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-3 text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
        <p className="text-sm font-semibold text-gray-900 truncate pr-6">{shopName}</p>
        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
          {planLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `block text-sm py-2 px-3 rounded-md ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-gray-400 hover:text-gray-600"
        >
          View my store ↗
        </a>
        <button
          onClick={onSignOut}
          className="block text-xs text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, tenant, signOut } = useDashboardAuth();

  const shopName = tenant?.name ?? user?.name ?? 'My Shop';
  const planLabel = tenant?.plan
    ? `${tenant.plan.charAt(0).toUpperCase()}${tenant.plan.slice(1)} plan`
    : 'Free plan';
  const avatarInitial = (user?.name ?? user?.email ?? 'S').charAt(0).toUpperCase();
  const storefrontUrl = tenant?.slug
    ? `https://${tenant.slug}.orufy.com`
    : '#';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 z-30">
        <SidebarContent
          shopName={shopName}
          planLabel={planLabel}
          storefrontUrl={storefrontUrl}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="relative w-56 bg-white shadow-lg h-full">
            <SidebarContent
              shopName={shopName}
              planLabel={planLabel}
              storefrontUrl={storefrontUrl}
              onSignOut={handleSignOut}
              onLinkClick={closeMobile}
              onClose={closeMobile}
            />
          </div>
          {/* Backdrop */}
          <div
            className="flex-1 bg-black bg-opacity-30"
            onClick={closeMobile}
          />
        </div>
      )}

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-600 text-xl leading-none"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
          {shopName}
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
          {avatarInitial}
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-56 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
