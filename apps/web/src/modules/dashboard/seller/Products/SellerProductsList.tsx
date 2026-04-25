import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
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
}

export const SellerProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      // Use seller-specific endpoint instead of admin endpoint
      const response = await apiClient.get<{ success: boolean; data: any[]; pagination: { totalPages: number; total: number } }>(`/seller/products?${params}`);

      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      // Use seller-specific endpoint instead of admin endpoint
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

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleAdd = () => {
    navigate('/admin/products/add');
  };

  const columns: Column<Product>[] = [
    {
      key: 'images',
      label: 'Image',
      width: '80px',
      render: (product) => (
        <img
          src={product.images[0] || '/placeholder.png'}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500">{product.category_name}</p>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-semibold text-gray-900">₹{Number(product.price).toLocaleString('en-IN')}</p>
          {product.original_price && (
            <p className="text-xs text-gray-500 line-through">
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
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            product.stock === 0
              ? 'bg-red-100 text-red-800'
              : product.stock < 10
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {product.stock}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (product) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            product.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (product) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(product)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(product);
              setShowDeleteModal(true);
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
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
        emptyMessage="No products found"
      />

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
    </div>
  );
};