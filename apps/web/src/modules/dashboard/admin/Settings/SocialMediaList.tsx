import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { SocialMediaForm } from './SocialMediaForm';

interface SocialMediaAccount {
  id: string;
  platform: string;
  platform_name: string;
  url: string;
  username: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  follower_count: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export const SocialMediaList: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<SocialMediaAccount[]>('/api/dashboard/settings/social-media');
      setAccounts(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch social media accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media account?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/dashboard/settings/social-media/${id}`);
      showSuccess('Social media account deleted successfully');
      fetchAccounts();
    } catch (error: any) {
      showError(error.message || 'Failed to delete social media account');
    }
  };

  const handleEdit = (account: SocialMediaAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
    fetchAccounts();
  };

  const toggleActive = async (account: SocialMediaAccount) => {
    try {
      await apiClient.patch(`/api/dashboard/settings/social-media/${account.id}`, { is_active: !account.is_active });
      showSuccess(`Social media account ${!account.is_active ? 'activated' : 'deactivated'}`);
      fetchAccounts();
    } catch (error: any) {
      showError(error.message || 'Failed to update social media account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Social Media Accounts</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your social media presence</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`bg-white rounded-lg border-2 p-3 sm:p-6 transition-all ${account.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${account.is_active ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                  <span className="text-lg sm:text-2xl">{getPlatformIcon(account.platform)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-xs sm:text-base text-gray-900 truncate">{account.platform_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{account.username}</p>
                </div>
              </div>
              <button
                onClick={() => toggleActive(account)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${account.is_active
                    ? 'bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                title={account.is_active ? 'Active' : 'Inactive'}
              >
                {account.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            {/* Stats */}
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Followers</span>
                <span className="font-semibold text-gray-900">
                  {account.follower_count.toLocaleString()}
                </span>
              </div>
              {account.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{account.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 pt-3 sm:pt-4 border-t border-gray-100">
              <a
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Visit</span>
              </a>
              <button
                onClick={() => handleEdit(account)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 active:bg-purple-300 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
              >
                <Edit2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="px-2 sm:px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:bg-red-300 transition-colors min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <Plus className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Social Media Accounts</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first social media account</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Account
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <SocialMediaForm
          account={editingAccount}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

// Helper function to get platform icon
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    youtube: '📺',
    linkedin: '💼',
    pinterest: '📌',
    tiktok: '🎵',
    whatsapp: '💬',
    telegram: '✈️',
    snapchat: '👻',
  };
  return icons[platform.toLowerCase()] || '🌐';
}

