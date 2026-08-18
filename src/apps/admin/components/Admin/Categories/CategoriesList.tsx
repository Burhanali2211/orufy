import { apiClient } from '@/shared/lib/apiClient';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  CheckCircle2,
  Layers,
  X,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Download,
  FolderTree
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

      const countMap = products.reduce((acc: Record<string, number>, p: any) => {
        if (p.category_id || p.categoryId) {
          const catId = p.category_id || p.categoryId;
          acc[catId] = (acc[catId] || 0) + 1;
        }
        return acc;
      }, {});

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
      showSuccess('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowDeleteModal(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete category');
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
      Name: c.name,
      Slug: c.slug,
      'Parent Category': c.parent_name || 'None',
      Products: c.product_count,
      Status: c.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(c.created_at).toLocaleDateString()
    }));
    downloadAsCSV(exportData, 'categories_export');
  };

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c: Category) => {
        const matchesSearch = searchTerm === '' ||
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' ||
          (statusFilter === 'active' && c.is_active) ||
          (statusFilter === 'inactive' && !c.is_active);
        return matchesSearch && matchesStatus;
      })
      .sort((a: Category, b: Category) => {
        let valA: any = a[sortKey] ?? '';
        let valB: any = b[sortKey] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [categories, searchTerm, statusFilter, sortKey, sortDirection]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: Category) => c.is_active).length;
  const topLevelCategories = categories.filter((c: Category) => !c.parent_id).length;
  const subCategories = categories.filter((c: Category) => c.parent_id).length;

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-stone-900" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-stone-900" />;
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Categories & Taxonomy</h1>
          <p className="text-stone-500 text-sm mt-0.5">Organize items into collections and parent/child hierarchies.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={!categories || categories.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/admin/categories/add')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Categories</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{totalCategories}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Live</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{activeCategories}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Top-Level</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{topLevelCategories}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Sub-Collections</p>
          <p className="text-2xl font-bold text-stone-900 mt-2">{subCategories}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        {(searchTerm || statusFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Editorial Table ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-16 text-center">
            <Tag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">No categories found</h3>
            <p className="text-xs text-stone-500 mt-1">Add a new category or adjust your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16">Thumbnail</th>
                  <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="inline-flex items-center gap-1 group">
                      <span>Category Name</span>
                      <SortIcon col="name" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('parent_name')}>
                    <div className="inline-flex items-center gap-1 group">
                      <span>Hierarchy Level</span>
                      <SortIcon col="parent_name" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('product_count')}>
                    <div className="inline-flex items-center gap-1 group">
                      <span>Products</span>
                      <SortIcon col="product_count" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('is_active')}>
                    <div className="inline-flex items-center gap-1 group">
                      <span>Status</span>
                      <SortIcon col="is_active" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredCategories.map((category: Category) => {
                  const imgSrc = getSafeImageUrl(category.image_url, '');
                  const hasImage = isValidImageUrl(imgSrc);

                  return (
                    <tr key={category.id} className="hover:bg-stone-50/60 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {hasImage ? (
                            <img
                              src={imgSrc}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Tag className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-stone-900 truncate max-w-xs">{category.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">/{category.slug}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        {category.parent_name ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200">
                            <FolderTree className="w-3 h-3 text-stone-400" />
                            {category.parent_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-stone-900 text-white rounded-lg">
                            Root Collection
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-bold text-stone-700">
                          {category.product_count} items
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}>
                          {category.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? Associated products will become uncategorized.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
      />
    </div>
  );
};

export default CategoriesList;
