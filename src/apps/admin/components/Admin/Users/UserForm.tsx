import { apiClient } from '@/shared/lib/apiClient';
import React, { useState } from 'react';
import { Modal } from '@/shared/components/Common/Modal';
import { FormInput, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { Eye, EyeOff } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UserFormProps {
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().optional(),
  role: z.enum(['customer', 'admin']),
  is_active: z.boolean().default(true)
}).superRefine((data, ctx) => {
  if (data.password && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 6 characters",
      path: ["password"],
    });
  }
});

type FormValues = z.infer<typeof schema>;

export const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      password: '', // Never populate password
      role: (user?.role === 'admin' || user?.role === 'customer') ? user.role : 'customer',
      is_active: user?.is_active ?? true,
    }
  });

  const passwordValue = watch('password');

  const getPasswordStrength = (password: string | undefined): { strength: string; color: string } => {
    if (!password) return { strength: '', color: '' };
    if (password.length < 6) return { strength: 'Weak', color: 'text-red-600' };
    if (password.length < 10) return { strength: 'Medium', color: 'text-yellow-600' };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 'Strong', color: 'text-green-600' };
    }
    return { strength: 'Medium', color: 'text-yellow-600' };
  };

  const mutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      if (user) {
        return apiClient.put(`/profiles/${user.id}`, {
          full_name: payload.full_name,
          role: payload.role,
          is_active: payload.is_active,
          ...(payload.password ? { password: payload.password } : {})
        });
      }
      throw new Error('Add user is not available from the dashboard.');
    },
    onSuccess: () => {
      showSuccess('Success', 'User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSuccess();
    },
    onError: (error: Error) => {
      showError('Error', error.message || 'Failed to save user');
    }
  });

  const onSubmit = (data: FormValues) => {
    if (!user) {
      showError('New users must register via the storefront. Contact the system administrator to create accounts directly.');
      return;
    }
    mutation.mutate(data);
  };

  const passwordStrength = getPasswordStrength(passwordValue);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>

          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Full Name *"
                {...field}
                error={errors.full_name?.message ? String(errors.full_name.message) : undefined}
                placeholder="Enter full name"
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <FormInput
                label="Email *"
                type="email"
                {...field}
                error={errors.email?.message ? String(errors.email.message) : undefined}
                placeholder="user@example.com"
                disabled={!!user} // Email usually shouldn't be changed here easily, but keeping UI same
              />
            )}
          />

          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={user ? 'Password (leave blank to keep current)' : 'Password *'}
                  type={showPassword ? 'text' : 'password'}
                  {...field}
                  error={errors.password?.message ? String(errors.password.message) : undefined}
                  placeholder="Enter password"
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {passwordValue && (
              <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                Password strength: {passwordStrength.strength}
              </p>
            )}
          </div>
        </div>

        {/* Role & Status */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Role & Status</h3>

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormSelect
                label="Role *"
                {...field}
                error={errors.role?.message ? String(errors.role.message) : undefined}
                options={[
                  { value: 'customer', label: 'Customer' },
                  { value: 'admin', label: 'Admin' }
                ]}
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Active"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        {/* Form Actions - Sticky on mobile */}
        <div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 pb-4 sm:pb-0 px-4 sm:px-0 -mx-4 sm:mx-0 border-t border-gray-200 bg-white sm:bg-transparent">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-11 sm:min-h-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-11 sm:min-h-auto"
          >
            {mutation.isPending ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
