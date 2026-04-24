import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, Download, CreditCard, 
  ArrowUpRight, ArrowDownRight, Wallet, Clock, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface Transaction {
  id: string;
  type: 'sale' | 'withdrawal' | 'refund';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

export const SellerEarningsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    available: 0,
    pending: 0,
    total: 0,
    withdrawn: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { showError } = useNotification();

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      // Fetch seller orders to calculate earnings
      const ordersResponse = await apiClient.get<{ success: boolean; data: { orders: any[] } }>('/seller/orders?limit=1000');

      if (ordersResponse.success && ordersResponse.data?.orders) {
        const orders = ordersResponse.data.orders;
        
        // Calculate earnings from orders
        const total = orders.reduce((sum: number, order: any) => 
          sum + (parseFloat(order.total) || 0), 0
        );
        
        const completed = orders
          .filter((o: any) => o.status === 'completed' && o.payment_status === 'paid')
          .reduce((sum: number, order: any) => 
            sum + (parseFloat(order.total) || 0), 0
          );
        
        const pending = orders
          .filter((o: any) => ['pending', 'processing', 'shipped'].includes(o.status))
          .reduce((sum: number, order: any) => 
            sum + (parseFloat(order.total) || 0), 0
          );

        setEarnings({
          available: completed,
          pending,
          total,
          withdrawn: 0 // TODO: Track withdrawals separately
        });

        // Create transactions from orders
        const orderTransactions: Transaction[] = orders
          .slice(0, 20)
          .map((order: any) => ({
            id: order.id,
            type: 'sale' as const,
            description: `Order #${order.order_number || order.id.slice(0, 8)}`,
            amount: parseFloat(order.total) || 0,
            date: order.created_at,
            status: order.status === 'completed' ? 'completed' : 'pending'
          }));

        setTransactions(orderTransactions);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load earnings data');
      setEarnings({ available: 0, pending: 0, total: 0, withdrawn: 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SellerDashboardLayout title="Earnings" subtitle="Track your revenue and payouts">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Earnings" subtitle="Track your revenue and payouts">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={fetchEarningsData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {/* Earnings Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-5 border border-cyan-500/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-500/30 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <p className="text-cyan-300 text-sm font-medium mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(earnings.available)}</p>
            <button className="mt-3 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors w-full">
              Withdraw Funds
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(earnings.pending)}</p>
            <p className="text-amber-400 text-xs mt-2">Processing orders</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(earnings.total)}</p>
            {earnings.total > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs mt-2">
                <ArrowUpRight className="w-3 h-3" /> Total revenue
              </span>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Withdrawn</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(earnings.withdrawn)}</p>
            <p className="text-white/40 text-xs mt-2">All time</p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Earnings Overview</h3>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Earnings chart visualization</p>
              <p className="text-white/30 text-sm">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:bg-white/5 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="divide-y divide-white/10">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'sale' 
                        ? 'bg-emerald-500/20' 
                        : transaction.type === 'withdrawal'
                        ? 'bg-purple-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'sale' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      ) : transaction.type === 'withdrawal' ? (
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-white/50 text-sm">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Settings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Bank Account</p>
                    <p className="text-white/50 text-sm">XXXX XXXX 4523</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> Default
                </span>
              </div>
            </div>
            <button className="bg-white/5 rounded-xl p-4 border border-dashed border-white/20 text-white/60 hover:bg-white/10 hover:border-white/30 transition-all">
              + Add Payment Method
            </button>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerEarningsPage;

