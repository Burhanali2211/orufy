import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { User } from '@/types';

export const useCustomerProfile = () => {
  const { user, updateProfile: authUpdateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('User not authenticated');
      
      // We use the context's updateProfile to keep state in sync and handle auth.updateUser
      await authUpdateProfile(updates);
      return updates;
    },
    onSuccess: () => {
      // Refresh stats if profile changes might affect them
      queryClient.invalidateQueries({ queryKey: ['customer', 'stats', user?.id] });
      showSuccess('Success', 'Profile updated successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update profile');
    }
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Update the user profile with the new avatar URL
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
