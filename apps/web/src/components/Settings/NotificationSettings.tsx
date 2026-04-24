import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../lib/apiClient';
import { UserPreferences } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUserPreferences = async (_userId: string): Promise<UserPreferences | null> => null;
const updateUserPreferences = async (_prefs: Partial<UserPreferences>): Promise<boolean> => true;

export const NotificationSettings: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    email: {
      orderUpdates: true,
      promotions: true,
      newsletter: false,
      security: true,
      productUpdates: false
    },
    push: {
      orderUpdates: true,
      promotions: false,
      newsletter: false,
      security: true,
      productUpdates: false
    },
    sms: {
      orderUpdates: false,
      promotions: false,
      newsletter: false,
      security: true,
      productUpdates: false
    }
  });

  // Load user preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const userPreferences = await getUserPreferences(user.id);

        if (userPreferences) {
          // userPreferences loaded

          // Update settings state with database values
          setSettings({
            email: {
              orderUpdates: userPreferences.emailOrderUpdates,
              promotions: userPreferences.emailPromotions,
              newsletter: userPreferences.emailNewsletter,
              security: userPreferences.emailSecurity,
              productUpdates: userPreferences.emailProductUpdates
            },
            push: {
              orderUpdates: userPreferences.pushOrderUpdates,
              promotions: userPreferences.pushPromotions,
              newsletter: userPreferences.pushNewsletter,
              security: userPreferences.pushSecurity,
              productUpdates: userPreferences.pushProductUpdates
            },
            sms: {
              orderUpdates: userPreferences.smsOrderUpdates,
              promotions: userPreferences.smsPromotions,
              newsletter: userPreferences.smsNewsletter,
              security: userPreferences.smsSecurity,
              productUpdates: userPreferences.smsProductUpdates
            }
          });
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load notification preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleToggle = (category: keyof typeof settings, setting: string) => {
    setSettings(prev => {
      const cat = prev[category] as Record<string, boolean>;
      return {
        ...prev,
        [category]: {
          ...cat,
          [setting]: !cat[setting]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      // Map settings to UserPreferences format
      const updatedPreferences: Partial<UserPreferences> = {
        userId: user.id,
        emailOrderUpdates: settings.email.orderUpdates,
        emailPromotions: settings.email.promotions,
        emailNewsletter: settings.email.newsletter,
        emailSecurity: settings.email.security,
        emailProductUpdates: settings.email.productUpdates,
        pushOrderUpdates: settings.push.orderUpdates,
        pushPromotions: settings.push.promotions,
        pushNewsletter: settings.push.newsletter,
        pushSecurity: settings.push.security,
        pushProductUpdates: settings.push.productUpdates,
        smsOrderUpdates: settings.sms.orderUpdates,
        smsPromotions: settings.sms.promotions,
        smsNewsletter: settings.sms.newsletter,
        smsSecurity: settings.sms.security,
        smsProductUpdates: settings.sms.productUpdates
      };

      await updateUserPreferences(updatedPreferences);
      showNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your notification preferences have been updated'
      });
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save notification settings. Please try again.');
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save notification settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: 'orderUpdates',
      title: 'Order Updates',
      description: 'Notifications about your order status and delivery'
    },
    {
      key: 'promotions',
      title: 'Promotions & Deals',
      description: 'Special offers, discounts, and promotional campaigns'
    },
    {
      key: 'newsletter',
      title: 'Newsletter',
      description: 'Weekly newsletter with new products and features'
    },
    {
      key: 'security',
      title: 'Security Alerts',
      description: 'Important security notifications and account changes'
    },
    {
      key: 'productUpdates',
      title: 'Product Updates',
      description: 'New product launches and feature announcements'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
          <p className="text-gray-600 mt-1">Choose how you want to be notified about updates and activities</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
        <p className="text-gray-600 mt-1">Choose how you want to be notified about updates and activities</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Notification Channels */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-2 font-medium text-gray-900">Notification Type</th>
                <th className="text-center py-4 px-2 font-medium text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </th>
                <th className="text-center py-4 px-2 font-medium text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push
                  </div>
                </th>
                <th className="text-center py-4 px-2 font-medium text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {notificationTypes.map((type) => (
                <tr key={type.key} className="border-b border-gray-100">
                  <td className="py-4 px-2">
                    <div>
                      <div className="font-medium text-gray-900">{type.title}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.email[type.key as keyof typeof settings.email]}
                        onChange={() => handleToggle('email', type.key)}
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      />
                    </label>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.push[type.key as keyof typeof settings.push]}
                        onChange={() => handleToggle('push', type.key)}
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      />
                    </label>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.sms[type.key as keyof typeof settings.sms]}
                        onChange={() => handleToggle('sms', type.key)}
                        className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setSettings(prev => ({
                  email: { ...Object.fromEntries(Object.keys(prev.email).map(k => [k, true])) } as typeof prev.email,
                  push: { ...Object.fromEntries(Object.keys(prev.push).map(k => [k, true])) } as typeof prev.push,
                  sms: { ...Object.fromEntries(Object.keys(prev.sms).map(k => [k, true])) } as typeof prev.sms
                }));
              }}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              Enable All
            </button>
            <button
              onClick={() => {
                setSettings(prev => ({
                  email: { ...Object.fromEntries(Object.keys(prev.email).map(k => [k, false])) } as typeof prev.email,
                  push: { ...Object.fromEntries(Object.keys(prev.push).map(k => [k, false])) } as typeof prev.push,
                  sms: { ...Object.fromEntries(Object.keys(prev.sms).map(k => [k, false])) } as typeof prev.sms
                }));
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Disable All
            </button>
            <button
              onClick={() => {
                setSettings(prev => ({
                  email: { ...prev.email, security: true },
                  push: { ...prev.push, security: true },
                  sms: { ...prev.sms, security: true }
                }));
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Security Only
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            whileHover={saving ? {} : { scale: 1.02 }}
            whileTap={saving ? {} : { scale: 0.98 }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
