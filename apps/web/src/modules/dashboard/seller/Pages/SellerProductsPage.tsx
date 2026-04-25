import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { DataTable, Column } from '../../Common/DataTable';
import { ConfirmModal } from '../../Common/Modal';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden border border-white/10">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white/30" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{product.name}</p>
            <p className="text-xs text-white/50">{product.category_name}</p>
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
          <p className="font-semibold text-cyan-400">₹{Number(product.price).toLocaleString('en-IN')}</p>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <p className="text-xs text-white/40 line-through">
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
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${
            product.stock === 0
              ? 'bg-red-500/20 text-red-400'
              : product.stock < 10
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {product.stock === 0 && <AlertTriangle className="w-3 h-3" />}
          {product.stock}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (product) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-lg ${
            product.is_active
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-white/50'
          }`}
        >
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(product);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Products</p>
                <p className="text-xl font-bold text-white">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Active</p>
                <p className="text-xl font-bold text-white">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Low Stock</p>
                <p className="text-xl font-bold text-white">
                  {products.filter(p => p.stock < 10 && p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Out of Stock</p>
                <p className="text-xl font-bold text-white">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header & Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Product Catalog</h2>
              <p className="text-white/60 text-sm">Manage your products</p>
            </div>
            <button
              onClick={() => navigate('/admin/products/add')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-white/10 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
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
            emptyMessage="No products found. Add your first product to get started."
          />
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
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  );
};

export const SellerProductsPage: React.FC = () => {
  return (
    <SellerDashboardLayout title="Products" subtitle="Manage your product catalog">
      <Routes>
        <Route index element={<ProductsList />} />
      </Routes>
    </SellerDashboardLayout>
  );
};

export default SellerProductsPage;

