import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart,
  Eye, Users, ArrowUpRight, ArrowDownRight, Download, Loader2, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface AnalyticsMetrics {
  totalRevenue: { value: number; change: number; trend: 'up' | 'down' };
  totalOrders: { value: number; change: number; trend: 'up' | 'down' };
  pageViews: { value: number; change: number; trend: 'up' | 'down' };
  conversionRate: { value: number; change: number; trend: 'up' | 'down' };
  avgOrderValue: { value: number; change: number; trend: 'up' | 'down' };
  newUsers: { value: number; change: number; trend: 'up' | 'down' };
}

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  growth: number;
  price?: string;
  images?: string[];
}

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

interface AnalyticsData {
  metrics: AnalyticsMetrics;
  topProducts: TopProduct[];
  revenueTrend: RevenueTrend[];
  trafficSources: TrafficSource[];
}

export const AdminAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'year'>('30days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { showError } = useNotification();

  useEffect(() => { fetchAnalytics(); }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : selectedPeriod === '90days' ? 90 : 365;
      
      const response = await apiClient.get<{ success: boolean; data: AnalyticsData; error?: string }>(
        `/dashboard/analytics/summary?days=${days}`
      );

      if (response.error || !response.success) {
        throw new Error(response.error || 'Failed to fetch analytics');
      }

      setData(response.data);
    } catch (error: any) {
      showError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtNum = (num: number) => num.toLocaleString('en-IN');
  const fmtPct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const fmtMetric = (label: string, value: number) => {
    if (label === 'Total Revenue' || label === 'Avg Order Value') return fmt(value);
    if (label === 'Conversion Rate') return `${value.toFixed(2)}%`;
    return fmtNum(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const chartData = (data?.revenueTrend || []).map((point) => {
    const date = new Date(point.date);
    const label = selectedPeriod === 'year'
      ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return { date: label, revenue: Math.round(point.revenue), orders: point.orders, formattedRevenue: fmt(point.revenue) };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-semibold text-gray-800 mb-1">{payload[0].payload.date}</p>
          <p className="text-amber-600">Revenue: {payload[0].payload.formattedRevenue}</p>
          <p className="text-blue-600">Orders: {payload[0].payload.orders}</p>
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    if (!data) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Revenue', fmt(data.metrics.totalRevenue.value)],
      ['Total Orders', String(data.metrics.totalOrders.value)],
      ['Avg Order Value', fmt(data.metrics.avgOrderValue.value)],
      ['New Users', String(data.metrics.newUsers.value)],
      [],
      ['Top Products', 'Revenue', 'Orders'],
      ...data.topProducts.map(p => [p.name, fmt(p.revenue), String(p.orders)])
    ];
    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const metricsConfig = data ? [
    { label: 'Total Revenue', value: data.metrics.totalRevenue.value, change: data.metrics.totalRevenue.change, trend: data.metrics.totalRevenue.trend, icon: DollarSign, bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-800' },
    { label: 'Total Orders', value: data.metrics.totalOrders.value, change: data.metrics.totalOrders.change, trend: data.metrics.totalOrders.trend, icon: ShoppingCart, bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-800' },
    { label: 'Page Views', value: data.metrics.pageViews.value, change: data.metrics.pageViews.change, trend: data.metrics.pageViews.trend, icon: Eye, bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-800' },
    { label: 'Conversion Rate', value: data.metrics.conversionRate.value, change: data.metrics.conversionRate.change, trend: data.metrics.conversionRate.trend, icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-800' },
    { label: 'Avg Order Value', value: data.metrics.avgOrderValue.value, change: data.metrics.avgOrderValue.change, trend: data.metrics.avgOrderValue.trend, icon: BarChart3, bg: 'bg-cyan-50', border: 'border-cyan-100', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', valueColor: 'text-cyan-800' },
    { label: 'New Users', value: data.metrics.newUsers.value, change: data.metrics.newUsers.change, trend: data.metrics.newUsers.trend, icon: Users, bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', valueColor: 'text-indigo-800' },
  ] : [];

  if (loading) {
    return (
      <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading analytics data...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!data) {
    return (
      <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">No analytics data available</p>
            <button onClick={fetchAnalytics} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm transition-colors">
              Retry
            </button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Analytics" subtitle="Track your store performance">
      <div className="space-y-5">
        {/* Period Selector & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-lg w-full sm:w-auto">
            {[
              { key: '7days', label: '7D' },
              { key: '30days', label: '30D' },
              { key: '90days', label: '90D' },
              { key: 'year', label: '1Y' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAnalytics} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {metricsConfig.map((metric) => (
            <div key={metric.label} className={`${metric.bg} border ${metric.border} rounded-lg p-3 sm:p-4`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`w-8 h-8 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`w-4 h-4 ${metric.iconColor}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {fmtPct(metric.change)}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">{metric.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${metric.valueColor} leading-tight`}>
                {fmtMetric(metric.label, metric.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No revenue data for this period</p>
                </div>
              </div>
            )}
          </div>

          {/* Orders Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Orders per Day</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No order data for this period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Top Performing Products</h3>
            {data.topProducts.length > 0 && (
              <span className="text-xs text-gray-400">Showing top {data.topProducts.length}</span>
            )}
          </div>
          {data.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 w-8">#</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Product</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Revenue</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topProducts.map((product, index) => (
                    <tr key={product.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-400">#{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {product.images && product.images.length > 0 && (
                            <img src={product.images[0]} alt={product.name}
                              className="w-8 h-8 rounded-md object-cover border border-gray-100 flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[160px] sm:max-w-none">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-amber-600">{fmt(product.revenue)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="text-sm text-gray-700">{product.orders}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No product data for this period</p>
              <p className="text-xs text-gray-400 mt-1">Products will appear here once orders are placed</p>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAnalyticsPage;
