import { apiClient } from '@/shared/lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { User } from '../../types';

export const useCustomerProfile = () => {
  const { user, updateProfile: authUpdateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('User not authenticated');
      await authUpdateProfile(updates);
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'stats', user?.id] });
      showSuccess('Success', 'Profile updated successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update profile');
    }
  });

  // Upload avatar mutation — sends as multipart form to backend
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      const formData = new FormData();
      formData.append('avatar', file);

      const result = await apiClient.upload('/profiles/avatar', formData);
      const publicUrl = result?.url || result?.publicUrl;

      await authUpdateProfile({ avatar: publicUrl });
      return publicUrl;
    },
    onSuccess: () => {
      showSuccess('Avatar updated', 'Your profile picture has been updated.');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update avatar');
    }
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
};
