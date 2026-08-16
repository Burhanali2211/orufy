import React, { useState } from 'react';
import { Globe, Save, RefreshCw, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  description: string | null;
  is_public: boolean;
}

export const SiteSettings: React.FC = () => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading, refetch, isRefetching } = useQuery<Setting[]>({
    queryKey: ['admin-site-settings'],
    queryFn: () => apiClient.get('/admin/settings/site-settings').then(res => res.data || []),
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiClient.put(`/admin/settings/site-settings/${key}`, { setting_value: value }),
    onSuccess: () => {
      showSuccess('Setting saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      setEditingKey(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to save setting');
    },
  });

  const handleSave = (key: string, value: string) => {
    saveMutation.mutate({ key, value });
  };

  const startEdit = (setting: Setting) => {
    setEditingKey(setting.setting_key);
    setEditValue(setting.setting_value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-gray-600 mt-1">Configure general website settings and information</p>
          </div>
        </div>
      </div>

      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{category}</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {setting.setting_key.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h3>
                      {setting.is_public && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-500 mb-3">{setting.description}</p>
                    )}

                    {editingKey === setting.setting_key ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg break-all">
                        {setting.setting_value}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingKey === setting.setting_key ? (
                      <>
                        <button
                          onClick={() => handleSave(setting.setting_key, editValue)}
                          disabled={saveMutation.isPending}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                          {saveMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(setting)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Settings
        </button>
      </div>
    </div>
  );
};
