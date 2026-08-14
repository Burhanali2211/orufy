export interface AnalyticsMetrics {
  totalRevenue: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  totalOrders: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  pageViews: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  conversionRate: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  avgOrderValue: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  newUsers: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  growth: number;
  price?: string;
  images?: string[];
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  topProducts: TopProduct[];
  revenueTrend: RevenueTrend[];
  trafficSources: TrafficSource[];
}
