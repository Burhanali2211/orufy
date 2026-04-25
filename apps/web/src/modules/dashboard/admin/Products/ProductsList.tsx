import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, CheckCircle, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { isValidImageUrl, getFirstValidImage } from '../../../utils/imageUrlUtils';

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

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => (
  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
    stock === 0
      ? 'bg-red-50 text-red-700 border-red-100'
      : stock < 10
        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }`}>
    {stock === 0 ? 'Out of stock' : `Stock: ${stock}`}
  </span>
);

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
    active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-gray-100 text-gray-500 border-gray-200'
  }`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">{totalItems > 0 ? `${from}–${to} of ${totalItems}` : '0 results'}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium text-gray-700">{currentPage} / {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Module-level cache – survives SPA navigation, cleared on hard refresh
let _productsCache: { products: Product[]; totalItems: number; totalPages: number } | null = null;
let _productStatsCache: { active: number; lowStock: number; outOfStock: number } | null = null;

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(_productsCache?.products ?? []);
  const [loading, setLoading] = useState(_productsCache === null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(_productsCache?.totalPages ?? 1);
  const [totalItems, setTotalItems] = useState(_productsCache?.totalItems ?? 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productStats, setProductStats] = useState(_productStatsCache ?? { active: 0, lowStock: 0, outOfStock: 0 });
  const { showSuccess, showError } = useNotification();

  const pageSize = 10;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, []);

  useEffect(() => {
    const background = isFirstMount.current && _productsCache !== null;
    isFirstMount.current = false;
    fetchProducts(background);
  }, [currentPage, searchTerm, statusFilter]);
  useEffect(() => {
    const background = _productStatsCache !== null;
    fetchProductStats(background);
  }, []);

  const fetchProductStats = async (background = false) => {
    try {
      const stats = await apiClient.get<{active: number; lowStock: number; outOfStock: number}>('/api/dashboard/products/stats');
      const newStats = { active: stats.active || 0, lowStock: stats.lowStock || 0, outOfStock: stats.outOfStock || 0 };
      setProductStats(newStats);
      _productStatsCache = newStats;
    } catch {
      // non-critical
    }
  };

  const fetchProducts = async (background = false) => {
    try {
      if (!background) setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      if (statusFilter) params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get<{data: any[], total: number, totalPages: number}>(`/api/dashboard/products?${params.toString()}`);

      const rows = response.data || [];

      const mappedProducts = rows.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: String(p.price),
        original_price: p.comparePrice != null ? String(p.comparePrice) : '',
        stock: p.stock ?? 0,
        category_name: p.category || '—',
        is_active: p.isActive ?? true,
        images: p.imageUrls || [],
        created_at: p.createdAt,
      }));
      const ti = response.total ?? 0;
      const tp = response.totalPages ?? 1;
      setProducts(mappedProducts);
      setTotalItems(ti);
      setTotalPages(tp);
      // Cache only the default (page 1, no filters) result
      if (currentPage === 1 && !searchTerm && !statusFilter) {
        _productsCache = { products: mappedProducts, totalItems: ti, totalPages: tp };
      }
    } catch (error: any) {
      if (!background) showError('Error', error.message || 'Failed to load products');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      setDeleteLoading(true);
      const pid = selectedProduct.id;

      await apiClient.delete(`/api/dashboard/products/${pid}`);

      _productsCache = null;
      showSuccess('Success', 'Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchProductStats();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const { active: activeProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts } = productStats;

  const ProductImage: React.FC<{ product: Product; size?: string }> = ({ product, size = 'w-12 h-12' }) => {
    const imageUrl = getFirstValidImage(product.images || [], '/placeholder-image.jpg');
    const isValid = isValidImageUrl(imageUrl);
    return (
      <div className={`${size} rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center`}>
        {isValid ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
          />
        ) : (
          <Package className="w-5 h-5 text-gray-400" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">Manage your product catalog</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/products/add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors min-h-[44px] shadow-sm flex-shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">All Products</p>
          <p className="text-2xl font-bold text-amber-700">{totalItems}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Active</p>
          <p className="text-2xl font-bold text-emerald-700">{activeProducts}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-700">{lowStockProducts}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-700">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); handleSearchChange(e.target.value); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchInput || statusFilter) && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }}
              className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list — hidden on md+ */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            {products.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ProductImage product={product} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 truncate mb-2">{product.category_name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge active={product.is_active} />
                      <StockBadge stock={product.stock} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-bold text-sm text-gray-900">
                      ₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    {product.original_price && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        aria-label="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white border border-gray-200 rounded-xl">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Image</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <ProductImage product={product} size="w-10 h-10" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.category_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      {product.original_price && (
                        <p className="text-xs text-gray-400 line-through">₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                        product.stock === 0
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : product.stock < 10
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={product.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Delete"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedProduct(null); }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
