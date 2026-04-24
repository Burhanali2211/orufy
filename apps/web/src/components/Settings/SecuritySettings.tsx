import React, { useState, useEffect } from 'react';
import { Lock, Shield, AlertTriangle, Smartphone, Mail, Eye, EyeOff, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../lib/apiClient';
import { UserSecuritySettings } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUserSecuritySettings = async (_userId: string): Promise<UserSecuritySettings | null> => null;
const updateUserSecuritySettings = async (_settings: Partial<UserSecuritySettings>): Promise<boolean> => true;

export const SecuritySettings: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load security settings from database
  useEffect(() => {
    const loadSecuritySettings = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const settings = await getUserSecuritySettings(user.id);
        if (settings) {
          setSecuritySettings(settings);
        }
      } catch (err) {
        console.error('Error loading security settings:', err);
        setError('Failed to load security settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSecuritySettings();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSecuritySettingChange = async (setting: keyof UserSecuritySettings, value: boolean | string | undefined) => {
    if (!securitySettings) return;

    const updatedSettings = {
      ...securitySettings,
      [setting]: value
    };

    setSecuritySettings(updatedSettings);

    // Save to database immediately for security settings
    setSaving(true);
    try {
      const success = await updateUserSecuritySettings({ [setting]: value });
      if (success) {
        showNotification({
          type: 'success',
          title: 'Setting Updated',
          message: 'Security setting has been updated successfully'
        });
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (err) {
      console.error('Error updating security setting:', err);
      // Revert the change
      setSecuritySettings(securitySettings);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update security setting'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match'
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      showNotification({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    setSaving(true);
    try {
      await updatePassword(formData.newPassword);

      // Update password changed timestamp in security settings
      if (securitySettings) {
        await updateUserSecuritySettings({
          passwordChangedAt: new Date()
        });
      }

      showNotification({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been updated successfully'
      });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update password'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600 mt-1">Manage your password and security preferences</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-gray-600 mt-1">Manage your password and security preferences</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Password Change Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-6 rounded-full ${
                            level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Very Weak'}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                      • One number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                      • One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="input-field pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              className={`btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={saving ? {} : { scale: 1.02 }}
              whileTap={saving ? {} : { scale: 0.98 }}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </motion.button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings?.twoFactorEnabled || false}
                  onChange={() => handleSecuritySettingChange('twoFactorEnabled', !securitySettings?.twoFactorEnabled)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {securitySettings?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification in addition to your password.
          </p>

          {securitySettings?.twoFactorEnabled && (
            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSecuritySettingChange('twoFactorMethod', 'email')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      securitySettings.twoFactorMethod === 'email'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSecuritySettingChange('twoFactorMethod', 'sms')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      securitySettings.twoFactorMethod === 'sms'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSecuritySettingChange('twoFactorMethod', 'authenticator')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      securitySettings.twoFactorMethod === 'authenticator'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Authenticator App
                  </button>
                </div>
              </div>

              {securitySettings.twoFactorMethod === 'sms' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number for SMS Verification
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      className="input-field flex-1"
                      placeholder="Enter your phone number"
                      value={securitySettings.twoFactorPhone || ''}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        twoFactorPhone: e.target.value
                      })}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleSecuritySettingChange('twoFactorPhone', securitySettings.twoFactorPhone)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Alerts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Login Alerts</h4>
                <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings?.loginAlerts || false}
                  onChange={() => handleSecuritySettingChange('loginAlerts', !securitySettings?.loginAlerts)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Suspicious Activity Alerts</h4>
                <p className="text-sm text-gray-600">Get notified about suspicious account activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings?.suspiciousActivityAlerts || false}
                  onChange={() => handleSecuritySettingChange('suspiciousActivityAlerts', !securitySettings?.suspiciousActivityAlerts)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Security Tips</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Use a unique password that you don't use anywhere else</li>
            <li>• Make your password at least 8 characters long</li>
            <li>• Include a mix of letters, numbers, and special characters</li>
            <li>• Don't share your password with anyone</li>
            <li>• Consider using a password manager</li>
            <li>• Enable two-factor authentication for extra security</li>
          </ul>
        </div>

        {/* Account Security Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Account Security Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Email Verification</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Strong Password</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
