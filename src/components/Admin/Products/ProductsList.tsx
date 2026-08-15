import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, CheckCircle, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
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
  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${
    stock === 0
      ? 'bg-[#fce8e6] text-[#d93025] border-[#fad2cf]'
      : stock < 10
        ? 'bg-[#fef7e0] text-[#f29900] border-[#fce4ec]'
        : 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
  }`}>
    {stock === 0 ? 'Out of stock' : `Stock: ${stock}`}
  </span>
);

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${
    active
      ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
      : 'bg-[#f8f9fa] text-[#5f6368] border-[#e8eaed]'
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
    // product stats will be updated inside fetchProducts
  }, []);

  const fetchProductStats = (productsData: any[] = []) => {
    try {
      const active = productsData.filter(p => p.is_active).length;
      const lowStock = productsData.filter(p => p.is_active && p.stock > 0 && p.stock < 10).length;
      const outOfStock = productsData.filter(p => p.stock === 0).length;
      
      const newStats = { active, lowStock, outOfStock };
      setProductStats(newStats);
      _productStatsCache = newStats;
    } catch {
      // non-critical
    }
  };

  const fetchProducts = async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      const { data: productsData, error } = await apiClient.get('/products');
      if (error) throw new Error(error.message || 'Failed to fetch products');

      const rows = productsData || [];
      
      // Update stats based on all products
      fetchProductStats(rows);

      // Filter rows
      let filteredRows = rows;
      if (statusFilter === 'active') filteredRows = filteredRows.filter((p: any) => p.is_active);
      if (statusFilter === 'inactive') filteredRows = filteredRows.filter((p: any) => !p.is_active);
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filteredRows = filteredRows.filter((p: any) => 
          (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
          (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
          (p.sku && p.sku.toLowerCase().includes(lowerTerm))
        );
      }

      // Sort by created_at descending
      filteredRows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Pagination
      const ti = filteredRows.length;
      const tp = Math.max(1, Math.ceil(ti / pageSize));
      
      // Safety check if current page exceeds total pages
      const safeCurrentPage = Math.min(currentPage, tp);
      if (safeCurrentPage !== currentPage) {
        setCurrentPage(safeCurrentPage);
        return; // Will re-trigger fetch due to dependency
      }
      
      const from = (safeCurrentPage - 1) * pageSize;
      const paginatedRows = filteredRows.slice(from, from + pageSize);

      const categoryIds = [...new Set(paginatedRows.map((p: any) => p.category_id).filter(Boolean))];
      const categoryMap: Record<string, string> = {};
      if (categoryIds.length > 0) {
        const res = await apiClient.get('/categories');
        (res.data || []).forEach((c: any) => { categoryMap[c.id] = c.name; });
      }

      const mappedProducts = paginatedRows.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: String(p.price),
        original_price: p.original_price != null ? String(p.original_price) : '',
        stock: p.stock ?? 0,
        category_name: categoryMap[p.category_id] || '—',
        is_active: p.is_active ?? true,
        images: p.images || [],
        created_at: p.created_at,
      }));
      
      setProducts(mappedProducts);
      setTotalItems(ti);
      setTotalPages(tp);
      // Cache only the default (page 1, no filters) result
      if (safeCurrentPage === 1 && !searchTerm && !statusFilter) {
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

      await apiClient.delete(`/products/${pid}`);
      
      _productsCache = null;
      showSuccess('Success', 'Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8f0fe] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Products</h1>
            <p className="text-[13px] font-medium text-[#5f6368]">Manage your product catalog</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/products/add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium transition-colors shadow-sm flex-shrink-0 text-[14px]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-[#5f6368]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">All Products</p>
          <p className="text-[28px] font-normal text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{totalItems}</p>
        </div>
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#e6f4ea] rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-[#137333]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Active</p>
          <p className="text-[28px] font-normal text-[#137333]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{activeProducts}</p>
        </div>
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#fef7e0] rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-[#f29900]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Low Stock</p>
          <p className="text-[28px] font-normal text-[#f29900]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{lowStockProducts}</p>
        </div>
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-[#fce8e6] rounded-full flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5 text-[#d93025]" />
          </div>
          <p className="text-[13px] text-[#5f6368] font-medium">Out of Stock</p>
          <p className="text-[28px] font-normal text-[#d93025]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{outOfStockProducts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); handleSearchChange(e.target.value); }}
              className="w-full pl-11 pr-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchInput || statusFilter) && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }}
              className="px-5 py-3 text-[14px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list — hidden on md+ */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white border border-[#e8eaed] rounded-[24px] p-8 text-center">
            <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[14px] text-[#5f6368]">Loading...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-[#e8eaed] rounded-[24px] p-8 text-center">
            <Package className="w-10 h-10 text-[#dadce0] mx-auto mb-3" />
            <p className="text-[14px] text-[#5f6368]">No products found</p>
          </div>
        ) : (
          <>
            {products.map((product) => (
              <div key={product.id} className="bg-white border border-[#e8eaed] rounded-[24px] p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <ProductImage product={product} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[15px] text-[#202124] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{product.name}</p>
                    <p className="text-[13px] text-[#5f6368] truncate mb-2.5">{product.category_name}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge active={product.is_active} />
                      <StockBadge stock={product.stock} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-semibold text-[15px] text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>
                      ₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    {product.original_price && (
                      <p className="text-[12px] text-[#80868b] line-through">
                        ₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        aria-label="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                        className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white border border-[#e8eaed] rounded-[24px]">
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
      <div className="hidden md:block bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] w-14">Image</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">Name</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">Price</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">Stock</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">Status</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[14px] text-[#5f6368]">Loading...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-10 h-10 text-[#dadce0] mx-auto mb-3" />
                    <p className="text-[14px] text-[#5f6368]">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      <ProductImage product={product} size="w-12 h-12" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[14px] text-[#202124] truncate max-w-[200px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{product.name}</p>
                      <p className="text-[12px] text-[#5f6368] truncate max-w-[200px]">{product.category_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[14px] text-[#202124]">₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      {product.original_price && (
                        <p className="text-[12px] text-[#80868b] line-through">₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-full border ${
                        product.stock === 0
                          ? 'bg-[#fce8e6] text-[#d93025] border-[#fad2cf]'
                          : product.stock < 10
                            ? 'bg-[#fef7e0] text-[#f29900] border-[#fce4ec]'
                            : 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge active={product.is_active} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                          className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
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
