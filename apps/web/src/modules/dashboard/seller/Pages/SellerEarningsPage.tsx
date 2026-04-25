import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, Download, CreditCard, 
  ArrowUpRight, ArrowDownRight, Wallet, Clock, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

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
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Earnings" subtitle="Track your revenue and payouts">
      <div className="space-y-8">
        <div className="flex justify-end">
          <button
            onClick={fetchEarningsData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-all font-bold text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <p className="text-blue-100 text-sm font-bold tracking-tight mb-1 uppercase">Available Balance</p>
              <p className="text-4xl font-black">{formatCurrency(earnings.available)}</p>
              <button className="mt-8 w-full py-4 bg-white text-blue-600 rounded-2xl text-sm font-black hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/10">
                Withdraw Funds
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 group hover:border-amber-200 transition-all">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100 group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-tight mb-1 uppercase">Pending</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(earnings.pending)}</p>
            <p className="text-amber-600 text-xs font-black mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              In processing
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 group hover:border-emerald-200 transition-all">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-tight mb-1 uppercase">Total Earned</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(earnings.total)}</p>
            {earnings.total > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-black mt-3">
                <ArrowUpRight className="w-3.5 h-3.5" /> 
                All time revenue
              </span>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 group hover:border-purple-200 transition-all">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 group-hover:scale-110 transition-transform">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-tight mb-1 uppercase">Withdrawn</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(earnings.withdrawn)}</p>
            <p className="text-slate-400 text-xs font-bold mt-3">Total payouts processed</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transaction History */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Transactions</h3>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 hover:border-blue-200 transition-all font-bold text-sm shadow-sm">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
                          transaction.type === 'sale' 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : transaction.type === 'withdrawal'
                            ? 'bg-purple-50 border-purple-100'
                            : 'bg-red-50 border-red-100'
                        }`}>
                          {transaction.type === 'sale' ? (
                            <ArrowUpRight className="w-7 h-7 text-emerald-600" />
                          ) : transaction.type === 'withdrawal' ? (
                            <CreditCard className="w-7 h-7 text-purple-600" />
                          ) : (
                            <ArrowDownRight className="w-7 h-7 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold text-lg tracking-tight">{transaction.description}</p>
                          <p className="text-slate-400 text-sm font-bold">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black mb-1 ${
                          transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider border ${
                          transaction.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            : 'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold text-lg tracking-tight">No transactions yet</p>
                  <p className="text-slate-300 text-sm mt-1">Earnings will be listed here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Earnings Insights Chart Placeholder */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Analytics</h3>
                <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {(['week', 'month', 'year'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        selectedPeriod === period
                          ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {period.slice(0, 1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="text-center px-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <TrendingUp className="w-8 h-8 text-blue-100" />
                  </div>
                  <p className="text-slate-400 font-bold tracking-tight">Revenue Insights</p>
                  <p className="text-slate-300 text-xs mt-1">Advanced charting coming soon</p>
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Payout Methods</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 group hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">Primary Bank</p>
                        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">•••• 4523</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 w-fit">
                    <CheckCircle className="w-3 h-3" /> 
                    Default Method
                  </div>
                </div>
                <button className="w-full py-6 bg-white rounded-[2rem] border border-dashed border-slate-300 text-slate-400 text-sm font-bold hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-light">+</span>
                  </div>
                  Add Payout Method
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerEarningsPage;

