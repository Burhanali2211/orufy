import React from 'react';
import { Save, X } from 'lucide-react';

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

interface PlatformOption {
  value: string;
  label: string;
  icon: string;
}

const platformOptions: PlatformOption[] = [
  { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X', icon: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music' },
  { value: 'pinterest', label: 'Pinterest', icon: 'Pin' },
  { value: 'snapchat', label: 'Snapchat', icon: 'Ghost' }
];

interface SocialMediaAccountFormProps {
  editingAccount: SocialMediaAccount | null;
  formData: {
    platform: string;
    platform_name: string;
    url: string;
    username: string;
    icon_name: string;
    follower_count: string;
    description: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSave: () => void;
  onPlatformChange: (platform: string) => void;
}

export const SocialMediaAccountForm: React.FC<SocialMediaAccountFormProps> = ({
  editingAccount,
  formData,
  setFormData,
  onClose,
  onSave,
  onPlatformChange
}) => {
  const inputCls = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-all';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-xl sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {editingAccount ? 'Edit' : 'Add'} Social Media Account
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
            <select
              value={formData.platform}
              onChange={(e) => onPlatformChange(e.target.value)}
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
              onChange={(e) => setFormData((prev: any) => ({ ...prev, url: e.target.value }))}
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
              onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
              className={inputCls}
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Follower Count</label>
            <input
              type="number"
              value={formData.follower_count}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, follower_count: e.target.value }))}
              className={inputCls}
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 resize-none"
              rows={3}
              placeholder="Brief description about this account"
            />
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3.5 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!formData.platform || !formData.url}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Save className="h-4 w-4" />
            {editingAccount ? 'Update' : 'Add'} Account
          </button>
        </div>
      </div>
    </div>
  );
};

