import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, 
  Search, Filter, Edit, Save, X, RefreshCw, Loader2
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  image: string;
  stock: number;
  minStock: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export const SellerInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: { products: any[] } }>('/seller/products?limit=1000');

      if (response.success && response.data?.products) {
        const products = response.data.products.map((product: any) => {
          const stock = product.stock || 0;
          const minStock = product.minStockLevel || 5;
          let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (stock === 0) status = 'out_of_stock';
          else if (stock < minStock) status = 'low_stock';

          return {
            id: product.id,
            name: product.name,
            sku: product.sku || `SKU-${product.id.slice(0, 8)}`,
            image: product.images?.[0] || '',
            stock,
            minStock,
            price: parseFloat(product.price) || 0,
            status,
            lastUpdated: product.updatedAt || product.createdAt || new Date().toISOString()
          };
        });
        setInventory(products);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.status === 'in_stock').length,
    lowStock: inventory.filter(i => i.status === 'low_stock').length,
    outOfStock: inventory.filter(i => i.status === 'out_of_stock').length
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStockUpdate = async (id: string) => {
    try {
      const newStock = editValue;
      await apiClient.patch(`/seller/products/${id}`, { stock: newStock });
      
      setInventory(prev => prev.map(item => {
        if (item.id === id) {
          let newStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (newStock === 0) newStatus = 'out_of_stock';
          else if (newStock < item.minStock) newStatus = 'low_stock';
          return { ...item, stock: newStock, status: newStatus, lastUpdated: new Date().toISOString() };
        }
        return item;
      }));
      setEditingId(null);
      showSuccess('Stock updated successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to update stock');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">In Stock</span>;
      case 'low_stock':
        return <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full flex items-center justify-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Low Stock</span>;
      case 'out_of_stock':
        return <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-full">Out of Stock</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SellerDashboardLayout title="Inventory" subtitle="Manage your stock levels">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Inventory" subtitle="Manage your stock levels">
      <div className="space-y-8 pb-12">
        <div className="flex justify-end">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-bold">Sync Data</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 group ${
              statusFilter === 'all' ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-slate-100 hover:border-blue-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
              }`}>
                <Package className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total</p>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 group ${
              statusFilter === 'in_stock' ? 'ring-2 ring-emerald-500 ring-offset-2' : 'border-slate-100 hover:border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                statusFilter === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
              }`}>
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">In Stock</p>
                <p className="text-2xl font-black text-slate-900">{stats.inStock}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 group ${
              statusFilter === 'low_stock' ? 'ring-2 ring-amber-500 ring-offset-2' : 'border-slate-100 hover:border-amber-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                statusFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
              }`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Low Stock</p>
                <p className="text-2xl font-black text-slate-900">{stats.lowStock}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('out_of_stock')}
            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 group ${
              statusFilter === 'out_of_stock' ? 'ring-2 ring-rose-500 ring-offset-2' : 'border-slate-100 hover:border-rose-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                statusFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'
              }`}>
                <TrendingDown className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Out of Stock</p>
                <p className="text-2xl font-black text-slate-900">{stats.outOfStock}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
              <RefreshCw className="w-5 h-5" />
              Quick Sync
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Product Info</th>
                  <th className="text-left text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">SKU</th>
                  <th className="text-center text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Current Stock</th>
                  <th className="text-center text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Min Level</th>
                  <th className="text-center text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Status</th>
                  <th className="text-center text-slate-500 text-xs font-bold p-6 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-7 h-7 text-slate-300" />
                          )}
                        </div>
                        <span className="text-slate-900 font-bold text-lg">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-slate-500 font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        {item.sku}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-24 px-4 py-2 bg-white border-2 border-blue-500 rounded-xl text-slate-900 text-center font-bold focus:outline-none shadow-lg shadow-blue-500/10"
                            min="0"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className={`text-xl font-black ${
                            item.stock === 0 
                              ? 'text-rose-600' 
                              : item.stock < item.minStock 
                                ? 'text-amber-600' 
                                : 'text-emerald-600'
                          }`}>
                            {item.stock}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Available</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-slate-600 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        {item.minStock}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-3">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleStockUpdate(item.id)}
                              className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm active:scale-95"
                              title="Save Changes"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm active:scale-95"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue(item.stock);
                            }}
                            className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm active:scale-95 group-hover:bg-blue-600 group-hover:text-white"
                            title="Quick Edit Stock"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerInventoryPage;


