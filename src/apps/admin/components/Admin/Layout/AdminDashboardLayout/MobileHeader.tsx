import React from 'react';
import { Menu, Store, ExternalLink } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';

interface MobileHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  title: string;
  subtitle?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setSidebarOpen,
  title,
}) => {
  const { store } = useAuth();
  const storeUrl = store?.hostname && store.hostname !== 'get-oru.com' ? `https://${store.hostname}` : `https://${store?.slug || 'easyio'}.get-oru.com`;

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-[10px]">
            {store?.name ? store.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <span className="text-sm font-bold text-stone-900 truncate">
            {title || store?.name || 'Admin'}
          </span>
        </div>

        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="View store"
        >
          <Store className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};

export default MobileHeader;
