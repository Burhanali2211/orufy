import React from 'react';
import { ShoppingCart, DollarSign, Clock, BarChart3, ArrowUpRight } from 'lucide-react';
import { getOrderStatusConfig, getAdminStatusClasses } from '@/utils/orderStatusUtils';

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
}

interface OrderStatsGridProps {
  stats: OrderStats | null;
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const OrderStatsGrid: React.FC<OrderStatsGridProps> = ({
  stats,
  loading,
  statusFilter,
  onStatusFilterChange
}) => {
  const fmt = (amount: number | string) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${(n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          {loading
            ? <div className="h-8 w-16 bg-amber-100 rounded hidden mt-1" />
            : <p className="text-2xl font-bold text-amber-700">{stats?.totalOrders ?? 0}</p>
          }
          {stats && stats.ordersToday > 0 && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />{stats.ordersToday} today
            </p>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Revenue</p>
          {loading
            ? <div className="h-8 w-20 bg-emerald-100 rounded hidden mt-1" />
            : <p className="text-2xl font-bold text-emerald-700">{fmt(stats?.totalRevenue ?? 0)}</p>
          }
          {stats && stats.revenueToday > 0 && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />{fmt(stats.revenueToday)} today
            </p>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          {loading
            ? <div className="h-8 w-12 bg-orange-100 rounded hidden mt-1" />
            : <p className="text-2xl font-bold text-orange-700">{stats?.pendingOrders ?? 0}</p>
          }
          {stats && stats.pendingOrders > 0 && (
            <p className="text-xs text-orange-600 mt-1">Need attention</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Avg Order</p>
          {loading
            ? <div className="h-8 w-16 bg-blue-100 rounded hidden mt-1" />
            : <p className="text-2xl font-bold text-blue-700">{fmt(stats?.avgOrderValue ?? 0)}</p>
          }
        </div>
      </div>

      {stats && Object.keys(stats.statusBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const config = getOrderStatusConfig(status);
              const cls = getAdminStatusClasses(status, false);
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(statusFilter === status ? '' : status)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${cls} ${statusFilter === status ? 'ring-2 ring-offset-1 ring-amber-400' : 'hover:opacity-80'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                  <span className="font-bold ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

