import { apiClient } from '@/shared/lib/apiClient';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, FolderPlus, AlertCircle, X, Check
} from 'lucide-react';
import { FormInput, FormTextarea, FormSelect } from '@/shared/components/Common/FormInput';
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
}

interface FormErrors {
  [key: string]: string;
}

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const formRef = useRef<HTMLFormElement>(null);

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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Quick Category creation state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catModalError, setCatModalError] = useState('');

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) fetchProduct(id);
  }, [id, isEditMode]);

  const fetchCategories = async (selectCatId?: string) => {
    try {
      const res = await apiClient.get('/admin/categories');
      const data = Array.isArray(res) ? res : (res?.data || []);
      
      setCategories(data);
      if (selectCatId) {
        setFormData(prev => ({ ...prev, category_id: selectCatId }));
        setErrors(prev => ({ ...prev, category_id: '' }));
      } else if (data && data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleOpenCategoryModal = () => {
    const token = apiClient.getToken();
    if (!token) {
      showError('Session Expired', 'Please log in again to continue.');
      navigate('/auth');
      return;
    }
    setCatModalError('');
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = apiClient.getToken();
    if (!token) {
      setCatModalError('Problem: Session expired (No token found). Where: Account login. What to do: Please log in again.');
      return;
    }

    if (!newCatName.trim()) {
      setCatModalError('Problem: Category name is empty. Where: Category Name input field. What to do: Please type a category name.');
      return;
    }

    try {
      setCreatingCat(true);
      setCatModalError('');
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const created = await apiClient.post('/admin/categories', {
        name: newCatName.trim(),
        slug,
        description: newCatDescription.trim() || null,
        is_active: true,
      });

      const newId = created?.id || created?.data?.id;
      setNewCatName('');
      setNewCatDescription('');
      setIsCategoryModalOpen(false);

      // Re-fetch categories and select the new one
      await fetchCategories(newId);
    } catch (err: any) {
      console.error("CATEGORY CREATE ERROR:", err, "Status:", err?.status);
      if (err?.status === 401 || err?.message?.toLowerCase().includes('log in') || err?.message?.toLowerCase().includes('session')) {
        setCatModalError(`Problem: Session expired (API 401). Raw Error: ${err?.message}. Status: ${err?.status}. Where: Account login. What to do: Please log in again.`);
      } else {
        setCatModalError(`Problem: ${err?.message || 'Could not save category'}. Where: Category form. What to do: Please open the full Category Page.`);
      }
    } finally {
      setCreatingCat(false);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setFetching(true);
      const product = await apiClient.get(`/admin/products/${productId}`);
      
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

  const validate = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid sale price greater than 0 is required';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category (or add a new one)';
    }
    if (formData.stock === '' || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock quantity cannot be negative';
    }
    if (formData.original_price && parseFloat(formData.original_price) < parseFloat(formData.price)) {
      newErrors.original_price = 'Original price must be greater than sale price';
    }
    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Specifications must be valid JSON format';
      }
    }
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const scrollToFirstError = (newErrors: FormErrors) => {
    const firstErrorKey = Object.keys(newErrors)[0];
    if (!firstErrorKey) return;

    const errorMsgList = Object.values(newErrors).join(' • ');
    showError('Validation Required', `Please fix: ${errorMsgList}`);

    setTimeout(() => {
      const targetEl = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(firstErrorKey);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (targetEl as HTMLElement).focus?.();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = apiClient.getToken();
    if (!token) {
      showError('Session Expired', 'Please log in again in a new tab, then return here to save your changes.');
      return;
    }

    const { isValid, newErrors } = validate();
    
    if (!isValid) {
      scrollToFirstError(newErrors);
      return;
    }

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
        attributes: {}
      };

      if (isEditMode && id) {
        await apiClient.put(`/admin/products/${id}`, payload);
        showSuccess('Success', 'Product updated successfully');
      } else {
        await apiClient.post('/admin/products', payload);
        showSuccess('Success', 'Product created successfully');
      }

      navigate('/admin/products');
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const parentCategories = safeCategories.filter(c => !c.parent_id);
  const categoryOptions = [
    { value: '', label: safeCategories.length === 0 ? '-- No categories created --' : 'Select a category' },
    ...parentCategories.flatMap(parent => {
      const children = safeCategories.filter(c => c.parent_id === parent.id);
      return [
        { value: parent.id, label: parent.name },
        ...children.map(c => ({ value: c.id, label: `  ↳ ${c.name}` })),
      ];
    }),
    ...safeCategories
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

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AdminDashboardLayout
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? 'Update product details' : 'Create a new product in the catalog'}
    >
      <div className="max-w-7xl mx-auto pb-32">
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

        {/* Global Error Summary Banner */}
        {hasErrors && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-md p-4 sm:p-5 flex items-start gap-4 text-red-900 shadow-sm ">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-extrabold text-red-900 text-sm uppercase tracking-wide">
                Please complete the required fields below
              </h4>
              <ul className="mt-2 text-xs font-semibold text-red-700 list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, msg]) => (
                  <li key={field}>
                    <span className="capitalize">{field.replace('_', ' ')}:</span> {msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Main Content Column */}
          <div className="flex-1 space-y-6">
            
            {/* Basic Info */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8">
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
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8">
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
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8">
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

          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[400px] space-y-6">
            
            {/* Category */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-extrabold text-stone-900 text-lg tracking-tight">Category *</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/categories/add')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-2 rounded-md transition-colors whitespace-nowrap"
                  >
                    <span>Manage</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCategoryModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-md transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Add</span>
                  </button>
                </div>
              </div>

              {safeCategories.length === 0 ? (
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-md text-center space-y-4">
                  <p className="text-sm font-semibold text-stone-600">
                    No categories exist yet.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/admin/categories/add')}
                      className="w-full py-2.5 px-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Manage Categories</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCategoryModal}
                      className="w-full py-2.5 px-3 bg-white border border-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-stone-50 transition-colors whitespace-nowrap"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              ) : (
                <FormSelect
                  label=""
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  error={errors.category_id || ''}
                  required
                  options={categoryOptions}
                />
              )}
            </div>

            {/* Display Options */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8">
              <h3 className="font-extrabold text-stone-900 text-lg tracking-tight mb-6">Display Settings</h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleCheckbox('is_active')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-md hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Active</span>
                    <span className="text-xs text-stone-500 font-medium">Visible in the store</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.is_active ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCheckbox('is_featured')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-md hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Featured Product</span>
                    <span className="text-xs text-stone-500 font-medium">Highlight in Featured Collections</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.is_featured ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${formData.is_featured ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCheckbox('show_on_homepage')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-md hover:bg-stone-50 hover:border-stone-300 transition-all text-left group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-stone-900">Show on Homepage</span>
                    <span className="text-xs text-stone-500 font-medium">Display on landing and storefront pages</span>
                  </div>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.show_on_homepage ? 'bg-stone-900' : 'bg-stone-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${formData.show_on_homepage ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Sticky Action Footer */}
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white border-t border-stone-200 p-4 px-6 lg:px-8 flex items-center justify-between gap-3 shadow-sm">
            <div className="text-xs font-semibold text-stone-500">
              {hasErrors ? (
                <span className="text-red-600 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Please resolve {Object.keys(errors).length} highlighted error(s) above
                </span>
              ) : (
                <span>Fill in details and click publish</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                disabled={loading}
                className="px-6 py-3 text-sm font-bold tracking-wide uppercase text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-md disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 text-sm font-bold tracking-wide uppercase text-white bg-stone-900 hover:bg-stone-800 rounded-md disabled:opacity-50 transition-all shadow-sm  flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm ">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-lg border border-stone-200 relative">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setCatModalError('');
              }}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-stone-100 text-stone-900 rounded-md">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg tracking-tight">Add New Category</h3>
                <p className="text-xs text-stone-500">Quickly create a category for your product</p>
              </div>
            </div>

            {catModalError && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Category Creation Issue</span>
                </div>
                <p className="leading-relaxed">{catModalError}</p>
                
                <div className="pt-2 flex flex-wrap gap-2">
                  {catModalError.includes('log in') && (
                    <button
                      type="button"
                      onClick={() => navigate('/auth')}
                      className="px-3 py-1.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition-colors"
                    >
                      Log In Again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      navigate('/admin/categories/add');
                    }}
                    className="px-3 py-1.5 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Open Category Page
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <FormInput
                label="Category Name *"
                name="newCatName"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Attars & Perfumes"
                required
              />

              <FormTextarea
                label="Description (Optional)"
                name="newCatDescription"
                value={newCatDescription}
                onChange={e => setNewCatDescription(e.target.value)}
                rows={3}
                placeholder="Brief category summary..."
              />

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={creatingCat}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors flex items-center gap-2"
                >
                  {creatingCat ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

