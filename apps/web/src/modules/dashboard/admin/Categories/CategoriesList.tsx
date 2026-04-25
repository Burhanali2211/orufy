import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Loader2,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { getSafeImageUrl, isValidImageUrl } from '../../../utils/imageUrlUtils';

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

// Module-level cache – survives SPA navigation, cleared on hard refresh
let _categoriesCache: Category[] | null = null;

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(_categoriesCache ?? []);
  const [loading, setLoading] = useState(_categoriesCache === null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'parent_name' | 'product_count' | 'is_active'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { showSuccess, showError } = useNotification();
  const isFirstMount = useRef(true);

  useEffect(() => {
    const background = isFirstMount.current && _categoriesCache !== null;
    isFirstMount.current = false;
    fetchCategories(background);
  }, []);

  const fetchCategories = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const [catsRes, productsRes] = await Promise.all([
        apiClient.get<any>('/api/dashboard/categories'),
        apiClient.get<any>('/api/dashboard/products'),
      ]);

      const cats = catsRes?.data || catsRes || [];
      const products = productsRes?.data || productsRes || [];

      // Build product count map
      const countMap = (products || []).reduce((acc: Record<string, number>, p: any) => {
        if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
        return acc;
      }, {});

      // Resolve parent names client-side
      const mapped = (cats || []).map((c: any) => ({
        ...c,
        parent_name: (cats || []).find((p: any) => p.id === c.parent_id)?.name || null,
        product_count: countMap[c.id] || 0,
      }));
      setCategories(mapped);
      _categoriesCache = mapped;
    } catch (error: any) {
      if (!background) showError('Error', error.message || 'Failed to load categories');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/dashboard/categories/${selectedCategory.id}`);
      _categoriesCache = null; // Invalidate cache after mutation
      showSuccess('Success', 'Category deleted');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500">Organize your product categories</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/categories/add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors min-h-[44px] shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCategories, icon: Tag, bg: 'bg-amber-50', border: 'border-amber-100', icon_c: 'text-amber-600', val_c: 'text-amber-700' },
          { label: 'Active', value: activeCategories, icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-100', icon_c: 'text-emerald-600', val_c: 'text-emerald-700' },
          { label: 'Top-level', value: topLevelCategories, icon: Layers, bg: 'bg-blue-50', border: 'border-blue-100', icon_c: 'text-blue-600', val_c: 'text-blue-700' },
          { label: 'Sub-categories', value: subCategories, icon: Layers, bg: 'bg-purple-50', border: 'border-purple-100', icon_c: 'text-purple-600', val_c: 'text-purple-700' },
        ].map(({ label, value, icon: Icon, bg, border, icon_c, val_c }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${icon_c}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${val_c}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-900 bg-white min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No categories found</p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                className="mt-2 text-amber-600 text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── MOBILE: card list (hidden sm+) ── */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredCategories.map(category => {
                const imgSrc = getSafeImageUrl(category.image_url, '');
                const hasImage = isValidImageUrl(imgSrc);
                return (
                  <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Row 1: image + name + actions */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {hasImage ? (
                          <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Tag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{category.name}</p>
                        <p className="text-xs text-gray-400 truncate">{category.slug}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 ml-15">
                      {category.parent_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          ↳ {category.parent_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                          Top-level
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
                        {category.product_count} products
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        category.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
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
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-14">Img</th>
                    <th className="text-left px-4 py-3">
                      <button type="button" onClick={() => handleSort('name')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Name <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <button type="button" onClick={() => handleSort('parent_name')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Parent <SortIcon col="parent_name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button type="button" onClick={() => handleSort('product_count')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Products <SortIcon col="product_count" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button type="button" onClick={() => handleSort('is_active')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        Status <SortIcon col="is_active" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map(category => {
                    const imgSrc = getSafeImageUrl(category.image_url, '');
                    const hasImage = isValidImageUrl(imgSrc);
                    return (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                            {hasImage ? (
                              <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Tag className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">{category.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{category.slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {category.parent_name ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {category.parent_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Top-level</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {category.product_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            category.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit" aria-label="Edit category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        loading={deleteLoading}
      />
    </div>
  );
};
