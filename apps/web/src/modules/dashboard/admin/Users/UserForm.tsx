import React, { useState, useEffect } from 'react';
import { Modal } from '../../Common/Modal';
import { FormInput, FormSelect, FormCheckbox } from '../../Common/FormInput';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    password: '',
    role: 'customer',
    is_active: true
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '', // Never populate password for security
        role: user.role || 'customer',
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 6) return { strength: 'Weak', color: 'text-red-600' };
    if (password.length < 10) return { strength: 'Medium', color: 'text-yellow-600' };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 'Strong', color: 'text-green-600' };
    }
    return { strength: 'Medium', color: 'text-yellow-600' };
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password is required only for new users
    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      }

      if (user) {
        const res = await apiClient.patch<{ success: boolean; error?: string }>(`/dashboard/users/${user.id}`, {
          full_name: payload.full_name,
          role: payload.role,
          is_active: payload.is_active
        });

        if (!res.success || res.error) {
          throw new Error(res.error || 'Failed to update user');
        }

        showSuccess('Success', 'User updated successfully');
        onSuccess();
      } else {
        showError('Add user is not available from the dashboard. New users can sign up via the website, or create users in Supabase Dashboard → Authentication.');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>

          <FormInput
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            error={errors.full_name || ''}
            required
            placeholder="Enter full name"
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email || ''}
            required
            placeholder="user@example.com"
          />

          <div className="relative">
            <FormInput
              label={user ? 'Password (leave blank to keep current)' : 'Password'}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={errors.password || ''}
              required={!user}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {formData.password && (
              <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                Password strength: {passwordStrength.strength}
              </p>
            )}
          </div>
        </div>

        {/* Role & Status */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Role & Status</h3>

          <FormSelect
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            error={errors.role || ''}
            required
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'seller', label: 'Seller' },
              { value: 'admin', label: 'Admin' }
            ]}
          />

          <FormCheckbox
            label="Active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
        </div>

        {/* Form Actions - Sticky on mobile */}
        <div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 pb-4 sm:pb-0 px-4 sm:px-0 -mx-4 sm:mx-0 border-t border-gray-200 bg-white sm:bg-transparent">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] sm:min-h-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-auto"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
            <span>{user ? 'Update User' : 'Create User'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};