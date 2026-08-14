import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  AlertTriangle,
  History,
  Edit2,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminLayout } from '../Layout/AdminLayout';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock_level: number;
  price: string;
  images: string[];
  category_name: string;
  variant_count: number;
}

interface StockMovement {
  id: string;
  product_name: string;
  variant_name: string;
  change_amount: number;
  new_stock: number;
  type: string;
  notes: string;
  creator_name: string;
  created_at: string;
}

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'history'>('list');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, [search, statusFilter]);

  const fetchInventory = async () => {
    try {
      const response = await apiClient.get(`/admin/inventory?search=${search}&status=${statusFilter}`);
      if (response.success) {
        setItems(response.data);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await apiClient.get('/admin/inventory/movements');
      if (response.success) {
        setMovements(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch movements', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustingItem || adjustmentAmount === 0) return;

    try {
      const response = await apiClient.post('/admin/inventory/adjust', {
        product_id: adjustingItem.id,
        change_amount: adjustmentAmount,
        type: 'manual_adjustment',
        notes: adjustmentNotes
      });

      if (response.success) {
        showSuccess('Stock updated successfully');
        setAdjustingItem(null);
        setAdjustmentAmount(0);
        setAdjustmentNotes('');
        fetchInventory();
        fetchMovements();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update stock');
    }
  };

  const getStockBadgeColor = (item: InventoryItem) => {
    if (item.stock === 0) return 'bg-red-100 text-red-800';
    if (item.stock <= item.min_stock_level) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 mt-1">Monitor and adjust product stock levels</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start sm:self-center">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Stock List
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Movement History
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="">All Stock Status</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.images[0] || '/placeholder.png'}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">₹{Number(item.price).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.sku || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.category_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{item.stock}</span>
                            {item.stock <= item.min_stock_level && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(item)}`}>
                            {item.stock === 0 ? 'Out of Stock' : item.stock <= item.min_stock_level ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium p-2 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Movement History */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Change</th>
                    <th className="px-6 py-4">New Balance</th>
                    <th className="px-6 py-4">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m.id} className="text-sm">
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{m.product_name}</p>
                          {m.variant_name && <p className="text-xs text-gray-500">{m.variant_name}</p>}
                          {m.notes && <p className="text-xs text-amber-600 mt-1 italic">{m.notes}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-gray-600">{m.type.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${m.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.change_amount > 0 ? '+' : ''}{m.change_amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{m.new_stock}</td>
                        <td className="px-6 py-4 text-gray-600">{m.creator_name || 'System'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Adjust Stock</h3>
                <button onClick={() => setAdjustingItem(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img src={adjustingItem.images[0] || '/placeholder.png'} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-900">{adjustingItem.name}</h4>
                    <p className="text-sm text-gray-500">Current Stock: <span className="font-bold text-gray-900">{adjustingItem.stock}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Change Amount</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setAdjustmentAmount(prev => prev - 1)}
                        className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <input
                        type="number"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                        className="flex-1 text-center py-3 border border-gray-300 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button 
                        onClick={() => setAdjustmentAmount(prev => prev + 1)}
                        className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      New stock will be: <span className="font-bold text-gray-900">{adjustingItem.stock + adjustmentAmount}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                      placeholder="Reason for adjustment..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none h-24"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setAdjustingItem(null)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdjustStock}
                    disabled={adjustmentAmount === 0}
                    className="flex-1 px-4 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
