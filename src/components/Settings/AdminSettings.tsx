import React, { useState } from 'react';
import { Database, Shield, Globe, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

export const AdminSettings: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    site: {
      siteName: 'E-Commerce Platform',
      siteDescription: 'Your one-stop shop for everything',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@ecommerce.com',
      fromName: 'E-Commerce Platform'
    },
    security: {
      sessionTimeout: '24',
      maxLoginAttempts: '5',
      passwordMinLength: '8',
      requireStrongPassword: true,
      enableTwoFactor: false
    },
    data: {
      dataMode: 'real',
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: '30'
    }
  });

  const handleInputChange = (section: keyof typeof settings, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, you would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Admin settings have been updated successfully'
      });
    } catch {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save admin settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDataMode = () => {
    const newMode = settings.data.dataMode === 'real' ? 'mock' : 'real';
    handleInputChange('data', 'dataMode', newMode);
    localStorage.setItem('ecommerce_data_mode', newMode);
    
    showNotification({
      type: 'info',
      title: 'Data Mode Changed',
      message: `Switched to ${newMode} data mode. Refresh the page to see changes.`
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
      </div>

      <div className="space-y-8">
        {/* Site Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Site Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.site.siteName}
                onChange={(e) => handleInputChange('site', 'siteName', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
              <input
                type="text"
                value={settings.site.siteDescription}
                onChange={(e) => handleInputChange('site', 'siteDescription', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.site.maintenanceMode}
                onChange={(e) => handleInputChange('site', 'maintenanceMode', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Maintenance Mode</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.site.allowRegistration}
                onChange={(e) => handleInputChange('site', 'allowRegistration', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Allow User Registration</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.site.requireEmailVerification}
                onChange={(e) => handleInputChange('site', 'requireEmailVerification', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Require Email Verification</span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Mode</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDataMode}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.data.dataMode === 'real'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {settings.data.dataMode === 'real' ? 'Real Data Mode' : 'Mock Data Mode'}
                </button>
                <span className="text-sm text-gray-600">
                  {settings.data.dataMode === 'real' 
                    ? 'Using live database data' 
                    : 'Using demonstration data'
                  }
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                <select
                  value={settings.data.backupFrequency}
                  onChange={(e) => handleInputChange('data', 'backupFrequency', e.target.value)}
                  className="input-field"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retention Days</label>
                <input
                  type="number"
                  value={settings.data.retentionDays}
                  onChange={(e) => handleInputChange('data', 'retentionDays', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.data.autoBackup}
                onChange={(e) => handleInputChange('data', 'autoBackup', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Automatic Backups</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleInputChange('security', 'maxLoginAttempts', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Password Length</label>
              <input
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) => handleInputChange('security', 'passwordMinLength', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security.requireStrongPassword}
                onChange={(e) => handleInputChange('security', 'requireStrongPassword', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Require Strong Passwords</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security.enableTwoFactor}
                onChange={(e) => handleInputChange('security', 'enableTwoFactor', e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <motion.button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
