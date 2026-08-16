import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  newsletter: boolean;
  productUpdates: boolean;
  priceAlerts: boolean;
}

export const useCustomerNotifications = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['customer-notifications', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await apiClient.get('/notification_preferences');

      if (!data) return {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        orderUpdates: true,
        promotionalEmails: false,
        newsletter: true,
        productUpdates: true,
        priceAlerts: false
      };

      return {
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        pushNotifications: data.push_notifications,
        orderUpdates: data.order_updates,
        promotionalEmails: data.promotional_emails,
        newsletter: data.newsletter,
        productUpdates: data.product_updates,
        priceAlerts: data.price_alerts
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: NotificationPreferences) => {
      if (!user) throw new Error('Not authenticated');

      const dbData = {
        user_id: user.id,
        email_notifications: newPrefs.emailNotifications,
        sms_notifications: newPrefs.smsNotifications,
        push_notifications: newPrefs.pushNotifications,
        order_updates: newPrefs.orderUpdates,
        promotional_emails: newPrefs.promotionalEmails,
        newsletter: newPrefs.newsletter,
        product_updates: newPrefs.productUpdates,
        price_alerts: newPrefs.priceAlerts,
        updated_at: new Date().toISOString()
      };

      await apiClient.post('/notification_preferences', dbData);

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications', user?.id] });
      showSuccess('Success', 'Notification preferences saved successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to save notification preferences');
    }
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending
  };
};
