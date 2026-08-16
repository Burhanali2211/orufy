import { apiClient } from '@/shared/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNotification } from '@/shared/contexts/NotificationContext';

export const useCustomerStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', 'stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const data = await apiClient.get('/customer/stats');
      return {
        orders: data?.orderCount || 0,
        reviews: data?.reviewCount || 0,
      };
    },
    enabled: !!user,
  });
};
