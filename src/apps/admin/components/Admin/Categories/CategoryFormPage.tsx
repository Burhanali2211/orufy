import { apiClient } from '@/shared/lib/apiClient';
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/shared/components/Common/ImageUpload';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().min(0, 'Sort order cannot be negative').default(0),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const CategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const { showSuccess, showError } = useNotification();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: '',
      sort_order: 0,
      is_active: true,
    }
  });

  const watchName = watch('name');

  useEffect(() => {
    if (!isEditMode && watchName) {
      const slug = watchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [watchName, isEditMode, setValue]);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-options'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.filter((cat: any) => cat.is_active !== false && cat.id !== id);
    }
  });

  const { isLoading: fetchingCategory } = useQuery({
    queryKey: ['admin-category', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/categories/${id}`);
      return res?.data || res;
    },
    enabled: isEditMode,
  });

  // Use useEffect to set form values after fetching to avoid infinite re-renders or missing form values
  useEffect(() => {
      const fetchCat = async () => {
          try {
              const res = await apiClient.get(`/categories/${id}`);
              const category = res.data;
              if (category) {
                  setValue('name', category.name || '');
                  setValue('slug', category.slug || '');
                  setValue('description', category.description || '');
                  setValue('image_url', category.image_url || '');
                  setValue('parent_id', category.parent_id || '');
                  setValue('sort_order', category.sort_order ?? 0);
                  setValue('is_active', category.is_active !== undefined ? category.is_active : true);
              }
          } catch (error: any) {
              showError('Error', error?.message || 'Failed to load category');
              navigate('/admin/categories');
          }
      };
      if (isEditMode) {
          fetchCat();
      }
  }, [id, isEditMode, setValue, showError, navigate]);


  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: data.image_url || null,
        parent_id: data.parent_id || null,
        sort_order: data.sort_order,
        is_active: data.is_active,
      };

      if (isEditMode) {
        return apiClient.put(`/categories/${id}`, payload);
      } else {
        return apiClient.post('/categories', payload);
      }
    },
    onSuccess: () => {
      showSuccess('Success', `Category ${isEditMode ? 'updated' : 'created'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-options'] });
      navigate('/admin/categories');
    },
    onError: (error: Error) => {
      showError('Error', error.message || 'Failed to save category');
    }
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  if (fetchingCategory) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Category' : 'Add Category'}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 text-sm">Loading category...</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Category' : 'Add New Category'}
      subtitle={isEditMode ? 'Update category information' : 'Create a new product category'}
    >
      <div className="max-w-6xl mx-auto pb-24">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/categories')}
            className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-gray-500 hover:text-stone-900 transition-colors uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Column */}
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-stone-900 mb-6 tracking-tight">Basic Information</h2>

              <div className="space-y-6">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Category Name *</label>
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g. Attars & Perfumes"
                        className={`w-full px-4 py-3 bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors ${errors.name ? 'border-red-300' : 'border-stone-200'}`}
                      />
                      {errors.name?.message && <p className="text-xs font-medium text-red-500">{String(errors.name.message)}</p>}
                    </div>
                  )}
                />

                <div className="space-y-6">
                  <Controller
                    name="slug"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Slug *</label>
                        <input
                          {...field}
                          type="text"
                          placeholder="attars-perfumes"
                          className={`w-full px-4 py-3 bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors ${errors.slug ? 'border-red-300' : 'border-stone-200'}`}
                        />
                        <p className="text-xs text-stone-400 font-medium">URL-friendly name</p>
                        {errors.slug?.message && <p className="text-xs font-medium text-red-500">{String(errors.slug.message)}</p>}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Description</label>
                      <textarea
                        {...field}
                        rows={4}
                        placeholder="Brief description of this category"
                        className={`w-full px-4 py-3 bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors resize-none ${errors.description ? 'border-red-300' : 'border-stone-200'}`}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[380px] space-y-6">
            {/* Category Image */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-stone-900 mb-6 tracking-tight">Category Image</h2>
              
              <Controller
                name="image_url"
                control={control}
                render={({ field }) => (
                  <div className="space-y-5">
                    <ImageUpload
                      value={field.value || ''}
                      onChange={(image) => {
                        if (typeof image === 'function') return;
                        field.onChange(Array.isArray(image) ? image[0] : image);
                      }}
                      multiple={false}
                      label="Upload Image"
                      folder="categories"
                    />
                  </div>
                )}
              />
            </div>

            {/* Hierarchy & Settings */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-stone-900 mb-6 tracking-tight">Settings</h2>

              <div className="space-y-6">
                <Controller
                  name="parent_id"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Parent Category</label>
                      <select
                        {...field}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors appearance-none"
                      >
                        <option value="">None — Top Level</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                />

                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-4 p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${field.value ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                        {field.value && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="hidden"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-900">Active</span>
                        <span className="text-xs text-stone-500 font-medium">Visible on the store</span>
                      </div>
                    </label>
                  )}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-40 bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 px-6 lg:px-8 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => navigate('/admin/categories')}
            disabled={mutation.isPending}
            className="px-6 py-3 text-sm font-bold tracking-wide uppercase text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="px-8 py-3 text-sm font-bold tracking-wide uppercase text-white bg-stone-900 hover:bg-stone-800 rounded-xl disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isEditMode ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};
