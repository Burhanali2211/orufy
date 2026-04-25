import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Package, DollarSign, Image, Tag, Globe, Settings2 } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '@/components/Common/FormInput';
import { ImageUpload } from '@/components/Common/ImageUpload';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

interface FormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  original_price: string;
  category_id: string;
  stock: string;
  min_stock_level: string;
  sku: string;
  weight: string;
  dimensions_length: string;
  dimensions_width: string;
  dimensions_height: string;
  tags: string;
  specifications: string;
  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  meta_title: string;
  meta_description: string;
  images: string[];
}

interface FormErrors {
  [key: string]: string;
}

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  iconBg?: string;
  children: React.ReactNode;
}> = ({ title, icon, iconBg = 'bg-amber-100', children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    original_price: '',
    category_id: '',
    stock: '0',
    min_stock_level: '5',
    sku: '',
    weight: '',
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    tags: '',
    specifications: '',
    is_featured: false,
    is_active: true,
    show_on_homepage: true,
    meta_title: '',
    meta_description: '',
    images: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) fetchProduct(id);
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get<any[]>('/api/dashboard/categories');
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setFetching(true);
      const res = await apiClient.get<{data: any}>(`/api/dashboard/products/${productId}`);
      const product = res.data;
      if (product) {
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price?.toString() || '',
          original_price: product.comparePrice?.toString() || '',
          category_id: product.category || '',
          stock: product.stock?.toString() || '0',
          min_stock_level: product.min_stock_level?.toString() || '5',
          sku: product.sku || '',
          weight: product.weight?.toString() || '',
          dimensions_length: '',
          dimensions_width: '',
          dimensions_height: '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : '',
          is_featured: product.is_featured || false,
          is_active: product.isActive !== undefined ? product.isActive : true,
          show_on_homepage: product.show_on_homepage !== undefined ? product.show_on_homepage : true,
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
          images: product.imageUrls || [],
        });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load product');
      navigate('/admin/products');
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
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = 'Valid price is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (formData.stock && parseInt(formData.stock) < 0)
      newErrors.stock = 'Stock cannot be negative';
    if (
      formData.original_price &&
      parseFloat(formData.original_price) < parseFloat(formData.price)
    )
      newErrors.original_price = 'Must be greater than sale price';
    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Must be valid JSON';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const dimensions: any = {};
      if (formData.dimensions_length) dimensions.length = parseFloat(formData.dimensions_length);
      if (formData.dimensions_width) dimensions.width = parseFloat(formData.dimensions_width);
      if (formData.dimensions_height) dimensions.height = parseFloat(formData.dimensions_height);

      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      let specifications = null;
      if (formData.specifications) {
        try {
          specifications = JSON.parse(formData.specifications);
        } catch {
          throw new Error('Invalid JSON in specifications');
        }
      }

      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price)),
        comparePrice: formData.original_price ? Math.round(parseFloat(formData.original_price)) : undefined,
        stock: parseInt(formData.stock),
        sku: formData.sku || undefined,
        category: formData.category_id || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isActive: formData.is_active,
        imageUrls: Array.isArray(formData.images) ? formData.images : formData.images ? [formData.images] : [],
      };

      if (isEditMode && id) {
        await apiClient.patch(`/api/dashboard/products/${id}`, payload);
        showSuccess('Success', 'Product updated');
      } else {
        await apiClient.post('/api/dashboard/products', payload);
        showSuccess('Success', 'Product created');
      }

      navigate('/admin/products');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // Build category options with parent grouping
  const parentCategories = categories.filter(c => !c.parentId);
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...parentCategories.flatMap(parent => {
      const children = categories.filter(c => c.parentId === parent.id);
      return [
        { value: parent.id, label: parent.name },
        ...children.map(c => ({ value: c.id, label: `  ↳ ${c.name}` })),
      ];
    }),
    // categories without a known parent (edge case)
    ...categories
      .filter(c => c.parentId && !parentCategories.find(p => p.id === c.parentId))
      .map(c => ({ value: c.id, label: c.name })),
  ];

  if (fetching) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Product' : 'Add Product'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? 'Update product information' : 'Create a new product for your store'}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <Section title="Basic Information" icon={<Package className="w-4 h-4 text-amber-600" />}>
            <FormInput
              label="Product Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name || ''}
              required
              placeholder="e.g. Premium Rose Attar"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                helperText="Auto-generated from name"
                placeholder="premium-rose-attar"
              />

              <FormSelect
                label="Category *"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                error={errors.category_id || ''}
                required
                options={categoryOptions}
              />
            </div>

            <FormTextarea
              label="Short Description"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              rows={2}
              placeholder="Brief description shown in product listings"
            />

            <FormTextarea
              label="Full Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Detailed product description"
            />
          </Section>

          {/* Pricing & Stock */}
          <Section
            title="Pricing & Stock"
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormInput
                label="Sale Price (₹) *"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                error={errors.price || ''}
                required
                placeholder="0.00"
              />

              <FormInput
                label="Original Price (₹)"
                name="original_price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={handleChange}
                error={errors.original_price || ''}
                placeholder="0.00"
                helperText="Leave blank if no discount"
              />

              <FormInput
                label="Stock Qty *"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                error={errors.stock || ''}
                required
                placeholder="0"
              />

              <FormInput
                label="Low Stock Alert"
                name="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={handleChange}
                placeholder="5"
                helperText="Alert threshold"
              />

              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="PROD-001"
              />

              <FormInput
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={handleChange}
                placeholder="0.000"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dimensions (cm) — optional</p>
              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  label="Length"
                  name="dimensions_length"
                  type="number"
                  step="0.1"
                  value={formData.dimensions_length}
                  onChange={handleChange}
                  placeholder="0.0"
                />
                <FormInput
                  label="Width"
                  name="dimensions_width"
                  type="number"
                  step="0.1"
                  value={formData.dimensions_width}
                  onChange={handleChange}
                  placeholder="0.0"
                />
                <FormInput
                  label="Height"
                  name="dimensions_height"
                  type="number"
                  step="0.1"
                  value={formData.dimensions_height}
                  onChange={handleChange}
                  placeholder="0.0"
                />
              </div>
            </div>
          </Section>

          {/* Product Images */}
          <Section title="Product Images" icon={<Image className="w-4 h-4 text-blue-600" />} iconBg="bg-blue-50">
            <ImageUpload
              value={formData.images}
              onChange={images => {
                if (typeof images === 'function') {
                  setFormData(prev => {
                    const current = Array.isArray(prev.images) ? prev.images : prev.images ? [prev.images] : [];
                    const next = images(current);
                    return { ...prev, images: Array.isArray(next) ? next : [next] };
                  });
                } else {
                  setFormData(prev => ({ ...prev, images: Array.isArray(images) ? images : [images] }));
                }
              }}
              onMainImageChange={index => {
                const arr = Array.isArray(formData.images) ? formData.images : [formData.images];
                if (arr.length > 0 && index < arr.length) {
                  setFormData(prev => ({
                    ...prev,
                    images: [arr[index], ...arr.filter((_, i) => i !== index)],
                  }));
                }
              }}
              mainImageIndex={0}
              multiple
              maxFiles={10}
              folder="products"
              label="Upload Product Images"
              helperText="Upload up to 10 images. Tap any image to set it as the main photo."
            />
          </Section>

          {/* Tags & Specs */}
          <Section title="Tags & Specifications" icon={<Tag className="w-4 h-4 text-purple-600" />} iconBg="bg-purple-50">
            <FormTextarea
              label="Tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              rows={2}
              placeholder="rose, attar, alcohol-free (comma-separated)"
              helperText="Separate tags with commas"
            />

            <FormTextarea
              label="Specifications (JSON)"
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              rows={5}
              placeholder='{"brand": "Aligarh Attar House", "volume": "5ml", "type": "Pure Attar"}'
              error={errors.specifications || ''}
              helperText='Enter as JSON. Example: {"key": "value"}'
              className="font-mono text-sm"
            />
          </Section>

          {/* Display Settings */}
          <Section title="Display Settings" icon={<Settings2 className="w-4 h-4 text-gray-600" />} iconBg="bg-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FormCheckbox
                  label="Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FormCheckbox
                  label="Featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FormCheckbox
                  label="Show on Homepage"
                  name="show_on_homepage"
                  checked={formData.show_on_homepage}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO" icon={<Globe className="w-4 h-4 text-teal-600" />} iconBg="bg-teal-50">
            <FormInput
              label="Meta Title"
              name="meta_title"
              value={formData.meta_title}
              onChange={handleChange}
              placeholder="SEO title (leave empty to use product name)"
            />
            <FormTextarea
              label="Meta Description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows={2}
              placeholder="SEO description (leave empty to use short description)"
            />
          </Section>

          {/* Actions */}
          <div
            className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
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
              {isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};
