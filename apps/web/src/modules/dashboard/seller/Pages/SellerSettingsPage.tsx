import React, { useState } from 'react';
import {
  Settings, Bell, Globe, CreditCard, Truck, Shield,
  ChevronRight, ToggleLeft, Check
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
    { id: 'new_order', label: 'New Order Alerts', description: 'Get notified when you receive a new order', enabled: true },
    { id: 'low_stock', label: 'Low Stock Alerts', description: 'Receive alerts when products are running low', enabled: true },
    { id: 'reviews', label: 'Review Notifications', description: 'Get notified about new customer reviews', enabled: false },
    { id: 'payouts', label: 'Payout Notifications', description: 'Receive alerts about earnings and payouts', enabled: true }
  ]);

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: '499',
    defaultShippingCost: '49',
    processingDays: '2'
  });

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const settingSections = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Manage your notification preferences'
    },
    {
      id: 'shipping',
      label: 'Shipping Settings',
      icon: Truck,
      description: 'Configure shipping options and costs'
    },
    {
      id: 'payments',
      label: 'Payment Settings',
      icon: CreditCard,
      description: 'Manage payment methods and payouts'
    },
    {
      id: 'store',
      label: 'Store Settings',
      icon: Globe,
      description: 'Customize your store appearance'
    }
  ];

  const [activeSection, setActiveSection] = useState('notifications');

  return (
    <SellerDashboardLayout title="Settings" subtitle="Configure your seller account">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Settings</h3>
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'notifications' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Notification Preferences</h2>
              <p className="text-white/60 mb-6">Choose how you want to be notified about important updates</p>
              
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div>
                      <h4 className="text-white font-medium">{notification.label}</h4>
                      <p className="text-white/50 text-sm">{notification.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(notification.id)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        notification.enabled ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          notification.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-white font-medium mb-4">Email Digest</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['Daily', 'Weekly', 'Monthly'].map((frequency) => (
                    <button
                      key={frequency}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {frequency}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'shipping' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Shipping Settings</h2>
              <p className="text-white/60 mb-6">Configure shipping options for your products</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="499"
                  />
                  <p className="text-white/40 text-xs mt-1">Orders above this amount get free shipping</p>
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Default Shipping Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={shippingSettings.defaultShippingCost}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, defaultShippingCost: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="49"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Order Processing Time (Days)
                  </label>
                  <select
                    value={shippingSettings.processingDays}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, processingDays: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="1">1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-white font-medium mb-4">Shipping Zones</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-white font-medium">All India</p>
                        <p className="text-white/50 text-sm">Standard delivery: 3-5 days</p>
                      </div>
                      <span className="text-cyan-400 font-medium">₹49</span>
                    </div>
                    <button className="w-full p-4 border border-dashed border-white/20 rounded-xl text-white/60 hover:bg-white/5 hover:border-white/30 transition-all">
                      + Add Shipping Zone
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Payment Settings</h2>
              <p className="text-white/60 mb-6">Manage your payment methods and payout preferences</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4">Payout Method</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Bank Account</p>
                          <p className="text-white/50 text-sm">XXXX XXXX 4523 • HDFC Bank</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-cyan-400 text-sm">
                        <Check className="w-4 h-4" /> Default
                      </span>
                    </div>
                    <button className="w-full p-4 border border-dashed border-white/20 rounded-xl text-white/60 hover:bg-white/5 hover:border-white/30 transition-all">
                      + Add Payment Method
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-white font-medium mb-4">Payout Schedule</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['Daily', 'Weekly', 'Monthly'].map((schedule, index) => (
                      <button
                        key={schedule}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${
                          index === 1
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {schedule}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/40 text-sm mt-2">Payouts are processed every Monday</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-white font-medium mb-4">Tax Information</h3>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">GST Number</p>
                        <p className="text-white/50 text-sm">27XXXXX1234X1Z5</p>
                      </div>
                      <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'store' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Store Settings</h2>
              <p className="text-white/60 mb-6">Customize your seller profile and store appearance</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Store Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Your Store Name"
                    defaultValue="Premium Attars"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Store Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    placeholder="Tell customers about your store..."
                    defaultValue="Authentic attars and Islamic lifestyle products from Aligarh Attar House. Pure quality, sourced from Aligarh artisans."
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Store Policies</label>
                  <div className="space-y-3">
                    {['Return Policy', 'Shipping Policy', 'Privacy Policy'].map((policy) => (
                      <div key={policy} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <span className="text-white">{policy}</span>
                        <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300">
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-white/10">
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerSettingsPage;
