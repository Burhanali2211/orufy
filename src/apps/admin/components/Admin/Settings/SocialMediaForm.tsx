import { apiClient } from '@/shared/lib/apiClient';
import React, { useEffect } from 'react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/Common/Modal';
import { FormInput, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';
import { RefreshCw } from 'lucide-react';

interface SocialMediaAccount {
  id?: string;
  platform: string;
  platform_name: string;
  url: string;
  username: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  follower_count: number;
  description: string;
}

interface SocialMediaFormProps {
  account: SocialMediaAccount | null;
  onClose: () => void;
}

const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { value: 'twitter', label: 'Twitter', icon: 'Twitter' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'pinterest', label: 'Pinterest', icon: 'Pin' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'telegram', label: 'Telegram', icon: 'Send' },
  { value: 'snapchat', label: 'Snapchat', icon: 'Camera' },
];

const schema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Must be a valid URL'),
  username: z.string().optional(),
  follower_count: z.coerce.number().min(0).default(0),
  display_order: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export const SocialMediaForm: React.FC<SocialMediaFormProps> = ({ account, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      platform: '',
      url: '',
      username: '',
      follower_count: 0,
      display_order: 0,
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (account) {
      reset({
        platform: account.platform,
        url: account.url,
        username: account.username || '',
        follower_count: account.follower_count || 0,
        display_order: account.display_order || 0,
        description: account.description || '',
        is_active: account.is_active,
      });
    }
  }, [account, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      account?.id
        ? apiClient.put(`/admin/settings/social/${account.id}`, payload)
        : apiClient.post('/admin/settings/social', payload),
    onSuccess: () => {
      showSuccess(
        account?.id ? 'Social Media Account Updated' : 'Social Media Account Created',
        account?.id ? 'Social media account updated successfully' : 'Social media account created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-social-settings'] });
      onClose();
    },
    onError: (error: Error) => {
      showError('Error Saving Account', error.message || 'Failed to save social media account');
    },
  });

  const onSubmit = (data: FormValues) => {
    const selected = platformOptions.find(p => p.value === data.platform);
    if (!selected) return;

    const payload = {
      ...data,
      platform_name: selected.label,
      icon_name: selected.icon,
    };
    saveMutation.mutate(payload);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={account?.id ? 'Edit Social Media Account' : 'Add Social Media Account'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="platform"
          control={control}
          render={({ field }) => (
            <FormSelect
              label="Platform"
              {...field}
              error={errors.platform?.message ? String(errors.platform.message) : undefined}
              options={[
                { value: '', label: 'Select a platform' },
                ...platformOptions.map(opt => ({ value: opt.value, label: opt.label }))
              ]}
            />
          )}
        />

        <Controller
          name="url"
          control={control}
          render={({ field }) => (
            <FormInput
              type="url"
              label="Profile URL"
              placeholder="https://facebook.com/yourpage"
              {...field}
              error={errors.url?.message ? String(errors.url.message) : undefined}
            />
          )}
        />

        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <FormInput
              label="Username"
              placeholder="@yourhandle"
              {...field}
              error={errors.username?.message ? String(errors.username.message) : undefined}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="follower_count"
            control={control}
            render={({ field }) => (
              <FormInput
                type="number"
                label="Follower Count"
                {...field}
                onChange={e => field.onChange(Number(e.target.value))}
                error={errors.follower_count?.message ? String(errors.follower_count.message) : undefined}
              />
            )}
          />

          <Controller
            name="display_order"
            control={control}
            render={({ field }) => (
              <div>
                <FormInput
                  type="number"
                  label="Display Order"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                  error={errors.display_order?.message ? String(errors.display_order.message) : undefined}
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
            )}
          />
        </div>

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...field}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Optional description"
              />
            </div>
          )}
        />

        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <FormCheckbox
              label="Active (visible on website)"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : null}
            {account?.id ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

