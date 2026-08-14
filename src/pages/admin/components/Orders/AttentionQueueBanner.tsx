import React, { useEffect, useState } from 'react';
import { Sparkles, Package, Truck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AttentionQueueData {
  newOrdersCount: number;
  toPackCount: number;
  needTrackingCount: number;
  lowStockCount: number;
  totalActiveOrders: number;
}

interface AttentionQueueBannerProps {
  onFilterSelect?: (status: string) => void;
}

export const AttentionQueueBanner: React.FC<AttentionQueueBannerProps> = ({ onFilterSelect }) => {
  const [data, setData] = useState<AttentionQueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttentionQueue();
  }, []);

  const fetchAttentionQueue = async () => {
    try {
      const res = await fetch('/api/merchant/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.attentionQueue) {
          setData(json.attentionQueue);
        }
      }
    } catch (err) {
      console.warn('Failed to load attention queue metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return null;

  const hasItemsNeedingAction =
    data.newOrdersCount > 0 ||
    data.toPackCount > 0 ||
    data.needTrackingCount > 0 ||
    data.lowStockCount > 0;

  return (
    <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-5 shadow-lg border border-stone-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Merchant Attention Queue</h2>
            <p className="text-xs text-stone-400">High-priority operational actions for today</p>
          </div>
        </div>
        {hasItemsNeedingAction ? (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full hidden">
            Action Required
          </span>
        ) : (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Caught Up
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: New Orders */}
        <button
          onClick={() => onFilterSelect?.('UNFULFILLED')}
          className="text-left p-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 transition-all hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>New Orders</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data.newOrdersCount}</div>
          <div className="text-[11px] text-amber-400/90 mt-0.5 font-medium">Ready for review</div>
        </button>

        {/* Card 2: Waiting for Packing */}
        <button
          onClick={() => onFilterSelect?.('UNFULFILLED')}
          className="text-left p-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 transition-all hover:border-blue-500/50 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-blue-400" /> To Pack</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data.toPackCount}</div>
          <div className="text-[11px] text-blue-400/90 mt-0.5 font-medium">Paid & awaiting pack</div>
        </button>

        {/* Card 3: Needs Tracking */}
        <button
          onClick={() => onFilterSelect?.('PACKED')}
          className="text-left p-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 transition-all hover:border-purple-500/50 group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-purple-400" /> Need AWB</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data.needTrackingCount}</div>
          <div className="text-[11px] text-purple-400/90 mt-0.5 font-medium">Packed, ready to ship</div>
        </button>

        {/* Card 4: Low Stock Alerts */}
        <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/80">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Low Stock</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{data.lowStockCount}</div>
          <div className="text-[11px] text-rose-400/90 mt-0.5 font-medium">Products near threshold</div>
        </div>
      </div>
    </div>
  );
};
