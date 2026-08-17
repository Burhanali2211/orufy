import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Package, DollarSign,
  Image, Globe, Settings2, Zap, Layers, Check
} from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';
import { ImageUpload } from '@/shared/components/Common/ImageUpload';
import { useNotification } from '@/shared/contexts/NotificationContext';
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
  tags: string;
  specifications: string;
  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  images: string[];
  attributes: string;
}

interface FormErrors {
  [key: string]: string;
}

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
    stock: '10',
    min_stock_level: '5',
    sku: '',
    tags: '',
    specifications: '',
    is_featured: false,
    is_active: true,
    show_on_homepage: true,
    images: [],
    attributes: '{}'
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
      const data = await apiClient.get('/categories');
      
      setCategories(data || []);
      if (data && data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setFetching(true);
      const product = await apiClient.get(`/products/${productId}`);
      
      if (product) {
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price?.toString() || '',
          original_price: product.original_price?.toString() || '',
          category_id: product.category_id || '',
          stock: product.stock?.toString() || '0',
          min_stock_level: product.min_stock_level?.toString() || '5',
          sku: product.sku || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          specifications: product.specifications
            ? JSON.stringify(product.specifications, null, 2)
            : '',
          is_featured: Boolean(product.is_featured),
          is_active: product.is_active !== false && product.is_active !== 'false' && product.is_active !== 0,
          show_on_homepage: product.show_on_homepage !== false && product.show_on_homepage !== 'false' && product.show_on_homepage !== 0,
          images: product.images || [],
          attributes: product.attributes ? JSON.stringify(product.attributes, null, 2) : '{}'
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

  const toggleCheckbox = (name: keyof FormData) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = 'Valid price is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (formData.stock && parseInt(formData.stock) < 0)
      newErrors.stock = 'Stock cannot be negative';
    if (formData.original_price && parseFloat(formData.original_price) < parseFloat(formData.price)) {
      newErrors.original_price = 'Original price must be greater than sale price';
    }
    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Must be valid JSON';
      }
    }
    try {
      JSON.parse(formData.attributes);
    } catch {
      newErrors.attributes = 'Invalid JSON format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

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

      const payload: Record<string, unknown> = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description || formData.short_description || undefined,
        short_description: formData.short_description || undefined,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id,
        stock: parseInt(formData.stock || '0'),
        min_stock_level: parseInt(formData.min_stock_level || '5'),
        sku: formData.sku || undefined,
        tags: tags.length > 0 ? tags : null,
        specifications,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        show_on_homepage: formData.show_on_homepage,
        images: Array.isArray(formData.images) && formData.images.length > 0
          ? formData.images
          : ['/images/collection.png'],
        attributes: JSON.parse(formData.attributes)
      };

      if (isEditMode && id) {
        await apiClient.put(`/products/${id}`, payload);
        
        showSuccess('Success', 'Product updated successfully');
      } else {
        await apiClient.post('/products', payload);
        
        showSuccess('Success', 'Product created successfully');
      }

      navigate('/admin/products');
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...parentCategories.flatMap(parent => {
      const children = categories.filter(c => c.parent_id === parent.id);
      return [
        { value: parent.id, label: parent.name },
        ...children.map(c => ({ value: c.id, label: `  ↳ ${c.name}` })),
      ];
    }),
    ...categories
      .filter(c => c.parent_id && !parentCategories.find(p => p.id === c.parent_id))
      .map(c => ({ value: c.id, label: c.name })),
  ];

  if (fetching) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Product' : 'Add Product'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? 'Update product details' : 'Create a new product in the catalog'}
    >
      <div className="max-w-7xl mx-auto pb-24">
        {/* Top Header & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-stone-500 hover:text-stone-900 transition-colors uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Main Content Column */}
          <div className="flex-1 space-y-6">
            
            {/* Basic Info */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-xl tracking-tight mb-6">Basic Details</h3>
              <div className="space-y-6">
                <FormInput
                  label="Product Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name || ''}
                  required
                  placeholder="e.g. Premium Rose Attar (6ml)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput
                    label="Slug (URL)"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    helperText="Auto-generated"
                  />
                  <FormInput
                    label="SKU Code"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="ATTAR-ROSE-001"
                  />
                </div>

                <FormTextarea
                  label="Short Summary"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Key highlights (e.g., Pure long-lasting concentrated fragrance oil)"
                />

                <FormTextarea
                  label="Full Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Detailed notes on fragrance notes, scent, ingredients..."
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-xl tracking-tight mb-6">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput
                  label="Sale Price (₹) *"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  error={errors.price || ''}
                  required
                />
                <FormInput
                  label="Original Price (₹)"
                  name="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={handleChange}
                  error={errors.original_price || ''}
                  helperText="Leave empty if no discount"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <div>
                  <FormInput
                    label="Stock Qty *"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    error={errors.stock || ''}
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    {['10', '25', '50'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, stock: val }))}
                        className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                <FormInput
                  label="Low Stock Alert"
                  name="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Media */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-xl tracking-tight mb-6">Product Images</h3>
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
                helperText="Upload up to 10 photos. Tap any photo to set as the main image."
              />
            </div>

            {/* Advanced Attributes */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-xl tracking-tight mb-6">Advanced Attributes</h3>
              <FormTextarea
                label="Attributes (JSON format)"
                name="attributes"
                value={formData.attributes}
                onChange={handleChange}
                error={errors.attributes || ''}
                rows={4}
                helperText="Advanced JSON key-value store for filtering and spec sheets."
              />
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[400px] space-y-6">
            
            {/* Category */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-lg tracking-tight mb-6">Category</h3>
              <FormSelect
                label="Select Category *"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                error={errors.category_id || ''}
                required
                options={categoryOptions}
              />
            </div>

            {/* Display Options */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-lg tracking-tight mb-6">Display Settings</h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleCheckbox('is_active')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Active</span>
                    <span className="text-xs text-stone-500 font-medium">Visible in the store</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.is_active ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCheckbox('is_featured')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Featured Product</span>
                    <span className="text-xs text-stone-500 font-medium">Highlight in Featured Collections</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.is_featured ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${formData.is_featured ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCheckbox('show_on_homepage')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Show on Homepage</span>
                    <span className="text-xs text-stone-500 font-medium">Display on landing and storefront pages</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.show_on_homepage ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${formData.show_on_homepage ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Sticky Action Footer */}
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4 px-6 lg:px-8 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              disabled={loading}
              className="px-6 py-3 text-sm font-bold tracking-wide uppercase text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 text-sm font-bold tracking-wide uppercase text-white bg-stone-900 hover:bg-stone-800 rounded-xl disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};
