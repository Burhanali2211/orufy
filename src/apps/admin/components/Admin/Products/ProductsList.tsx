import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/Common/Modal';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { getFirstValidImage } from '@/shared/utils/imageUrlUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadAsCSV } from '@/shared/utils/exportUtils';

interface Product {
  id: string;
  name: string;
  price: string;
  original_price: string;
  stock: number;
  category_name: string;
  is_active: boolean;
  images: string[];
  created_at: string;
}

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3" />
        Out of Stock
      </span>
    );
  }
  if (stock < 10) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3" />
        Low Stock ({stock})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />
      {stock} in stock
    </span>
  );
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
    active
      ? 'bg-stone-900 text-white'
      : 'bg-stone-100 text-stone-600 border border-stone-200'
  }`}>
    {active ? 'Active' : 'Draft'}
  </span>
);

const ProductImage: React.FC<{ product: Product; size?: string }> = ({ product, size = 'w-12 h-12' }) => {
  const [imgError, setImgError] = useState(false);
  const validImage = getFirstValidImage(product.images);

  if (imgError || !validImage) {
    return (
      <div className={`${size} rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 flex-shrink-0 font-bold text-xs`}>
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0`}>
      <img
        src={validImage}
        alt={product.name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 250);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories')
      ]);
      
      const productsData = Array.isArray(productsRes) ? productsRes : (productsRes?.data || []);
      const categoriesData = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
      const categoryMap: Record<string, string> = {};
      categoriesData.forEach((c: any) => { categoryMap[c.id] = c.name; });
      
      return productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: String(p.price),
        original_price: p.original_price != null ? String(p.original_price) : '',
        stock: p.stock ?? 0,
        category_name: categoryMap[p.category_id] || 'Uncategorized',
        is_active: p.is_active ?? true,
        images: Array.isArray(p.images) ? p.images : [],
        created_at: p.created_at || new Date().toISOString()
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => apiClient.delete(`/products/${productId}`),
    onSuccess: () => {
      showSuccess('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowDeleteModal(false);
      setSelectedProduct(null);
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to delete product');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.put(`/products/${id}`, { is_active }),
    onSuccess: () => {
      showSuccess('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to update product status');
    }
  });

  const filteredProducts = (data || []).filter((product: Product) => {
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeProducts = (data || []).filter((p: Product) => p.is_active).length;
  const lowStockProducts = (data || []).filter((p: Product) => p.stock > 0 && p.stock < 10).length;
  const outOfStockProducts = (data || []).filter((p: Product) => p.stock === 0).length;

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const exportData = data.map((p: Product) => ({
      Name: p.name,
      Price: p.price,
      'Original Price': p.original_price,
      Stock: p.stock,
      Category: p.category_name,
      Status: p.is_active ? 'Active' : 'Draft',
      'Date Added': new Date(p.created_at).toLocaleDateString()
    }));
    downloadAsCSV(exportData, 'products-catalog');
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Product Catalog</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage your items, pricing, inventory levels, and visibility.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/add')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Items</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{data?.length || 0}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Live</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{activeProducts}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Low Stock</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">{lowStockProducts}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Out of Stock</p>
          <p className="text-2xl font-bold text-rose-700 mt-2">{outOfStockProducts}</p>
        </div>
      </div>

      {/* ── Search & Filter Ribbon ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              handleSearchChange(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Visibility</option>
          <option value="active">Active Only</option>
          <option value="inactive">Drafts Only</option>
        </select>
        {(searchInput || statusFilter) && (
          <button
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setStatusFilter('');
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Desktop Editorial Table ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium">Loading catalog...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No products found</h3>
            <p className="text-xs text-stone-500 mt-1">Try adjusting your search query or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Inventory</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {paginatedProducts.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-stone-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <ProductImage product={product} />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate max-w-xs">{product.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-stone-900">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </div>
                      {product.original_price && Number(product.original_price) > Number(product.price) && (
                        <div className="text-xs text-stone-400 line-through">
                          ₹{Number(product.original_price).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StockBadge stock={product.stock} />
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: product.id, is_active: !product.is_active })}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to toggle status"
                      >
                        <StatusBadge active={product.is_active} />
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/50">
            <p className="text-xs font-semibold text-stone-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-stone-900">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl text-stone-600 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ProductsList;
