import React, { useState, useEffect } from 'react';
import { Share2, Plus, Edit2, Trash2, Save, X, RefreshCw, ChevronUp, ChevronDown, Eye, EyeOff, CheckSquare, Square, Loader2, Filter, Search, ExternalLink } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface SocialMediaAccount {
  id: string;
  platform: string;
  platformName: string;
  url: string;
  username: string | null;
  iconName: string;
  isActive: boolean;
  displayOrder: number;
  followerCount: number | null;
  description: string | null;
}

const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X', icon: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music' },
  { value: 'pinterest', label: 'Pinterest', icon: 'Pin' },
  { value: 'snapchat', label: 'Snapchat', icon: 'Ghost' }
];

export const SocialMediaSettings: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const [formData, setFormData] = useState({
    platform: '', platformName: '', url: '', username: '', iconName: '', followerCount: '', description: ''
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<SocialMediaAccount[]>('/api/dashboard/settings/social-media');
      setAccounts((data || []).sort((a: SocialMediaAccount, b: SocialMediaAccount) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    } catch (error: any) {
      showError('Error', error.message || 'Failed to fetch social media accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openModal = (account?: SocialMediaAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        platform: account.platform, platformName: account.platformName, url: account.url,
        username: account.username || '', iconName: account.iconName,
        followerCount: account.followerCount?.toString() || '', description: account.description || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({ platform: '', platformName: '', url: '', username: '', iconName: '', followerCount: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({ platform: '', platformName: '', url: '', username: '', iconName: '', followerCount: '', description: '' });
  };

  const handlePlatformChange = (platform: string) => {
    const selected = platformOptions.find(p => p.value === platform);
    if (selected) setFormData(prev => ({ ...prev, platform, platformName: selected.label, iconName: selected.icon }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        platform: formData.platform, platformName: formData.platformName, url: formData.url,
        username: formData.username || null, iconName: formData.iconName,
        followerCount: formData.followerCount ? parseInt(formData.followerCount, 10) : null,
        description: formData.description || null
      };
      if (editingAccount) {
        await apiClient.patch(`/api/dashboard/settings/social-media/${editingAccount.id}`, payload);
      } else {
        const maxOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.displayOrder ?? 0)) + 1 : 1;
        await apiClient.post('/api/dashboard/settings/social-media', { ...payload, displayOrder: maxOrder, isActive: true });
      }
      showSuccess('Saved', `Account ${editingAccount ? 'updated' : 'added'} successfully`);
      await fetchAccounts();
      closeModal();
    } catch (error: any) {
      showError('Error', error.message || 'Error saving account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;
    try {
      await apiClient.delete(`/api/dashboard/settings/social-media/${id}`);
      showSuccess('Deleted', 'Account deleted successfully');
      await fetchAccounts();
    } catch (error: any) {
      showError('Error', error.message || 'Error deleting account');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} social media account(s)?`)) return;
    try {
      await apiClient.post('/api/dashboard/settings/social-media/bulk-delete', { ids: Array.from(selectedIds) });
      showSuccess('Deleted', `${count} account(s) deleted successfully`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await fetchAccounts();
    } catch (error: any) {
      showError('Error', error.message || 'Error deleting accounts');
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const selectAll = () => setSelectedIds(new Set(accounts.map(a => a.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/dashboard/settings/social-media/${id}`, { isActive: !currentStatus });
      showSuccess('Updated', `Account ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchAccounts();
    } catch (error: any) {
      showError('Error', error.message || 'Error updating account status');
    }
  };

  const moveAccount = async (id: string, direction: 'up' | 'down') => {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === accounts.length - 1) return;
    const newAccounts = [...accounts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newAccounts[index], newAccounts[targetIndex]] = [newAccounts[targetIndex], newAccounts[index]];
    newAccounts.forEach((account, idx) => { account.displayOrder = idx + 1; });
    setAccounts(newAccounts);
    try {
      for (const account of newAccounts) {
        await apiClient.patch(`/api/dashboard/settings/social-media/${account.id}`, { displayOrder: account.displayOrder });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Error updating order');
      await fetchAccounts();
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm ||
      account.platformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = !platformFilter || account.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platforms = Array.from(new Set(accounts.map(a => a.platform))).sort();

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘', instagram: '📷', twitter: '🐦', youtube: '📺',
      linkedin: '💼', pinterest: '📌', tiktok: '🎵', whatsapp: '💬',
      telegram: '✈️', snapchat: '👻',
    };
    return icons[platform.toLowerCase()] || '🌐';
  };

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading social media accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Share2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Social Media</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your social media accounts and links</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectionMode && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}
          <button
            onClick={toggleSelectionMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              selectionMode
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {selectionMode ? <><X className="h-4 w-4" /><span>Cancel</span></> : <><CheckSquare className="h-4 w-4" /><span className="hidden sm:inline">Select</span></>}
          </button>
          {!selectionMode && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          {(searchTerm || platformFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setPlatformFilter(''); }}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm text-gray-900"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform} className="capitalize">{platform}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Mode Controls */}
      {selectionMode && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.size} of {accounts.length} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Deselect All</button>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <Share2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No social media accounts found</p>
          {searchTerm || platformFilter
            ? <p className="text-sm text-gray-400">Try adjusting your filters</p>
            : <p className="text-sm text-gray-400">Get started by adding your first account</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              className={`bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
                !account.isActive ? 'opacity-60' : ''
              } ${selectionMode && selectedIds.has(account.id) ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {selectionMode && (
                    <button onClick={() => toggleSelect(account.id)} className="flex-shrink-0">
                      {selectedIds.has(account.id)
                        ? <CheckSquare className="h-5 w-5 text-slate-700" />
                        : <Square className="h-5 w-5 text-gray-400" />}
                    </button>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${account.isActive ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{account.platformName}</h3>
                    {account.username && <p className="text-xs text-gray-500 truncate">@{account.username}</p>}
                  </div>
                </div>
                {!selectionMode && (
                  <button
                    onClick={() => toggleActive(account.id, account.isActive)}
                    className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
                      account.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={account.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {account.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {/* URL */}
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

              {account.followerCount && (
                <div className="mb-3 px-2.5 py-2 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Followers</p>
                  <p className="text-sm font-semibold text-gray-900">{account.followerCount.toLocaleString()}</p>
                </div>
              )}

              {account.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{account.description}</p>
              )}

              {!selectionMode && (
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => moveAccount(account.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveAccount(account.id, 'down')}
                    disabled={index === filteredAccounts.length - 1}
                    className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openModal(account)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors border border-slate-200 text-xs font-medium"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 && !loading && (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-200 rounded-lg">
          <Share2 className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No social media accounts added yet</p>
          <button
            onClick={() => openModal()}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-2 font-medium transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Your First Account
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingAccount ? 'Edit' : 'Add'} Social Media Account
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                <select
                  value={formData.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select a platform</option>
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className={inputCls}
                  placeholder="https://facebook.com/yourpage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username / Handle</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={inputCls}
                  placeholder="@yourhandle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follower Count</label>
                <input
                  type="number"
                  value={formData.followerCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, followerCount: e.target.value }))}
                  className={inputCls}
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 resize-none"
                  rows={3}
                  placeholder="Brief description about this account"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3.5 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-xl sticky bottom-0">
              <button onClick={closeModal} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.platform || !formData.url}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Save className="h-4 w-4" />
                {editingAccount ? 'Update' : 'Add'} Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
