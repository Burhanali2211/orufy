import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';
import { formatRupees } from '../utils';
import type { AnalyticsSummary, DashboardOrder, OrderStatus } from '../types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SkeletonCard() {
  return <div className="bg-gray-100 animate-pulse rounded-lg h-24" />;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="bg-gray-100 animate-pulse rounded h-4" />
        </td>
      ))}
    </tr>
  );
}

const DashboardOverviewPage: React.FC = () => {
  const { user } = useDashboardAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    apiClient
      .get<AnalyticsSummary>('/api/dashboard/analytics/summary?period=30d')
      .then((res) => setData(res))
      .catch(() => setError('Could not load dashboard. Try refreshing.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const stats = data
    ? [
        { label: 'Orders this month', value: String(data.summary.totalOrders) },
        { label: 'Revenue this month', value: formatRupees(data.summary.totalRevenue) },
        { label: 'Total products', value: String(data.summary.totalProducts) },
        {
          label: 'Low stock',
          value: String(data.summary.lowStockCount),
          red: data.summary.lowStockCount > 0,
        },
      ]
    : [];

  if (error) {
    return (
      <p className="py-10 text-center text-gray-500">{error}</p>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    stat.red ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Customer', 'Total', 'Status', 'Date'].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-2 text-xs text-gray-500 font-medium whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data && data.recentOrders.length > 0 ? (
                data.recentOrders.map((order: DashboardOrder) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatRupees(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 text-right">
          <Link
            to="/dashboard/orders"
            className="text-sm text-blue-600 hover:underline"
          >
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
