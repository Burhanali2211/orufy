import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, CheckCircle, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/Common/Modal';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { isValidImageUrl, getFirstValidImage } from '@/shared/utils/imageUrlUtils';
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

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => (
  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-md border ${
    stock === 0
      ? 'bg-red-50 text-red-700 border-red-200'
      : stock < 10
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : 'bg-green-50 text-green-700 border-green-200'
  }`}>
    {stock === 0 ? 'Out of stock' : `Stock: ${stock}`}
  </span>
);

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`px-2.5 py-1 text-[12px] font-medium rounded-md border ${
    active
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'
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

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300);
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
        category_name: categoryMap[p.category_id || p.categoryId] || '—',
        is_active: p.is_active ?? true,
        images: p.images || [],
        created_at: p.created_at || new Date().toISOString(),
        description: p.description || '',
        sku: p.sku || ''
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      showSuccess('Success', 'Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowDeleteModal(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      showError('Error', error?.message || 'Failed to delete product');
    }
  });

  const handleDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const exportData = data.map((p: any) => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku,
      Price: p.price,
      'Original Price': p.original_price,
      Stock: p.stock,
      Category: p.category_name,
      Status: p.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(p.created_at).toLocaleString()
    }));
    downloadAsCSV(exportData, 'products_export');
  };

  // Filter and process data
  let processedData = data || [];
  
  const activeProducts = processedData.filter((p: any) => p.is_active).length;
  const lowStockProducts = processedData.filter((p: any) => p.is_active && p.stock > 0 && p.stock < 10).length;
  const outOfStockProducts = processedData.filter((p: any) => p.stock === 0).length;

  if (statusFilter === 'active') processedData = processedData.filter((p: any) => p.is_active);
  if (statusFilter === 'inactive') processedData = processedData.filter((p: any) => !p.is_active);
  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    processedData = processedData.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
      (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
      (p.sku && p.sku.toLowerCase().includes(lowerTerm))
    );
  }

  processedData.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalItems = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }
  
  const from = (currentPage - 1) * pageSize;
  const paginatedProducts = processedData.slice(from, from + pageSize);

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
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900" >Products</h1>
            <p className="text-sm font-medium text-gray-600">Manage your product catalog</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors shadow-sm flex-shrink-0 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm flex-shrink-0 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">All Products</p>
          <p className="text-[28px] font-normal text-gray-900" >{data?.length || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-700" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Active</p>
          <p className="text-[28px] font-normal text-green-700" >{activeProducts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-yellow-50 rounded-md flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Low Stock</p>
          <p className="text-[28px] font-normal text-yellow-700" >{lowStockProducts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5 text-red-700" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Out of Stock</p>
          <p className="text-[28px] font-normal text-red-700" >{outOfStockProducts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); handleSearchChange(e.target.value); }}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500 transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchInput || statusFilter) && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }}
              className="px-5 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list — hidden on md+ */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-md animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No products found</p>
          </div>
        ) : (
          <>
            {paginatedProducts.map((product: Product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <ProductImage product={product} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base text-gray-900 truncate" >{product.name}</p>
                    <p className="text-sm text-gray-600 truncate mb-2.5">{product.category_name}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge active={product.is_active} />
                      <StockBadge stock={product.stock} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-semibold text-base text-gray-900" >
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
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                        aria-label="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                        className="p-2 text-red-700 hover:bg-red-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
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
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-14">Image</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-md animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading...</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No products found</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <ProductImage product={product} size="w-12 h-12" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]" >{product.name}</p>
                      <p className="text-[12px] text-gray-600 truncate max-w-[200px]">{product.category_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-gray-900">₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      {product.original_price && (
                        <p className="text-[12px] text-[#80868b] line-through">₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-[12px] font-medium rounded-md border ${
                        product.stock === 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : product.stock < 10
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
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
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
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
        {!isLoading && paginatedProducts.length > 0 && (
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
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
