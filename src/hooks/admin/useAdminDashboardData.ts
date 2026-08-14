import { useQuery } from '@tanstack/react-query';


export interface DashboardMetrics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
}

export interface TopProduct {
  id: string;
  name: string;
  price: string;
  images: string[];
  stock: number;
  total_sold: string;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
  customer_name: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock_level: number;
  images: string[];
}

export interface DashboardData {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
}

export const useAdminDashboardData = () => {
  return useQuery<DashboardData>({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_summary');
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
};
