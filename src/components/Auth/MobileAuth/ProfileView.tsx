import React from 'react';
import { Heart, ShoppingCart, Bell, Settings, Gift, LogOut } from 'lucide-react';

interface User {
  name?: string;
  email: string;
  role: string;
}

interface ProfileViewProps {
  user: User;
  logout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, logout }) => {
  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">{(user.name || 'U').charAt(0)}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h3>
        <p className="text-gray-600">{user.email}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full capitalize">
          {user.role}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Heart className="h-6 w-6 text-red-500 mb-2" />
          <span className="text-xs text-gray-700">Wishlist</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShoppingCart className="h-6 w-6 text-green-500 mb-2" />
          <span className="text-xs text-gray-700">Cart</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Bell className="h-6 w-6 text-blue-500 mb-2" />
          <span className="text-xs text-gray-700">Notifications</span>
        </button>
      </div>

      {/* Account Options */}
      <div className="space-y-3">
        <button className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Settings className="h-5 w-5 text-gray-500 mr-3" />
          <span className="text-gray-700">Account Settings</span>
        </button>
        <button className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <Gift className="h-5 w-5 text-gray-500 mr-3" />
          <span className="text-gray-700">My Orders</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-red-600"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
