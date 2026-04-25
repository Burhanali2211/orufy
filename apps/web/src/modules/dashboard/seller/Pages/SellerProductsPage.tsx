import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { DataTable, Column } from '@/components/Common/DataTable';
import { ConfirmModal } from '@/components/Common/Modal';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

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
  views?: number;
  sold?: number;
}

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const pageSize = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get<{ success: boolean; data: any[]; pagination?: { totalPages: number; total: number } }>(`/seller/products?${params}`);

      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      await apiClient.delete(`/seller/products/${selectedProduct.id}`);
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

  const columns: Column<Product>[] = [
    {
      key: 'images',
      label: 'Product',
      width: '300px',
      render: (product) => (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{product.name}</p>
            <p className="text-xs text-slate-500 font-medium">{product.category_name}</p>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-bold text-slate-900 text-base">₹{Number(product.price).toLocaleString('en-IN')}</p>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <p className="text-xs text-slate-400 line-through font-medium">
              ₹{Number(product.original_price).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (product) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border ${
            product.stock === 0
              ? 'bg-rose-50 text-rose-600 border-rose-100'
              : product.stock < 10
              ? 'bg-amber-50 text-amber-600 border-amber-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}
        >
          {product.stock === 0 && <AlertTriangle className="w-3.5 h-3.5" />}
          {product.stock} Units
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (product) => (
        <span
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${
            product.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          {product.is_active ? 'Active' : 'Draft'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (product) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(product);
              setShowDeleteModal(true);
            }}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Products</p>
                <p className="text-2xl font-black text-slate-900">{totalItems}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active</p>
                <p className="text-2xl font-black text-slate-900">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Low Stock</p>
                <p className="text-2xl font-black text-slate-900">
                  {products.filter(p => p.stock < 10 && p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Out of Stock</p>
                <p className="text-2xl font-black text-slate-900">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          {/* Header & Filters */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h2>
                <p className="text-slate-500 font-medium mt-1">Manage and organize your store inventory</p>
              </div>
              <button
                onClick={() => navigate('/admin/products/add')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex-shrink-0"
              >
                <Plus className="h-5 w-5" />
                New Product
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                >
                  <option value="">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Drafts Only</option>
                </select>
                
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setCurrentPage(1);
                  }}
                  className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <DataTable
              data={products}
              columns={columns}
              loading={loading}
              pagination={{
                currentPage,
                totalPages,
                pageSize,
                totalItems,
                onPageChange: setCurrentPage
              }}
              emptyMessage="No products found. Start adding your first product to see it here."
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  );
};

export const SellerProductsPage: React.FC = () => {
  return (
    <SellerDashboardLayout title="Inventory" subtitle="Track and manage your stock">
      <Routes>
        <Route index element={<ProductsList />} />
      </Routes>
    </SellerDashboardLayout>
  );
};


export default SellerProductsPage;

