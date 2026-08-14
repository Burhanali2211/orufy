import React, { useState } from 'react';
import {
  Settings, Bell, Globe, CreditCard, Truck, Shield,
  ChevronRight, Check
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const SellerSettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<SettingToggle[]>([
    { id: 'new_order', label: 'New Order Alerts', description: 'Get notified when you receive a customer order', enabled: true },
    { id: 'low_stock', label: 'Low Stock Alerts', description: 'Receive alerts when product shelves are running low', enabled: true },
    { id: 'reviews', label: 'Review Notifications', description: 'Get notified about new customer ratings', enabled: true },
    { id: 'payouts', label: 'Payout Notifications', description: 'Receive alerts when Razorpay settlements clear', enabled: true }
  ]);

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: '499',
    defaultShippingCost: '0',
    processingDays: '1'
  });

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const settingSections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'payments', label: 'Payouts & Banking', icon: CreditCard },
    { id: 'store', label: 'Store Identity', icon: Globe }
  ];

  const [activeSection, setActiveSection] = useState('notifications');

  return (
    <SellerDashboardLayout title="Settings" subtitle="Configure your merchant account">
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3 space-y-1">
            {settingSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSection === section.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-8">
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Notification Preferences</h2>
                <p className="text-xs text-stone-500">Configure how and when you receive order & settlement alerts</p>
              </div>

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{notification.label}</h4>
                      <p className="text-[11px] text-stone-500">{notification.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification(notification.id)}
                      className={`w-11 h-6 rounded-full transition-all relative ${notification.enabled ? 'bg-stone-900' : 'bg-stone-200'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-2xs transition-transform absolute top-1 ${notification.enabled ? 'left-6' : 'left-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'shipping' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Shipping & Delivery</h2>
                <p className="text-xs text-stone-500">Set default shipping costs and processing speeds</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Order Processing Time
                  </label>
                  <select
                    value={shippingSettings.processingDays}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, processingDays: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="1">Same Day / 1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Payouts & Settlement</h2>
                <p className="text-xs text-stone-500">Razorpay Route automated merchant bank payouts</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-emerald-950">Razorpay Linked Bank Account</p>
                    <p className="text-[11px] text-emerald-700">Daily automated settlement enabled</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          )}

          {activeSection === 'store' && (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-6 space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Store Identity</h2>
                <p className="text-xs text-stone-500">Manage store display details and legal policies</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Store Name</label>
                  <input
                    type="text"
                    defaultValue="YourCommerce"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Store Description</label>
                  <textarea
                    rows={3}
                    defaultValue="Handcrafted authentic pure attars and artisanal fragrances."
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerSettingsPage;
