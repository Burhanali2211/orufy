import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';

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

      

      type PaymentMethodDB = { id: string; type: 'card' | 'upi'; last_four?: string; card_brand?: string; expiry_month?: string; expiry_year?: string; cardholder_name?: string; upi_id?: string; is_default: boolean; };
      return ((data as PaymentMethodDB[]) || []).map(row => ({
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
    mutationFn: async (formData: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');

      // Backend handles unsetting previous defaults atomically
      await apiClient.post('/payment_methods', {
        user_id: user.id,
        ...formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments', user?.id] });
      showSuccess('Success', 'Payment method added');
    },
    onError: (err: Error) => {
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
    onError: (err: Error) => {
      showError('Error', err.message || 'Failed to remove payment method');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      // Backend handles unsetting previous defaults atomically
      await apiClient.put(`/payment_methods/${id}`, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-payments', user?.id] });
      showSuccess('Success', 'Default payment method updated');
    },
    onError: (err: Error) => {
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

