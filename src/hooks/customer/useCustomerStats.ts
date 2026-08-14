import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';

export const useCustomerStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', 'stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const [ordersRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      return {
        orders: ordersRes.count || 0,
        reviews: reviewsRes.count || 0
      };
    },
    enabled: !!user,
  });
};
