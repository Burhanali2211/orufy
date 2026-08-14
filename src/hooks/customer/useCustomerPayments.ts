import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  lastFour?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  upiId?: string;
  isDefault: boolean;
}

export const useCustomerPayments = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading, error } = useQuery({
    queryKey: ['customer-payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await apiClient.get('/payment_methods');

      

      return (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        lastFour: row.last_four,
        cardBrand: row.card_brand,
        expiryMonth: row.expiry_month ? parseInt(row.expiry_month) : undefined,
        expiryYear: row.expiry_year ? parseInt(row.expiry_year) : undefined,
        cardholderName: row.cardholder_name,
        upiId: row.upi_id,
        isDefault: row.is_default
      })) as PaymentMethod[];
    },
    enabled: !!user
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error('Not authenticated');

      if (formData.isDefault) {
        // Unset previous defaults
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      await apiClient.post('/payment_methods', {
          user_id: user.id,
          ...formData
        });

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments', user?.id] });
      showSuccess('Success', 'Payment method added');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to add payment method');
    }
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payment_methods/${id}`);

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments', user?.id] });
      showSuccess('Success', 'Payment method removed');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to remove payment method');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      // Unset previous defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);

      // Set new default
      await apiClient.put(`/payment_methods/${id}`, { is_default: true });

      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments', user?.id] });
      showSuccess('Success', 'Default payment method updated');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update default payment method');
    }
  });

  return {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod: addPaymentMethodMutation.mutateAsync,
    isAdding: addPaymentMethodMutation.isPending,
    deletePaymentMethod: deletePaymentMethodMutation.mutateAsync,
    isDeleting: deletePaymentMethodMutation.isPending,
    setDefault: setDefaultMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending
  };
};
