import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { User } from '@/types';

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
  getInitials
}) => {
  return (
    <header className="hidden lg:block sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/60">
      <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Title Block */}
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/70 rounded-lg transition-all"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-zinc-200/80">
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-900 leading-tight">{user?.fullName || 'Administrator'}</p>
              <p className="text-[11px] text-zinc-400 font-normal">Super Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {getInitials()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
