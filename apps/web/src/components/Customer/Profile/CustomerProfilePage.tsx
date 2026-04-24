import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Save,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Package,
  Star
} from 'lucide-react';
import { CustomerDashboardLayout } from '../Layout/CustomerDashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({ orders: 0, reviews: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  const [originalData, setOriginalData] = useState(profileData);

  useEffect(() => {
    if (user) {
      const data = {
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || ''
      };
      setProfileData(data);
      setOriginalData(data);
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    const changed = JSON.stringify(profileData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [profileData, originalData]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const statsRes = await apiClient.get<any>('/api/user/stats');
      setStats({
        orders: statsRes.orders || statsRes.data?.orders || 0,
        reviews: statsRes.reviews || statsRes.data?.reviews || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone || undefined,
        dateOfBirth: profileData.dateOfBirth || undefined,
        gender: profileData.gender || undefined
      });

      setOriginalData(profileData);
      showSuccess('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showError('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
  };

  const handleAvatarButtonClick = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid file', 'Please select an image file');
      return;
    }

    try {
      setAvatarUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const res = await apiClient.post<any>('/api/dashboard/storage/upload', formData);
      if (!res || (!res.url && !res.data?.url)) {
        throw new Error('Upload failed: no URL returned');
      }

      const publicUrl = res.url || res.data?.url;

      await updateProfile({ avatar: publicUrl });
      showSuccess('Avatar updated', 'Your profile picture has been updated.');
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      showError('Error', error.message || 'Failed to update avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const getInitials = () => {
    if (profileData.fullName) {
      return profileData.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const getMembershipDuration = () => {
    if (user?.createdAt) {
      const created = new Date(user.createdAt);
      const now = new Date();
      const months = (now.getFullYear() - created.getFullYear()) * 12 + 
                     (now.getMonth() - created.getMonth());
      if (months < 1) return 'New';
      if (months < 12) return `${months}m`;
      return `${Math.floor(months / 12)}y`;
    }
    return 'New';
  };

  return (
    <CustomerDashboardLayout title="Profile" subtitle="Manage your personal information">
      <div className="max-w-3xl space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header with Avatar */}
          <div className="relative h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700">
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={profileData.fullName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{getInitials()}</span>
                    </div>
                  )}
                </div>
                  <button
                    type="button"
                    onClick={handleAvatarButtonClick}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="pt-16 pb-6 px-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profileData.fullName || 'Your Name'}
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {profileData.email}
                </p>
              </div>
              {user?.emailVerified ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unverified</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Package className="w-4 h-4 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                </div>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
                </div>
                <p className="text-sm text-gray-500">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{getMembershipDuration()}</p>
                <p className="text-sm text-gray-500">Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['male', 'female', 'other', 'prefer-not-to-say'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChange('gender', option)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                      profileData.gender === option
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {option === 'prefer-not-to-say' ? 'Prefer not to say' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
          <p className="text-sm text-gray-500 mb-6">Manage your account security settings</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-500">Security and account access</p>
                </div>
              </div>
              <button className="px-4 py-2 text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-colors">
                Manage
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Account Status</p>
                  <p className="text-sm text-gray-500">Your account is active and secure</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg">
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerProfilePage;
