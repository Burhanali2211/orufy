import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Tag, Image } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '../../Common/FormInput';
import { ImageUpload } from '../../Common/ImageUpload';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

interface FormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string;
  sort_order: string;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const CategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    sort_order: '0',
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) fetchCategory(id);
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<any>('/api/dashboard/categories');
      const data = res?.data || res || [];
      const available = isEditMode && id
        ? data.filter((cat: any) => cat.id !== id)
        : data;
      setCategories(available);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCategory = async (categoryId: string) => {
    try {
      setFetching(true);
      const res = await apiClient.get<any>(`/api/dashboard/categories/${categoryId}`);
      const category = res?.data || res;
      if (category) {
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image_url: category.image_url || category.imageUrl || '',
          parent_id: category.parent_id || category.parentId || '',
          sort_order: (category.sort_order ?? category.sortOrder ?? 0).toString(),
          is_active: category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true),
        });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load category');
      navigate('/admin/categories');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'name' && !isEditMode) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (formData.sort_order && parseInt(formData.sort_order) < 0)
      newErrors.sort_order = 'Sort order cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        imageUrl: formData.image_url || null,
        parentId: formData.parent_id || null,
        sortOrder: parseInt(formData.sort_order) || 0,
        isActive: formData.is_active,
      };

      if (isEditMode && id) {
        await apiClient.patch(`/api/dashboard/categories/${id}`, payload);
        showSuccess('Success', 'Category updated');
      } else {
        await apiClient.post('/api/dashboard/categories', payload);
        showSuccess('Success', 'Category created');
      }

      navigate('/admin/categories');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Category' : 'Add Category'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Category' : 'Add New Category'}
      subtitle={isEditMode ? 'Update category information' : 'Create a new product category'}
    >
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/categories')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Basic Information</h2>
            </div>

            <FormInput
              label="Category Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name || ''}
              required
              placeholder="e.g. Attars & Perfumes"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Slug *"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                error={errors.slug || ''}
                required
                helperText="URL-friendly name (auto-generated)"
                placeholder="attars-perfumes"
              />

              <FormInput
                label="Sort Order"
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleChange}
                error={errors.sort_order || ''}
                placeholder="0"
                helperText="Lower = appears first"
              />
            </div>

            <FormTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of this category"
            />
          </div>

          {/* Category Image */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Category Image</h2>
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={image => {
                if (typeof image === 'function') return;
                const imageUrl = Array.isArray(image) ? image[0] : image;
                setFormData(prev => ({ ...prev, image_url: (imageUrl as string) || '' }));
              }}
              multiple={false}
              label="Upload Image"
              helperText="Or enter an image URL below"
              folder="categories"
            />

            <FormInput
              label="Image URL"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              helperText="Direct link to category image"
            />
          </div>

          {/* Hierarchy & Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
              Hierarchy & Settings
            </h2>

            <FormSelect
              label="Parent Category"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'None — Top Level Category' },
                ...categories
                  .filter(cat => cat.is_active)
                  .map(cat => ({ value: cat.id, label: cat.name })),
              ]}
              helperText="Select a parent to make this a sub-category"
            />

            <FormCheckbox
              label="Active (visible on the store)"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-0 pt-4 pb-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              disabled={loading}
              className="px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {isEditMode ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};
