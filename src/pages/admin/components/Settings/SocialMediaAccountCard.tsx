import React from 'react';
import { Edit2, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface SocialMediaAccount {
  id: string;
  platform: string;
  platform_name: string;
  url: string;
  username: string | null;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  follower_count: number | null;
  description: string | null;
}

interface SocialMediaAccountCardProps {
  account: SocialMediaAccount;
  index: number;
  totalVisible: number;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onEdit: (account: SocialMediaAccount) => void;
  onDelete: (id: string) => void;
}

export const SocialMediaAccountCard: React.FC<SocialMediaAccountCardProps> = ({
  account,
  index,
  totalVisible,
  selectionMode,
  isSelected,
  onSelect,
  onToggleActive,
  onMove,
  onEdit,
  onDelete
}) => {
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘', instagram: '📷', twitter: '🐦', youtube: '📺',
      linkedin: '💼', pinterest: '📌', tiktok: '🎵', whatsapp: '💬',
      telegram: '✈️', snapchat: '👻',
    };
    return icons[platform.toLowerCase()] || '🌐';
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
        !account.is_active ? 'opacity-60' : ''
      } ${selectionMode && isSelected ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectionMode && (
            <button onClick={() => onSelect(account.id)} className="flex-shrink-0">
              {isSelected
                ? <CheckSquare className="h-5 w-5 text-slate-700" />
                : <Square className="h-5 w-5 text-gray-400" />}
            </button>
          )}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${account.is_active ? 'bg-blue-50' : 'bg-gray-100'}`}>
            {getPlatformIcon(account.platform)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{account.platform_name}</h3>
            {account.username && <p className="text-xs text-gray-500 truncate">@{account.username}</p>}
          </div>
        </div>
        {!selectionMode && (
          <button
            onClick={() => onToggleActive(account.id, account.is_active)}
            className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
              account.is_active
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={account.is_active ? 'Deactivate' : 'Activate'}
          >
            {account.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      <div className="mb-3 p-2.5 bg-gray-50 rounded-md border border-gray-100">
        <div className="flex items-center gap-1.5 mb-0.5">
          <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-gray-400">Profile URL</span>
        </div>
        <a
          href={account.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 block truncate"
          title={account.url}
        >
          {account.url}
        </a>
      </div>

      {account.follower_count && (
        <div className="mb-3 px-2.5 py-2 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Followers</p>
          <p className="text-sm font-semibold text-gray-900">{account.follower_count.toLocaleString()}</p>
        </div>
      )}

      {account.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{account.description}</p>
      )}

      {!selectionMode && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
          <button
            onClick={() => onMove(account.id, 'up')}
            disabled={index === 0}
            className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(account.id, 'down')}
            disabled={index === totalVisible - 1}
            className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(account)}
            className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors border border-slate-200 text-xs font-medium"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

