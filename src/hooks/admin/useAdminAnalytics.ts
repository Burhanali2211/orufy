import { useQuery } from '@tanstack/react-query';

import { AnalyticsData } from '@/pages/admin/components/Analytics/types';

export const useAdminAnalytics = (period: '7days' | '30days' | '90days' | 'year' = '30days') => {
  const days = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365;

  return useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics', {
        p_days: days
      });

      

      // Transform raw RPC data to match AnalyticsData interface
      // Note: Page views and conversion rate are currently mocked in the component,
      // focusing on revenue, orders, avgOrderValue, and newUsers from the DB.
      const metrics = {
        totalRevenue: { value: data.metrics.totalRevenue, change: 0, trend: 'neutral' as const },
        totalOrders: { value: data.metrics.totalOrders, change: 0, trend: 'neutral' as const },
        pageViews: { value: 0, change: 0, trend: 'neutral' as const },
        conversionRate: { value: 0, change: 0, trend: 'neutral' as const },
        avgOrderValue: { value: data.metrics.avgOrderValue, change: 0, trend: 'neutral' as const },
        newUsers: { value: data.metrics.newUsers, change: 0, trend: 'neutral' as const }
      };

      return {
        metrics,
        topProducts: data.topProducts,
        revenueTrend: data.revenueTrend,
        trafficSources: [] // Currently not returned by RPC
      };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes cache
  });
};
