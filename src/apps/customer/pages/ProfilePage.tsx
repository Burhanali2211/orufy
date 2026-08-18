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
  Bell,
  RefreshCw,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useCustomerProfile } from '@/shared/hooks/customer/useCustomerProfile';
import { apiClient } from '@/shared/lib/apiClient';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const {
    updateProfile,
    isUpdating: loading,
    uploadAvatar,
    isUploadingAvatar: avatarUploading
  } = useCustomerProfile();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_notification_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      orderUpdates: true,
      emailReceipts: true,
      promotions: false
    };
  });

  const handleTogglePref = (key: 'orderUpdates' | 'emailReceipts' | 'promotions', val: boolean) => {
    const updated = { ...notificationPrefs, [key]: val };
    setNotificationPrefs(updated);
    try {
      localStorage.setItem('customer_notification_prefs', JSON.stringify(updated));
    } catch {}
  };

  const [originalData, setOriginalData] = useState(profileData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      const data = {
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? (typeof user.dateOfBirth === 'string' ? user.dateOfBirth.split('T')[0] : '') : '',
        gender: user.gender || ''
      };
      setProfileData(data);
      setOriginalData(data);
    }
  }, [user]);

  useEffect(() => {
    const changed = JSON.stringify(profileData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [profileData, originalData]);

  const handleChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone || undefined,
        dateOfBirth: profileData.dateOfBirth || undefined,
        gender: profileData.gender || undefined
      });
      setOriginalData(profileData);
    } catch (err: any) {
      showError('Update failed', err?.message || 'Could not update profile');
    }
  };

  const handleAvatarButtonClick = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid file', 'Please select an image file (JPG, PNG, WebP)');
      return;
    }

    try {
      await uploadAvatar(file);
    } catch (err: any) {
      showError('Upload failed', err?.message || 'Could not upload avatar');
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Mismatch', 'New password and confirm password do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showError('Too short', 'New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showSuccess('Password Changed', 'Your security credentials have been updated.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showError('Change Failed', err?.message || 'Could not change password. Please verify current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (user?.fullName || user?.name) {
      const name = user.fullName || user.name || '';
      return name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const userAvatar = user?.avatar || (user as any)?.avatar_url || (user as any)?.avatarUrl;

  return (
    <CustomerDashboardLayout title="Profile & Settings" subtitle="Manage your personal details and security">
      <div className="space-y-6 max-w-3xl">
        {/* ── Avatar / Account Identity Card ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden border border-stone-200">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarButtonClick}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-stone-900 shadow-xs transition-colors cursor-pointer"
                title="Upload Photo"
              >
                {avatarUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-900">{profileData.fullName || 'Customer'}</h3>
              <p className="text-xs text-stone-500">{profileData.email}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle className="w-3 h-3" /> Verified Customer Account
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleAvatarButtonClick}
              disabled={avatarUploading}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-stone-600" />
              <span>Change Photo</span>
            </button>
          </div>
        </div>

        {/* ── Personal Info Form ── */}
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Personal Information</h3>
            <p className="text-xs text-stone-500 mt-0.5">Your official account details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={profileData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full px-3.5 py-2 bg-stone-100/80 border border-stone-200 rounded-xl text-xs font-medium text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Gender</label>
              <select
                value={profileData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Details</span>
            </button>
          </div>
        </form>

        {/* ── Security / Password Update Form ── */}
        <form onSubmit={handleChangePassword} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-700" />
              <span>Account Password</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Update your password to keep your account secure</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={changingPassword || !passwordData.newPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {/* ── Notification Preferences ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-stone-700" />
              <span>Notification Preferences</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Control order status alerts and digital invoices</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-stone-900">Order & Shipping Alerts</p>
                <p className="text-[11px] text-stone-500">Receive live tracking updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.orderUpdates}
                onChange={(e) => handleTogglePref('orderUpdates', e.target.checked)}
                className="w-4 h-4 accent-stone-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-stone-900">Digital Invoices & Receipts</p>
                <p className="text-[11px] text-stone-500">Send PDF receipts automatically upon completed transactions</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.emailReceipts}
                onChange={(e) => handleTogglePref('emailReceipts', e.target.checked)}
                className="w-4 h-4 accent-stone-900"
              />
            </label>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default ProfilePage;
