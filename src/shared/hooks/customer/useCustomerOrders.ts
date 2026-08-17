import { apiClient } from '@/shared/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/shared/contexts/AuthContext';
import { mapDbOrderToAppOrder } from '@/shared/utils/shoppingMapper';

export const useCustomerOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', 'orders', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const res = await apiClient.get('/customer/orders');
      const ordersList = Array.isArray(res) ? res : res?.orders || [];
      return ordersList.map(mapDbOrderToAppOrder);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
