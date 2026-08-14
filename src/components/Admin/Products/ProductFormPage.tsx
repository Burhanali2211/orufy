import { apiClient } from '@/lib/apiClient';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Package, DollarSign,
  Image, Tag, Globe, Settings2, Zap, Layers, Plus, Check
} from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '../../Common/FormInput';
import { ImageUpload } from '../../Common/ImageUpload';
import { supabase } from '../../../lib/legacyDb';
import { useNotification } from '../../../contexts/NotificationContext';
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
  attributes: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');

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
      const { data: product, error } = await apiClient.get('/products');
      
      if (product) {
        const dimensions = product.dimensions || {};
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
          weight: product.weight?.toString() || '',
          dimensions_length: dimensions.length?.toString() || '',
          dimensions_width: dimensions.width?.toString() || '',
          dimensions_height: dimensions.height?.toString() || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          specifications: product.specifications
            ? JSON.stringify(product.specifications, null, 2)
            : '',
          is_featured: product.is_featured || false,
          is_active: product.is_active !== undefined ? product.is_active : true,
          show_on_homepage:
            product.show_on_homepage !== undefined ? product.show_on_homepage : true,
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
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
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description || formData.short_description || undefined,
        short_description: formData.short_description || undefined,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id,
        stock: parseInt(formData.stock || '0'),
        min_stock_level: parseInt(formData.min_stock_level || '5'),
        sku: formData.sku || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : null,
        tags: tags.length > 0 ? tags : null,
        specifications,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        show_on_homepage: formData.show_on_homepage,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
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
      showError('Error', error.message || 'Failed to save product');
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
          <></>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? 'Update product details' : 'Fast mobile-first product entry'}
    >
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Products</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'quick'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Quick Add
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'full'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All Details
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* QUICK ADD TAB (Essential Fields Only) */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Product Basic Info Card */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">Essential Product Details</h3>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">Core information shown in the customer storefront</p>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200/60 px-2.5 py-1 rounded-md">Step 1 of 2</span>
                </div>

                <FormInput
                  label="Product Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name || ''}
                  required
                  placeholder="e.g. Premium Rose Attar (6ml)"
                  className="text-base"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormSelect
                    label="Category *"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    error={errors.category_id || ''}
                    required
                    options={categoryOptions}
                  />

                  <FormInput
                    label="Sale Price (₹) *"
                    name="price"
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={handleChange}
                    error={errors.price || ''}
                    required
                    placeholder="e.g. 499"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Original Price (₹)"
                    name="original_price"
                    type="number"
                    step="1"
                    value={formData.original_price}
                    onChange={handleChange}
                    placeholder="e.g. 699 (optional)"
                  />

                  <div>
                    <FormInput
                      label="Stock Qty *"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                      error={errors.stock || ''}
                      required
                      placeholder="10"
                    />
                    {/* Fast increment buttons for mobile admins */}
                    <div className="flex gap-1.5 mt-1.5">
                      {['10', '25', '50', '100'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, stock: val }))}
                          className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-600 rounded font-semibold transition-colors"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                    <Image className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">Product Images</h3>
                </div>

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
                  maxFiles={6}
                  folder="products"
                  label="Add Product Photos"
                  helperText="Tap photo to set as main image"
                />
              </div>

              {/* Short Description */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <FormTextarea
                  label="Short Summary"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Key highlights (e.g., Pure long-lasting concentrated fragrance oil)"
                />
              </div>
            </div>
          )}

          {/* ALL DETAILS TAB */}
          {activeTab === 'full' && (
            <div className="space-y-4">
              {/* Full Basic Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 text-base pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" /> Basic Details
                </h3>

                <FormInput
                  label="Product Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name || ''}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Slug (URL)"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    helperText="Auto-generated"
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
                  label="Full Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Detailed notes on fragrance notes, scent, ingredients..."
                />

                <FormTextarea
                  label="Attributes (JSON format)"
                  name="attributes"
                  value={formData.attributes}
                  onChange={handleChange}
                  error={errors.attributes || ''}
                  rows={4}
                />
              </div>

              {/* Full Pricing & Stock */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 text-base pb-2 border-b border-gray-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Pricing & Inventory
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
                  />

                  <FormInput
                    label="Stock *"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    error={errors.stock || ''}
                    required
                  />

                  <FormInput
                    label="Low Stock Alert"
                    name="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="SKU Code"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="ATTAR-ROSE-001"
                  />

                  <FormInput
                    label="Weight (kg)"
                    name="weight"
                    type="number"
                    step="0.001"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Full Images */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-gray-900 text-base pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-600" /> Images
                </h3>
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
                />
              </div>

              {/* Tags & Settings */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 text-base pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-600" /> Options & Display
                </h3>

                <FormTextarea
                  label="Tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  rows={2}
                  placeholder="rose, attar, luxury, wood, unisex"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <FormCheckbox
                      label="Active (Visible in Store)"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <FormCheckbox
                      label="Featured Product"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <FormCheckbox
                      label="Show on Homepage"
                      name="show_on_homepage"
                      checked={formData.show_on_homepage}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-gray-900 text-base pb-2 border-b border-gray-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" /> Search Engine Optimization (SEO)
                </h3>
                <FormInput
                  label="Meta Title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder="Custom search result title"
                />
                <FormTextarea
                  label="Meta Description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Custom search result summary"
                />
              </div>
            </div>
          )}

          {/* Sticky Action Footer (Mobile First) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:px-8 flex items-center justify-end gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[46px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm"
            >
              {loading ? (
                <></>
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};
