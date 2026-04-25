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
      <div className="grid lg:grid-cols-4 gap-8 pb-12">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-xl shadow-slate-200/40">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-4">Account Settings</h3>
            <nav className="space-y-2">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all group ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`} />
                  <span className="font-bold text-sm">{section.label}</span>
                </button>
              ))}
            </nav>
            
            <div className="mt-8 pt-8 border-t border-slate-50 px-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
                <p className="text-slate-900 font-bold text-sm">Professional Seller</p>
                <button className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mt-2 hover:text-blue-700 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Notification Preferences</h2>
                <p className="text-slate-500 font-medium">Choose how you want to be notified about important updates</p>
              </div>
              
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                  >
                    <div>
                      <h4 className="text-slate-900 font-bold text-lg mb-1">{notification.label}</h4>
                      <p className="text-slate-500 text-sm font-medium">{notification.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(notification.id)}
                      className={`w-14 h-8 rounded-full transition-all relative ${
                        notification.enabled ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform absolute top-1 ${
                          notification.enabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100">
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">Email Digest Frequency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Daily', 'Weekly', 'Monthly'].map((frequency) => (
                    <button
                      key={frequency}
                      className={`px-6 py-4 border rounded-2xl font-bold transition-all ${
                        frequency === 'Weekly' 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {frequency}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'shipping' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Shipping Settings</h2>
                <p className="text-slate-500 font-medium">Configure shipping options for your products</p>
              </div>
              
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-slate-500 text-xs font-black uppercase tracking-widest mb-3">
                      Free Shipping Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="499"
                    />
                    <p className="text-slate-400 text-xs mt-2 font-medium">Orders above this amount get free shipping</p>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-black uppercase tracking-widest mb-3">
                      Default Shipping Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={shippingSettings.defaultShippingCost}
                      onChange={(e) => setShippingSettings(prev => ({ ...prev, defaultShippingCost: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="49"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-black uppercase tracking-widest mb-3">
                    Order Processing Time
                  </label>
                  <select
                    value={shippingSettings.processingDays}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, processingDays: e.target.value }))}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none"
                  >
                    <option value="1">1 Business Day</option>
                    <option value="2">2 Business Days</option>
                    <option value="3">3 Business Days</option>
                    <option value="5">5 Business Days</option>
                    <option value="7">7 Business Days</option>
                  </select>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest">Shipping Zones</h3>
                    <button className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors">
                      Manage All Zones
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                          <Globe className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold">All India (Standard)</p>
                          <p className="text-slate-500 text-sm font-medium">Standard delivery: 3-5 days</p>
                        </div>
                      </div>
                      <span className="text-slate-900 font-black text-lg">₹49</span>
                    </div>
                    <button className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group">
                      <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
                      Add New Shipping Zone
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-12 pt-8 border-t border-slate-100">
                <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Settings</h2>
                <p className="text-slate-500 font-medium">Manage your payment methods and payout preferences</p>
              </div>
              
              <div className="space-y-10">
                <div>
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">Payout Method</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-blue-50 border border-blue-200 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                          <CreditCard className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold text-lg leading-none mb-2">Bank Account</p>
                          <p className="text-blue-600/60 text-sm font-bold tracking-widest">XXXX XXXX 4523 • HDFC BANK</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Default
                      </div>
                    </div>
                    <button className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group">
                      + Add Payout Method
                    </button>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">Payout Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['Daily', 'Weekly', 'Monthly'].map((schedule, index) => (
                      <button
                        key={schedule}
                        className={`px-6 py-4 rounded-2xl font-bold transition-all border ${
                          index === 1
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {schedule}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4 ml-1 flex items-center gap-2">
                    <Bell className="w-3 h-3" />
                    Next Payout: Monday, May 15
                  </p>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">Tax Information</h3>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Registered GST Number</p>
                      <p className="text-slate-900 font-black text-xl tracking-wider">27XXXXX1234X1Z5</p>
                    </div>
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm">
                      Update GST
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'store' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/40 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Store Settings</h2>
                <p className="text-slate-500 font-medium">Customize your seller profile and store appearance</p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Store Display Name</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="Your Store Name"
                    defaultValue="Premium Attars"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Public Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none leading-relaxed"
                    placeholder="Tell customers about your store..."
                    defaultValue="Authentic attars and Islamic lifestyle products from Aligarh Attar House. Pure quality, sourced from Aligarh artisans."
                  />
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-6">Store Policies</h3>
                  <div className="grid gap-4">
                    {['Return Policy', 'Shipping Policy', 'Privacy Policy'].map((policy) => (
                      <div key={policy} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                        <span className="text-slate-900 font-bold">{policy}</span>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                          Edit Content
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-12 pt-8 border-t border-slate-100">
                <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                  Publish Updates
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
