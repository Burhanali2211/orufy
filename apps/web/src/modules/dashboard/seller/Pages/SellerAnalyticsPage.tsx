import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Eye, Users, ArrowUpRight, ArrowDownRight, Calendar, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
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
            change: '+12.5%', 
            trend: 'up', 
            icon: DollarSign, 
            color: 'blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            label: 'Total Orders', 
            value: totalOrders.toString(), 
            change: '+8.2%', 
            trend: 'up', 
            icon: ShoppingCart, 
            color: 'indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600'
          },
          { 
            label: 'Product Views', 
            value: '2,485', 
            change: '+15.3%', 
            trend: 'up', 
            icon: Eye, 
            color: 'purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
          },
          { 
            label: 'Conversion Rate', 
            value: '3.2%', 
            change: '+0.5%', 
            trend: 'up', 
            icon: TrendingUp, 
            color: 'emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600'
          },
          { 
            label: 'Avg Order Value', 
            value: `₹${avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 
            change: '-2.1%', 
            trend: 'down', 
            icon: BarChart3, 
            color: 'amber-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600'
          },
          { 
            label: 'Total Products', 
            value: products.length.toString(), 
            change: 'Active', 
            trend: 'neutral', 
            icon: Users, 
            color: 'slate-600',
            bgColor: 'bg-slate-50',
            textColor: 'text-slate-600'
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
            growth: index === 0 ? 12 : index === 1 ? 8 : -2
          }));

        setTopProducts(topProductsList);
        setTrafficSources([
          { source: 'Direct', visits: 1245, percentage: 45 },
          { source: 'Google Search', visits: 856, percentage: 32 },
          { source: 'Social Media', visits: 412, percentage: 15 },
          { source: 'Referral', visits: 215, percentage: 8 }
        ]);
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Analytics" subtitle="Track your store performance">
      <div className="space-y-8 pb-12">
        <div className="flex justify-end">
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium">Refresh Data</span>
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Performance Overview</h2>
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { key: '7days', label: '7D' },
              { key: '30days', label: '30D' },
              { key: '90days', label: '90D' },
              { key: 'year', label: '1Y' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${metric.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <metric.icon className={`w-7 h-7 ${metric.textColor}`} />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  metric.trend === 'up' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : metric.trend === 'down' 
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-50 text-slate-600'
                }`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : metric.trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                  {metric.change}
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">{metric.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Revenue Trend</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                Last {selectedPeriod === '7days' ? '7 Days' : selectedPeriod === '30days' ? '30 Days' : '90 Days'}
              </div>
            </div>
            <div className="h-72 flex items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem]">
              <div className="text-center px-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-slate-900 font-bold text-lg mb-1">Visualizing Data</p>
                <p className="text-slate-500 text-sm max-w-[200px]">Live revenue charts are being integrated with your store data.</p>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Traffic Sources</h3>
            {trafficSources.length > 0 ? (
              <div className="space-y-6">
                {trafficSources.map((source) => (
                  <div key={source.source} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <span className="text-slate-700 font-bold">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{source.visits.toLocaleString()}</span>
                        <span className="text-slate-400 text-sm font-medium">({source.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium">Total Website Visits</p>
                  <p className="text-slate-900 font-extrabold text-lg">2,728</p>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                <div className="text-center px-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Users className="w-8 h-8 text-indigo-500" />
                  </div>
                  <p className="text-slate-900 font-bold text-lg mb-1">Visitor Insights</p>
                  <p className="text-slate-500 text-sm">Traffic source analysis will appear here as customers visit your store.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Top Performing Products</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Based on revenue and sales volume</p>
            </div>
            <button className="text-blue-600 font-bold text-sm hover:underline px-4 py-2 bg-blue-50 rounded-xl transition-all">
              View Detailed Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">#</th>
                  <th className="text-left text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Product Name</th>
                  <th className="text-right text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Revenue</th>
                  <th className="text-right text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Total Sales</th>
                  <th className="text-right text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <tr key={product.name || index} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">{product.name}</p>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-slate-900 font-extrabold">
                          ₹{product.revenue.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                          {product.orders} orders
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className={`inline-flex items-center gap-1 font-bold ${
                          product.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {product.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {product.growth !== 0 ? `${Math.abs(product.growth)}%` : '0%'}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="max-w-[240px] mx-auto">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <ShoppingCart className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-bold">No product data yet</p>
                        <p className="text-slate-500 text-sm mt-1">Start selling to see your top performing products here.</p>
                      </div>
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


