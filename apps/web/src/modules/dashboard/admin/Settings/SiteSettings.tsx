import React, { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, Upload, X, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/config/api';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  description: string | null;
  is_public: boolean;
}

export const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<{ success: boolean; data: Setting[] }>('/dashboard/settings/site-settings');
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save setting
  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(key);
      const data = await apiClient.put<{ success: boolean }>(`/dashboard/settings/site-settings/${key}`, { setting_value: value });
      if (data.success) {
        await fetchSettings();
        setEditingKey(null);
      } else {
        console.error('Failed to save setting');
      }
    } catch (error: unknown) {
      console.error('Error saving setting:', error);
      alert(error instanceof Error ? error.message : 'Failed to save setting. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  // Start editing
  const startEdit = (setting: Setting) => {
    setEditingKey(setting.setting_key);
    setEditValue(setting.setting_value);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Settings Groups */}
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {editingKey === setting.setting_key ? (
                      <>
                        <button
                          onClick={() => handleSave(setting.setting_key, editValue)}
                          disabled={saving === setting.setting_key}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                          {saving === setting.setting_key ? (
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

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Settings
        </button>
      </div>
    </div>
  );
};
