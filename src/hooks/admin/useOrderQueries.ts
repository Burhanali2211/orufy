import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

import { Order, OrderStats } from '@/pages/admin/components/Orders/types';

export const useOrdersQuery = (page: number, pageSize: number, filters: { status?: string; paymentStatus?: string; searchTerm?: string }) => {
  return useQuery({
    queryKey: ['admin-orders', page, pageSize, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
      if (filters.searchTerm) query = query.ilike('order_number', `%${filters.searchTerm}%`);

      const { data, error, count } = await query.range(from, to);
      

      const ordersRaw = data || [];
      const userIds = [...new Set(ordersRaw.map((o) => o.user_id).filter(Boolean))];
      const profileMap: Record<string, { full_name?: string; email?: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await apiClient.get('/profiles');
        (profiles || []).forEach((p) => { profileMap[p.id] = p; });
      }

      const mappedOrders = ordersRaw.map((o) => ({
        ...o,
        customer_name: profileMap[o.user_id]?.full_name || 'Guest',
        customer_email: profileMap[o.user_id]?.email || '',
      }));

      const totalItems = count ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

      return {
        orders: mappedOrders,
        totalItems,
        totalPages,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useOrderStatsQuery = () => {
  return useQuery<OrderStats>({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        { count: totalOrders },
        { count: pendingOrders },
        { count: ordersToday },
        { data: revenueRows },
        { data: todayRevenueRows },
        { data: paidRows },
        { data: statusRows },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('total_amount').in('status', ['delivered', 'shipped']),
        supabase.from('orders').select('total_amount').in('status', ['delivered', 'shipped']).gte('created_at', todayStart.toISOString()),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('orders').select('status'),
      ]);

      const totalRevenue = (revenueRows || []).reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);
      const revenueToday = (todayRevenueRows || []).reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);
      const paidTotal = (paidRows || []).reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);
      const avgOrderValue = paidRows && paidRows.length > 0 ? paidTotal / paidRows.length : 0;

      const statusBreakdown: Record<string, number> = {};
      (statusRows || []).forEach((o) => {
        statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
      });

      return {
        totalOrders: totalOrders ?? 0,
        totalRevenue,
        pendingOrders: pendingOrders ?? 0,
        ordersToday: ordersToday ?? 0,
        revenueToday,
        avgOrderValue,
        statusBreakdown
      };
    },
    staleTime: 1000 * 60 * 10,
  });
};
