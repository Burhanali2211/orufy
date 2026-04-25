import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, 
  Search, Filter, Edit, Save, X, RefreshCw, Loader2
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

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
        return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg">In Stock</span>;
      case 'low_stock':
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low Stock</span>;
      case 'out_of_stock':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg">Out of Stock</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SellerDashboardLayout title="Inventory" subtitle="Manage your stock levels">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Inventory" subtitle="Manage your stock levels">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${
              statusFilter === 'all' ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-white/60 text-sm">Total Products</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${
              statusFilter === 'in_stock' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white/60 text-sm">In Stock</p>
                <p className="text-xl font-bold text-white">{stats.inStock}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${
              statusFilter === 'low_stock' ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-white/60 text-sm">Low Stock</p>
                <p className="text-xl font-bold text-white">{stats.lowStock}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('out_of_stock')}
            className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${
              statusFilter === 'out_of_stock' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-white/60 text-sm">Out of Stock</p>
                <p className="text-xl font-bold text-white">{stats.outOfStock}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors">
              <RefreshCw className="w-5 h-5" />
              Sync Inventory
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left text-white/60 text-sm font-medium p-4">Product</th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">SKU</th>
                  <th className="text-center text-white/60 text-sm font-medium p-4">Stock</th>
                  <th className="text-center text-white/60 text-sm font-medium p-4">Min Stock</th>
                  <th className="text-center text-white/60 text-sm font-medium p-4">Status</th>
                  <th className="text-center text-white/60 text-sm font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white/40" />
                        </div>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/60 font-mono text-sm">{item.sku}</td>
                    <td className="p-4 text-center">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-white/10 border border-cyan-500/50 rounded-lg text-white text-center focus:outline-none"
                          min="0"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-bold ${
                          item.stock === 0 ? 'text-red-400' : item.stock < item.minStock ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.stock}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-white/60">{item.minStock}</td>
                    <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleStockUpdate(item.id)}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue(item.stock);
                            }}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
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

