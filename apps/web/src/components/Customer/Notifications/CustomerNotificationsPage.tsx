import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  Package,
  Tag,
  Newspaper,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { CustomerDashboardLayout } from '../Layout/CustomerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  newsletter: boolean;
  productUpdates: boolean;
  priceAlerts: boolean;
}

export const CustomerNotificationsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    newsletter: true,
    productUpdates: true,
    priceAlerts: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState(preferences);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPrefs);
    setHasChanges(changed);
  }, [preferences, originalPrefs]);

  const fetchPreferences = async () => {
    try {
      const response = await apiClient.get<{ data: any }>('/user/notification-preferences');
      if (response.data) {
        setPreferences(response.data);
        setOriginalPrefs(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/user/notification-preferences', preferences);
      setOriginalPrefs(preferences);
      showSuccess('Success', 'Notification preferences saved successfully');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      showError('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <CustomerDashboardLayout title="Notifications" subtitle="Manage your notification preferences">
        <div className="max-w-2xl space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="Notifications" subtitle="Manage your notification preferences">
      <div className="max-w-2xl space-y-6">
        {/* Notification Channels */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <Toggle
                checked={preferences.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive text messages for updates</p>
                </div>
              </div>
              <Toggle
                checked={preferences.smsNotifications}
                onChange={() => handleToggle('smsNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive in-browser notifications</p>
                </div>
              </div>
              <Toggle
                checked={preferences.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Updates</p>
                  <p className="text-sm text-gray-500">Shipping, delivery, and order status</p>
                </div>
              </div>
              <Toggle
                checked={preferences.orderUpdates}
                onChange={() => handleToggle('orderUpdates')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Promotional Emails</p>
                  <p className="text-sm text-gray-500">Special offers and discounts</p>
                </div>
              </div>
              <Toggle
                checked={preferences.promotionalEmails}
                onChange={() => handleToggle('promotionalEmails')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Newsletter</p>
                  <p className="text-sm text-gray-500">Weekly updates and tips</p>
                </div>
              </div>
              <Toggle
                checked={preferences.newsletter}
                onChange={() => handleToggle('newsletter')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Product Updates</p>
                  <p className="text-sm text-gray-500">New arrivals and restocks</p>
                </div>
              </div>
              <Toggle
                checked={preferences.productUpdates}
                onChange={() => handleToggle('productUpdates')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Price Alerts</p>
                  <p className="text-sm text-gray-500">Get notified when wishlist items go on sale</p>
                </div>
              </div>
              <Toggle
                checked={preferences.priceAlerts}
                onChange={() => handleToggle('priceAlerts')}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerNotificationsPage;
