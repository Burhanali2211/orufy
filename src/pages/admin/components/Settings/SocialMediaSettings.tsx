import { apiClient } from '@/lib/apiClient';
import React, { useState } from 'react';
import { Share2, Plus, Edit2, Trash2, Save, X, RefreshCw, ChevronUp, ChevronDown, Eye, EyeOff, CheckSquare, Square, Filter, Search, ExternalLink } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  useSocialAccountsQuery, 
  useUpsertSocialAccountMutation, 
  useDeleteSocialAccountMutation, 
  useDeleteSocialAccountsMutation,
  useUpdateSocialAccountMutation
} from '@/hooks/admin/useSettingsQueries';

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

import { SocialMediaAccountCard } from './SocialMediaAccountCard';
import { SocialMediaAccountForm } from './SocialMediaAccountForm';

export const SocialMediaSettings: React.FC = () => {
  const { data: accountsRaw = [], isLoading: loading } = useSocialAccountsQuery();
  const accounts = [...accountsRaw].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  
  const upsertMutation = useUpsertSocialAccountMutation();
  const deleteMutation = useDeleteSocialAccountMutation();
  const bulkDeleteMutation = useDeleteSocialAccountsMutation();
  const updateMutation = useUpdateSocialAccountMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const [formData, setFormData] = useState({
    platform: '', platform_name: '', url: '', username: '', icon_name: '', follower_count: '', description: ''
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/social');
      
      setAccounts((data || []).sort((a: SocialMediaAccount, b: SocialMediaAccount) => (a.display_order ?? 0) - (b.display_order ?? 0)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch accounts';
      showError('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openModal = (account?: SocialMediaAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        platform: account.platform, platform_name: account.platform_name, url: account.url,
        username: account.username || '', icon_name: account.icon_name,
        follower_count: account.follower_count?.toString() || '', description: account.description || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({ platform: '', platform_name: '', url: '', username: '', icon_name: '', follower_count: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({ platform: '', platform_name: '', url: '', username: '', icon_name: '', follower_count: '', description: '' });
  };

  const handlePlatformChange = (platform: string) => {
    const selected = platformOptions.find(p => p.value === platform);
    if (selected) setFormData(prev => ({ ...prev, platform, platform_name: selected.label, icon_name: selected.icon }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        platform: formData.platform, platform_name: formData.platform_name, url: formData.url,
        username: formData.username || null, icon_name: formData.icon_name,
        follower_count: formData.follower_count ? parseInt(formData.follower_count, 10) : null,
        description: formData.description || null
      };
      
      if (editingAccount) {
        await upsertMutation.mutateAsync({ ...payload, id: editingAccount.id });
      } else {
        const maxOrder = accounts.length > 0 ? Math.max(...accounts.map(a => a.display_order ?? 0)) + 1 : 1;
        await upsertMutation.mutateAsync({ ...payload, display_order: maxOrder, is_active: true });
      }
      
      showSuccess('Saved', `Account ${editingAccount ? 'updated' : 'added'} successfully`);
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving account';
      showError('Error', msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess('Deleted', 'Account deleted successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting account';
      showError('Error', msg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} social media account(s)?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
      showSuccess('Deleted', `${count} account(s) deleted successfully`);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting accounts';
      showError('Error', msg);
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
      await updateMutation.mutateAsync({ id, data: { is_active: !currentStatus } });
      showSuccess('Updated', `Account ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating account status';
      showError('Error', msg);
    }
  };

  const moveAccount = async (id: string, direction: 'up' | 'down') => {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === accounts.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const movingAccount = accounts[index];
    const swapAccount = accounts[targetIndex];

    try {
      // Optimistically we could swap but let's just do the updates
      await Promise.all([
        updateMutation.mutateAsync({ id: movingAccount.id, data: { display_order: swapAccount.display_order } }),
        updateMutation.mutateAsync({ id: swapAccount.id, data: { display_order: movingAccount.display_order } })
      ]);
      showSuccess('Order Updated', 'Display order saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating order';
      showError('Error', msg);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm ||
      account.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = !platformFilter || account.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platforms = Array.from(new Set(accounts.map(a => a.platform))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <></>
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
            <SocialMediaAccountCard
              key={account.id}
              account={account}
              index={index}
              totalVisible={filteredAccounts.length}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(account.id)}
              onSelect={toggleSelect}
              onToggleActive={toggleActive}
              onMove={moveAccount}
              onEdit={openModal}
              onDelete={handleDelete}
            />
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
        <SocialMediaAccountForm
          editingAccount={editingAccount}
          formData={formData}
          setFormData={setFormData}
          onPlatformChange={handlePlatformChange}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

