import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { mapDbAddressToAppAddress } from '@/shared/utils/shoppingMapper';
import { Address } from '../../types';

export const useCustomerAddresses = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch addresses
  const query = useQuery({
    queryKey: ['customer', 'addresses', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const data = await apiClient.get('/addresses');

      
      return (data || []).map(mapDbAddressToAppAddress);
    },
    enabled: !!user,
  });

  // Create address
  const createMutation = useMutation({
    mutationFn: async (newAddress: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('User not authenticated');

      // Backend handles unsetting previous defaults atomically
      const data = await apiClient.post('/addresses', {
          user_id: user.id,
          full_name: newAddress.fullName,
          street_address: newAddress.streetAddress,
          city: newAddress.city,
          state: newAddress.state,
          postal_code: newAddress.postalCode,
          country: newAddress.country,
          phone: newAddress.phone,
          is_default: newAddress.isDefault,
          type: newAddress.type,
        });

      
      return mapDbAddressToAppAddress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', user?.id] });
      showSuccess('Success', 'Address added successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to add address');
    }
  });

  // Update address
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Address> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const dbData: any = {};
      if (updates.fullName) dbData.full_name = updates.fullName;
      if (updates.streetAddress) dbData.street_address = updates.streetAddress;
      if (updates.city) dbData.city = updates.city;
      if (updates.state) dbData.state = updates.state;
      if (updates.postalCode) dbData.postal_code = updates.postalCode;
      if (updates.country) dbData.country = updates.country;
      if (updates.phone) dbData.phone = updates.phone;
      if (updates.isDefault !== undefined) dbData.is_default = updates.isDefault;
      if (updates.type) dbData.type = updates.type;

      const data = await apiClient.put(`/addresses/${id}`, dbData);

      
      return mapDbAddressToAppAddress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', user?.id] });
      showSuccess('Success', 'Address updated successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update address');
    }
  });

  // Delete address
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/addresses/${id}`);
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', user?.id] });
      showSuccess('Success', 'Address deleted successfully');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to delete address');
    }
  });

  // Set as default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      // Backend handles unsetting previous defaults atomically
      await apiClient.put(`/addresses/${id}`, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', user?.id] });
      showSuccess('Success', 'Default address updated');
    },
    onError: (err: any) => {
      showError('Error', err.message || 'Failed to update default address');
    }
  });

  return {
    ...query,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
    setDefaultAddress: setDefaultMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || setDefaultMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
