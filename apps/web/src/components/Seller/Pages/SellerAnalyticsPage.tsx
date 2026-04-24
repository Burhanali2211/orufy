import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Eye, Users, ArrowUpRight, ArrowDownRight, Calendar, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

export const SellerAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'year'>('30days');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const { showError } = useNotification();

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Fetch orders and products to calculate metrics
      const [ordersResponse, productsResponse] = await Promise.all([
        apiClient.get<{ success: boolean; data: { orders: any[] } }>('/seller/orders?limit=1000'),
        apiClient.get<{ success: boolean; data: { products: any[] } }>('/seller/products?limit=1000')
      ]);

      if (ordersResponse.success && productsResponse.success) {
        const orders = ordersResponse.data?.orders || [];
        const products = productsResponse.data?.products || [];

        // Calculate metrics from real data
        const totalRevenue = orders.reduce((sum: number, o: any) => 
          sum + (parseFloat(o.total) || 0), 0
        );
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setMetrics([
          { 
            label: 'Total Revenue', 
            value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
            change: 'Calculated', 
            trend: 'up', 
            icon: DollarSign, 
            color: 'cyan' 
          },
          { 
            label: 'Total Orders', 
            value: totalOrders.toString(), 
            change: 'Total', 
            trend: 'up', 
            icon: ShoppingCart, 
            color: 'blue' 
          },
          { 
            label: 'Product Views', 
            value: '0', 
            change: 'N/A', 
            trend: 'neutral', 
            icon: Eye, 
            color: 'purple' 
          },
          { 
            label: 'Conversion Rate', 
            value: '0%', 
            change: 'N/A', 
            trend: 'neutral', 
            icon: TrendingUp, 
            color: 'amber' 
          },
          { 
            label: 'Avg Order Value', 
            value: `₹${avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 
            change: 'Calculated', 
            trend: 'up', 
            icon: BarChart3, 
            color: 'emerald' 
          },
          { 
            label: 'Total Products', 
            value: products.length.toString(), 
            change: 'Active', 
            trend: 'up', 
            icon: Users, 
            color: 'indigo' 
          }
        ]);

        // Calculate top products by revenue (from orders)
        const productRevenue: Record<string, { revenue: number; orders: number; name: string }> = {};
        orders.forEach((order: any) => {
          if (order.items) {
            order.items.forEach((item: any) => {
              const productId = item.product_id || item.product?.id;
              if (productId) {
                if (!productRevenue[productId]) {
                  productRevenue[productId] = { revenue: 0, orders: 0, name: item.product?.name || 'Product' };
                }
                productRevenue[productId].revenue += (parseFloat(item.unit_price) || 0) * (item.quantity || 1);
                productRevenue[productId].orders += 1;
              }
            });
          }
        });

        const topProductsList = Object.values(productRevenue)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p, index) => ({
            name: p.name,
            revenue: p.revenue,
            orders: p.orders,
            growth: 0 // TODO: Calculate growth from period comparison
          }));

        setTopProducts(topProductsList);
        setTrafficSources([]); // TODO: Implement traffic source tracking
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load analytics data');
      setMetrics([]);
      setTopProducts([]);
      setTrafficSources([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SellerDashboardLayout title="Analytics" subtitle="Track your store performance">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Analytics" subtitle="Track your store performance">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            {[
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: '90days', label: '90 Days' },
              { key: 'year', label: 'Year' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-cyan-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 bg-${metric.color}-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}-400`} />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {metric.change}
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">{metric.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">Revenue chart visualization</p>
                <p className="text-white/30 text-sm">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
            {trafficSources.length > 0 ? (
              <div className="space-y-4">
                {trafficSources.map((source) => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">{source.source}</span>
                      <span className="text-white font-medium">{source.visits.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">Traffic analytics</p>
                  <p className="text-white/30 text-sm">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Top Performing Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left text-white/60 text-sm font-medium p-4">#</th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">Product</th>
                  <th className="text-right text-white/60 text-sm font-medium p-4">Revenue</th>
                  <th className="text-right text-white/60 text-sm font-medium p-4">Orders</th>
                  <th className="text-right text-white/60 text-sm font-medium p-4">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <tr key={product.name || index} className="hover:bg-white/5">
                      <td className="p-4 text-white/60">{index + 1}</td>
                      <td className="p-4 text-white font-medium">{product.name}</td>
                      <td className="p-4 text-right text-cyan-400 font-semibold">
                        ₹{product.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right text-white">{product.orders}</td>
                      <td className="p-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${
                          product.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {product.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {product.growth > 0 ? `${Math.abs(product.growth)}%` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/60">
                      No product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerAnalyticsPage;

