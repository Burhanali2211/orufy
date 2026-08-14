import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  user: User | null;
  getInitials: () => string;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  title,
  subtitle,
  user,
  getInitials,
}) => {
  const { store } = useAuth();
  const storeUrl = store ? `https://${store.hostname}` : null;
  const userRole = user?.role === 'admin' || user?.role === 'merchant' ? 'Store Owner' : 'Administrator';

  return (
    <header className="hidden lg:block sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100">
      <div className="flex items-center justify-between px-8 h-16">

        {/* ── Breadcrumb + Title ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Page title */}
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-zinc-900 tracking-tight leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5 leading-tight">{subtitle}</p>
            )}
          </div>
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Live store link */}
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 transition-all"
              title={`Visit ${store?.hostname}`}
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[140px] truncate">{store?.hostname || 'Live Store'}</span>
              <ExternalLink className="w-3 h-3 text-zinc-300" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200">
              <Globe className="w-3.5 h-3.5" />
              No store
            </span>
          )}

          {/* User pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-100">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-semibold text-zinc-900 leading-tight">{user?.fullName || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-400 font-normal">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {getInitials()}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
