import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';
import { formatRupees } from '../utils';
import type { DashboardProduct } from '../types';

interface ProductsResponse {
  products: DashboardProduct[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

const ProductsPage: React.FC = () => {
  const { user } = useDashboardAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(
    (searchTerm: string, pageNum: number) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm) params.set('search', searchTerm);

      apiClient
        .get<ProductsResponse>(`/api/dashboard/products?${params}`)
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch(() => setError('Could not load products.'))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProducts(search, page);
  }, [user, navigate, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(val, 1), 300);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/api/dashboard/products/${id}`);
      fetchProducts(search, page);
    } catch {
      alert('Failed to delete product. Please try again.');
    }
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Products</h1>
        <Link
          to="/dashboard/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:opacity-90"
        >
          + Add product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={handleSearchChange}
          className="w-full sm:w-72 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="py-6 text-center text-gray-500">{error}</p>
      )}

      {!error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Image', 'Name', 'Price', 'Stock', 'Status', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-2 text-xs text-gray-500 font-medium whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="bg-gray-100 animate-pulse rounded h-5 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data && data.products.length > 0 ? (
                  data.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatRupees(product.price)}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          product.stock <= 5 ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/dashboard/products/${product.id}/edit`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            className="text-red-500 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-gray-400 mb-3">No products yet.</p>
                      <Link
                        to="/dashboard/products/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:opacity-90"
                      >
                        + Add product
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={data.page >= data.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
