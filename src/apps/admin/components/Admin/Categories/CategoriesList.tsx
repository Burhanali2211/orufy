import { apiClient } from '@/shared/lib/apiClient';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  Layers,
  X,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Download
} from 'lucide-react';
import { ConfirmModal } from '@/shared/components/Common/Modal';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { getSafeImageUrl, isValidImageUrl } from '@/shared/utils/imageUrlUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadAsCSV } from '@/shared/utils/exportUtils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'parent_name' | 'product_count' | 'is_active'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const [catsRes, productsRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/products'),
      ]);
      
      const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
      const products = Array.isArray(productsRes) ? productsRes : (productsRes?.data || []);

      // Build product count map
      const countMap = products.reduce((acc: Record<string, number>, p: any) => {
        if (p.category_id || p.categoryId) {
          const catId = p.category_id || p.categoryId;
          acc[catId] = (acc[catId] || 0) + 1;
        }
        return acc;
      }, {});

      // Resolve parent names client-side
      return cats.map((c: Category) => ({
        ...c,
        parent_name: cats.find((p: Category) => p.id === c.parent_id)?.name || null,
        product_count: countMap[c.id] || 0,
      })) as Category[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      showSuccess('Success', 'Category deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowDeleteModal(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      showError('Error', error.message || 'Failed to delete category');
    }
  });

  const handleDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    if (!categories) return;
    const exportData = categories.map((c) => ({
      ID: c.id,
      Name: c.name,
      Slug: c.slug,
      'Parent Category': c.parent_name || 'None',
      Products: c.product_count,
      Status: c.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(c.created_at).toLocaleString()
    }));
    downloadAsCSV(exportData, 'categories_export');
  };

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        cat => cat.name.toLowerCase().includes(term) || cat.slug.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      result = result.filter(cat => cat.is_active === (statusFilter === 'active'));
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const aN = typeof aVal === 'string' ? aVal.toLowerCase() : aVal;
      const bN = typeof bVal === 'string' ? bVal.toLowerCase() : bVal;
      if (aN === bN) return 0;
      if (aN == null) return 1;
      if (bN == null) return -1;
      const cmp = aN > bN ? 1 : -1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [categories, searchTerm, statusFilter, sortKey, sortDirection]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const topLevelCategories = categories.filter(c => !c.parent_id).length;
  const subCategories = totalCategories - topLevelCategories;

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (
      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
    ) : (
      <span className="w-3 h-3 opacity-30">↕</span>
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
            <Tag className="w-6 h-6 text-yellow-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900" >Categories</h1>
            <p className="text-sm text-gray-600 font-medium">Organize your product categories</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!categories || categories.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors shadow-sm flex-shrink-0 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => navigate('/admin/categories/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors min-h-11 shadow-sm text-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Categories', value: totalCategories, icon: Tag, bg: 'bg-gray-50', val_c: 'text-gray-900', icon_c: 'text-gray-600' },
          { label: 'Active', value: activeCategories, icon: CheckCircle, bg: 'bg-green-50', val_c: 'text-green-700', icon_c: 'text-green-700' },
          { label: 'Top-level', value: topLevelCategories, icon: Layers, bg: 'bg-blue-50', val_c: 'text-blue-600', icon_c: 'text-blue-600' },
          { label: 'Sub-categories', value: subCategories, icon: Layers, bg: 'bg-purple-50', val_c: 'text-purple-600', icon_c: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, bg, val_c, icon_c }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-md flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${icon_c}`} />
            </div>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className={`text-[28px] font-normal ${val_c}`} >{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500 transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-all appearance-none pr-10 min-w-[140px]"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-md animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-600 text-sm">No categories found</p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                className="mt-2 text-blue-600 text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── MOBILE: card list (hidden sm+) ── */}
            <div className="sm:hidden divide-y divide-[#e8eaed]">
              {filteredCategories.map(category => {
                const imgSrc = getSafeImageUrl(category.image_url, '');
                const hasImage = isValidImageUrl(imgSrc);
                return (
                  <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Row 1: image + name + actions */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {hasImage ? (
                          <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Tag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-base truncate" >{category.name}</p>
                        <p className="text-sm text-gray-600 truncate">{category.slug}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 ml-[64px]">
                      {category.parent_name ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[12px] font-medium border border-gray-200">
                          ↳ {category.parent_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[12px] font-medium border border-blue-100">
                          Top-level
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-[12px] font-medium border border-purple-200">
                        {category.product_count} products
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium border ${
                        category.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {category.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP: table (hidden on mobile) ── */}
            <div className="hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-14">Img</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                      <button type="button" onClick={() => handleSort('name')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-gray-900">
                        Name <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 hidden md:table-cell">
                      <button type="button" onClick={() => handleSort('parent_name')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-gray-900">
                        Parent <SortIcon col="parent_name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                      <button type="button" onClick={() => handleSort('product_count')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-gray-900">
                        Products <SortIcon col="product_count" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">
                      <button type="button" onClick={() => handleSort('is_active')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-gray-900">
                        Status <SortIcon col="is_active" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eaed]">
                  {filteredCategories.map(category => {
                    const imgSrc = getSafeImageUrl(category.image_url, '');
                    const hasImage = isValidImageUrl(imgSrc);
                    return (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-[12px] overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                            {hasImage ? (
                              <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Tag className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]" >{category.name}</p>
                          <p className="text-[12px] text-gray-600 truncate max-w-[200px]">{category.slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {category.parent_name ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[12px] font-medium border border-gray-200">
                              {category.parent_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[12px] font-medium border border-blue-100">Top-level</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                            {category.product_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium border ${
                            category.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                              title="Edit" aria-label="Edit category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                              className="p-2 text-red-700 hover:bg-red-50 rounded-md transition-colors min-h-10 min-w-10 flex items-center justify-center"
                              title="Delete" aria-label="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedCategory(null); }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${selectedCategory?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
