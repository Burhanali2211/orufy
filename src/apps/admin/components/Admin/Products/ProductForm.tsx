import { apiClient } from '@/shared/lib/apiClient';
import React, { useEffect } from 'react';
import { Modal } from '@/shared/components/Common/Modal';
import { ImageUpload } from '@/shared/components/Common/ImageUpload';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  endpointPrefix?: string;
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Valid price is required'),
  original_price: z.coerce.number().optional(),
  category_id: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  min_stock_level: z.coerce.number().min(0).default(5),
  sku: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  images: z.array(z.string()).default([]),
  attributes: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON format').default('{}')
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSuccess, endpointPrefix = '/admin' }) => {
  const { showSuccess, showError } = useNotification();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      short_description: product?.short_description || '',
      price: product?.price ? parseFloat(product.price) : 0,
      original_price: product?.original_price ? parseFloat(product.original_price) : undefined,
      category_id: product?.category_id || '',
      stock: product?.stock || 0,
      min_stock_level: product?.min_stock_level || 5,
      sku: product?.sku || '',
      is_featured: product?.is_featured || false,
      is_active: product?.is_active !== undefined ? product.is_active : true,
      images: product?.images || [],
      attributes: product?.attributes ? JSON.stringify(product.attributes, null, 2) : '{}'
    }
  });

  const watchName = watch('name');

  useEffect(() => {
    if (!product && watchName) {
      const slug = watchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [watchName, product, setValue]);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-options'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return (res.data || []).filter((cat: Category) => cat.is_active);
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description || undefined,
        short_description: data.short_description || undefined,
        price: data.price,
        original_price: data.original_price || null,
        category_id: data.category_id || null,
        stock: data.stock,
        min_stock_level: data.min_stock_level,
        sku: data.sku || undefined,
        is_featured: data.is_featured,
        is_active: data.is_active,
        show_on_homepage: true,
        images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
        attributes: JSON.parse(data.attributes)
      };

      if (product) {
        return apiClient.put(`/products/${product.id}`, payload);
      } else {
        return apiClient.post('/products', payload);
      }
    },
    onSuccess: () => {
      showSuccess('Success', `Product ${product ? 'updated' : 'created'} successfully`);
      onSuccess();
    },
    onError: (error: Error) => {
      showError('Error', error.message || 'Failed to save product');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  {...field}
                  type="text"
                  placeholder="Enter product name"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Slug *</label>
                <input
                  {...field}
                  type="text"
                  placeholder="product-slug"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.slug ? 'border-red-300' : 'border-gray-300'}`}
                />
                <p className="text-xs text-gray-500">URL-friendly version of the name</p>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            )}
          />

          <Controller
            name="short_description"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Short Description</label>
                <textarea
                  {...field}
                  rows={2}
                  placeholder="Brief product description"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                />
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Product Description</label>
                <textarea
                  {...field}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                />
              </div>
            )}
          />
          
          <Controller
            name="attributes"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Attributes (JSON format)</label>
                <textarea
                  {...field}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.attributes ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.attributes && <p className="text-xs text-red-500">{errors.attributes.message}</p>}
              </div>
            )}
          />
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pricing & Inventory</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Price *</label>
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                </div>
              )}
            />

            <Controller
              name="original_price"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Original Price</label>
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value || ''}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                  />
                  <p className="text-xs text-gray-500">Leave empty if no discount</p>
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Controller
              name="stock"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Stock Quantity *</label>
                  <input
                    {...field}
                    type="number"
                    placeholder="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.stock ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
                </div>
              )}
            />

            <Controller
              name="min_stock_level"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                  <input
                    {...field}
                    type="number"
                    placeholder="5"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                  />
                  <p className="text-xs text-gray-500">Low stock alert threshold</p>
                </div>
              )}
            />

            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <input
                    {...field}
                    type="text"
                    placeholder="PROD-001"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                  />
                  <p className="text-xs text-gray-500">Stock Keeping Unit</p>
                </div>
              )}
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Images</h3>
          
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={(images) => {
                  if (typeof images === 'function') {
                    const currentImages = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
                    const newImages = images(currentImages);
                    field.onChange(Array.isArray(newImages) ? newImages : [newImages]);
                  } else {
                    field.onChange(Array.isArray(images) ? images : [images]);
                  }
                }}
                onMainImageChange={(index) => {
                  const imageArray = Array.isArray(field.value) ? field.value : [field.value];
                  if (imageArray.length > 0 && index < imageArray.length) {
                    const newImages = [imageArray[index], ...imageArray.filter((_, i) => i !== index)];
                    field.onChange(newImages);
                  }
                }}
                mainImageIndex={0}
                multiple={true}
                maxFiles={10}
                folder="products"
                label="Upload Product Images"
                helperText="Upload up to 10 product images. Click any image to set it as the main product image."
              />
            )}
          />
        </div>

        {/* Category & Settings */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Category & Settings</h3>

          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  {...field}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.category_id ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat: Category) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
              </div>
            )}
          />

          <div className="space-y-2 sm:space-y-3">
            <Controller
              name="is_featured"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              )}
            />
          </div>
        </div>

        {/* Form Actions - Sticky on mobile */}
        <div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 pb-4 sm:pb-0 px-4 sm:px-0 -mx-4 sm:mx-0 border-t border-gray-200 bg-white sm:bg-transparent">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-11 sm:min-h-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-11 sm:min-h-auto"
          >
            <span>{product ? 'Update Product' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
