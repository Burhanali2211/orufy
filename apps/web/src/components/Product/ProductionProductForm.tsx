import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Upload, Video, Tag, DollarSign, Package, Star, Info, Plus, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ImageUpload } from '../Common/ImageUpload';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  sale_price?: number;
  compare_at_price?: number;
  cost_price?: number;
  sku: string;
  barcode?: string;
  category_id: string;
  brand: string;
  model?: string;
  weight?: number;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
  };
  color_variants: string[];
  size_variants: string[];
  material?: string;
  care_instructions?: string;
  warranty_info?: string;
  return_policy?: string;
  shipping_info: {
    weight?: number;
    dimensions?: string;
    free_shipping?: boolean;
    shipping_class?: string;
  };
  seo_title?: string;
  seo_description?: string;
  seo_keywords: string[];
  featured_image_url?: string;
  gallery_images: string[];
  video_url?: string;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  discount_percentage: number;
  tags: string[];
  inventory_quantity: number;
  inventory_policy: 'deny' | 'continue';
  track_inventory: boolean;
}

interface ProductionProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export const ProductionProductForm: React.FC<ProductionProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories
}) => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    sku: '',
    category_id: '',
    brand: '',
    dimensions: {},
    color_variants: [],
    size_variants: [],
    shipping_info: {
      free_shipping: false,
      shipping_class: 'standard'
    },
    seo_keywords: [],
    gallery_images: [],
    is_active: true,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    discount_percentage: 0,
    tags: [],
    inventory_quantity: 0,
    inventory_policy: 'deny',
    track_inventory: true,
    ...(initialData || {})
  });

  // Auto-generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, []);

  // Handle form field changes
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === 'name' && !initialData?.slug) {
        newData.slug = generateSlug(value);
      }

      // Auto-generate SEO title when name changes
      if (field === 'name' && !initialData?.seo_title) {
        newData.seo_title = value;
      }

      // Calculate discount percentage when prices change
      if ((field === 'price' || field === 'sale_price') && newData.price && newData.sale_price) {
        newData.discount_percentage = Math.round(((newData.price - newData.sale_price) / newData.price) * 100);
      }

      return newData;
    });
  }, [generateSlug, initialData]);

  // Handle array field changes
  const handleArrayChange = useCallback((field: string, value: string) => {
    if (!value.trim()) return;

    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof ProductFormData] as string[], value.trim()]
    }));
  }, []);

  // Remove array item
  const removeArrayItem = useCallback((field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof ProductFormData] as string[]).filter((_, i) => i !== index)
    }));
  }, []);

  // Combine featured image and gallery images for ImageUpload component
  const allImages = formData.featured_image_url 
    ? [formData.featured_image_url, ...formData.gallery_images.filter(img => img !== formData.featured_image_url)]
    : formData.gallery_images;

  // Get main image index (featured image is always first)
  const mainImageIndex = formData.featured_image_url ? 0 : -1;

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Product name is required'
      });
      return;
    }

    if (!formData.price || formData.price <= 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Valid price is required'
      });
      return;
    }

    if (!formData.category_id) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Category is required'
      });
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);

      showNotification({
        type: 'success',
        title: 'Product Saved',
        message: `Product "${formData.name}" has been saved successfully`
      });

      onClose();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save product. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, onClose, showNotification]);

  const steps = [
    { id: 1, name: 'Basic Info', icon: Info },
    { id: 2, name: 'Pricing', icon: DollarSign },
    { id: 3, name: 'Inventory', icon: Package },
    { id: 4, name: 'Media', icon: Upload },
    { id: 5, name: 'SEO', icon: Star }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background-primary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-primary">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {initialData ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-text-secondary mt-1">
                {initialData ? 'Update product information' : 'Create a new product for your store'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between p-6 bg-background-secondary">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentStep === step.id
                    ? 'bg-primary-600 text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                    }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-border-primary mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleChange('slug', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="product-url-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Short Description
                    </label>
                    <textarea
                      value={formData.short_description}
                      onChange={(e) => handleChange('short_description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief product description for listings"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Full Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Detailed product description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => handleChange('category_id', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Model number"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Pricing */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Regular Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Sale Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sale_price || ''}
                        onChange={(e) => handleChange('sale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Compare at Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.compare_at_price || ''}
                        onChange={(e) => handleChange('compare_at_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                      <p className="text-sm text-text-secondary mt-1">
                        Original price before discount
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Cost Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_price || ''}
                        onChange={(e) => handleChange('cost_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                      <p className="text-sm text-text-secondary mt-1">
                        Your cost (for profit calculations)
                      </p>
                    </div>
                  </div>

                  {formData.discount_percentage > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {formData.discount_percentage}% Discount
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Customers save ₹{(formData.price - (formData.sale_price || formData.price)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Inventory */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Product SKU"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                        className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Product barcode"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="track_inventory"
                        checked={formData.track_inventory}
                        onChange={(e) => handleChange('track_inventory', e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-background-secondary border-border-primary rounded focus:ring-primary-500"
                      />
                      <label htmlFor="track_inventory" className="text-sm font-medium text-text-primary">
                        Track inventory quantity
                      </label>
                    </div>

                    {formData.track_inventory && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Inventory Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inventory_quantity}
                            onChange={(e) => handleChange('inventory_quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            When out of stock
                          </label>
                          <select
                            value={formData.inventory_policy}
                            onChange={(e) => handleChange('inventory_policy', e.target.value)}
                            className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="deny">Stop selling</option>
                            <option value="continue">Continue selling</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-text-primary">Product Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => handleChange('is_active', e.target.checked)}
                          className="w-4 h-4 text-primary-600 bg-background-secondary border-border-primary rounded focus:ring-primary-500"
                        />
                        <label htmlFor="is_active" className="text-sm text-text-primary">
                          Active
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) => handleChange('is_featured', e.target.checked)}
                          className="w-4 h-4 text-primary-600 bg-background-secondary border-border-primary rounded focus:ring-primary-500"
                        />
                        <label htmlFor="is_featured" className="text-sm text-text-primary">
                          Featured
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_bestseller"
                          checked={formData.is_bestseller}
                          onChange={(e) => handleChange('is_bestseller', e.target.checked)}
                          className="w-4 h-4 text-primary-600 bg-background-secondary border-border-primary rounded focus:ring-primary-500"
                        />
                        <label htmlFor="is_bestseller" className="text-sm text-text-primary">
                          Bestseller
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_new_arrival"
                          checked={formData.is_new_arrival}
                          onChange={(e) => handleChange('is_new_arrival', e.target.checked)}
                          className="w-4 h-4 text-primary-600 bg-background-secondary border-border-primary rounded focus:ring-primary-500"
                        />
                        <label htmlFor="is_new_arrival" className="text-sm text-text-primary">
                          New Arrival
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Media */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Product Images
                    </label>
                    <ImageUpload
                      value={allImages}
                      onChange={(images) => {
                        const imageArray = Array.isArray(images) ? images : [images];
                        if (imageArray.length > 0) {
                          // First image is featured, rest are gallery
                          handleChange('featured_image_url', imageArray[0]);
                          handleChange('gallery_images', imageArray.slice(1));
                        } else {
                          handleChange('featured_image_url', '');
                          handleChange('gallery_images', []);
                        }
                      }}
                      onMainImageChange={(index) => {
                        const imageArray = Array.isArray(allImages) ? allImages : [allImages];
                        if (imageArray.length > 0 && index < imageArray.length) {
                          // Reorder so selected image is first (featured)
                          const newImages = [imageArray[index], ...imageArray.filter((_, i) => i !== index)];
                          handleChange('featured_image_url', newImages[0]);
                          handleChange('gallery_images', newImages.slice(1));
                        }
                      }}
                      mainImageIndex={mainImageIndex >= 0 ? 0 : -1}
                      multiple={true}
                      maxFiles={10}
                      folder="products"
                      label="Upload Product Images"
                      helperText="Upload up to 10 product images. Click any image to set it as the main/featured product image."
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Product Video URL
                    </label>
                    <input
                      type="url"
                      value={formData.video_url || ''}
                      onChange={(e) => handleChange('video_url', e.target.value)}
                      className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-sm text-text-secondary mt-1">
                      YouTube, Vimeo, or direct video URL
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 5: SEO */}
              {currentStep === 5 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title || ''}
                      onChange={(e) => handleChange('seo_title', e.target.value)}
                      className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SEO optimized title"
                      maxLength={60}
                    />
                    <p className="text-sm text-text-secondary mt-1">
                      {(formData.seo_title || '').length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      SEO Description
                    </label>
                    <textarea
                      value={formData.seo_description || ''}
                      onChange={(e) => handleChange('seo_description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SEO meta description"
                      maxLength={160}
                    />
                    <p className="text-sm text-text-secondary mt-1">
                      {(formData.seo_description || '').length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tags', index)}
                            className="hover:text-primary-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag"
                        className="flex-1 px-4 py-2 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              handleArrayChange('tags', input.value);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleArrayChange('tags', input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border-primary bg-background-secondary">
              <div className="flex items-center gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Previous
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Product
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
