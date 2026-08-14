import { apiClient } from '@/lib/apiClient';
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
  ChevronUp,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
import { supabase } from '../../../lib/legacyDb';
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
      const [{ data: cats, error }, { data: products }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('products').select('category_id'),
      ]);
      

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
      await apiClient.delete(`/categories/${selectedCategory.id}`);
      
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fef7e0] rounded-2xl flex items-center justify-center">
            <Tag className="w-6 h-6 text-[#f29900]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Categories</h1>
            <p className="text-[13px] text-[#5f6368] font-medium">Organize your product categories</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/categories/add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium transition-colors min-h-[44px] shadow-sm text-[14px]"
        >
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Categories', value: totalCategories, icon: Tag, bg: 'bg-[#f8f9fa]', val_c: 'text-[#202124]', icon_c: 'text-[#5f6368]' },
          { label: 'Active', value: activeCategories, icon: CheckCircle, bg: 'bg-[#e6f4ea]', val_c: 'text-[#137333]', icon_c: 'text-[#137333]' },
          { label: 'Top-level', value: topLevelCategories, icon: Layers, bg: 'bg-[#e8f0fe]', val_c: 'text-[#1a73e8]', icon_c: 'text-[#1a73e8]' },
          { label: 'Sub-categories', value: subCategories, icon: Layers, bg: 'bg-[#f3e8fd]', val_c: 'text-[#a142f4]', icon_c: 'text-[#a142f4]' },
        ].map(({ label, value, icon: Icon, bg, val_c, icon_c }) => (
          <div key={label} className="bg-white border border-[#e8eaed] rounded-[24px] p-5 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${icon_c}`} />
            </div>
            <p className="text-[13px] text-[#5f6368] font-medium">{label}</p>
            <p className={`text-[28px] font-normal ${val_c}`} style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368]" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-[#e8eaed] rounded-full focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white transition-all appearance-none pr-10 min-w-[140px]"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              className="flex items-center gap-1.5 px-5 py-3 text-[14px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#5f6368] text-[14px]">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="w-10 h-10 text-[#dadce0] mb-3" />
            <p className="text-[#5f6368] text-[14px]">No categories found</p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                className="mt-2 text-[#1a73e8] text-[14px] font-medium hover:underline"
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
                  <div key={category.id} className="p-4 hover:bg-[#f8f9fa] transition-colors">
                    {/* Row 1: image + name + actions */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-[#f1f3f4] border border-[#e8eaed] flex-shrink-0 flex items-center justify-center">
                        {hasImage ? (
                          <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Tag className="w-5 h-5 text-[#9aa0a6]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#202124] text-[15px] truncate" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{category.name}</p>
                        <p className="text-[13px] text-[#5f6368] truncate">{category.slug}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                          className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                          className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 ml-[64px]">
                      {category.parent_name ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#f1f3f4] text-[#5f6368] rounded-full text-[12px] font-medium border border-[#e8eaed]">
                          ↳ {category.parent_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-[12px] font-medium border border-[#d2e3fc]">
                          Top-level
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f3e8fd] text-[#a142f4] rounded-full text-[12px] font-medium border border-[#e9d2fd]">
                        {category.product_count} products
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border ${
                        category.is_active
                          ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                          : 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]'
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
                  <tr className="bg-[#f8f9fa] border-b border-[#e8eaed]">
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] w-14">Img</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">
                      <button type="button" onClick={() => handleSort('name')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-[#202124]">
                        Name <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] hidden md:table-cell">
                      <button type="button" onClick={() => handleSort('parent_name')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-[#202124]">
                        Parent <SortIcon col="parent_name" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">
                      <button type="button" onClick={() => handleSort('product_count')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-[#202124]">
                        Products <SortIcon col="product_count" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368]">
                      <button type="button" onClick={() => handleSort('is_active')}
                        className="inline-flex items-center gap-1 font-semibold hover:text-[#202124]">
                        Status <SortIcon col="is_active" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-[#5f6368] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eaed]">
                  {filteredCategories.map(category => {
                    const imgSrc = getSafeImageUrl(category.image_url, '');
                    const hasImage = isValidImageUrl(imgSrc);
                    return (
                      <tr key={category.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-[12px] overflow-hidden bg-[#f1f3f4] border border-[#e8eaed] flex-shrink-0 flex items-center justify-center">
                            {hasImage ? (
                              <img src={imgSrc} alt={category.name} className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Tag className="w-4 h-4 text-[#9aa0a6]" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-[14px] text-[#202124] truncate max-w-[200px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{category.name}</p>
                          <p className="text-[12px] text-[#5f6368] truncate max-w-[200px]">{category.slug}</p>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {category.parent_name ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-[#f1f3f4] text-[#5f6368] rounded-full text-[12px] font-medium border border-[#e8eaed]">
                              {category.parent_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-[12px] font-medium border border-[#d2e3fc]">Top-level</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#f3e8fd] text-[#a142f4] border border-[#e9d2fd]">
                            {category.product_count}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border ${
                            category.is_active
                              ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                              : 'bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                              className="p-2 text-[#1a73e8] hover:bg-[#e8f0fe] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                              title="Edit" aria-label="Edit category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                              className="p-2 text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
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
