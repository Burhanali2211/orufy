import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, categories } = useProducts();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Initialize default values
  const defaultCategory = categories?.[0]?.name ?? '';
  const defaultCategoryId = categories?.[0]?.id ?? '';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    originalPrice: 0,
    category: defaultCategory,
    categoryId: defaultCategoryId,
    stock: 0,
    minStockLevel: 5,
    sku: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: ['https://images.unsplash.com/photo-1588964895597-cf29151f7199?w=400&h=400&fit=crop'],
    tags: [] as string[],
    specifications: {} as Record<string, string>,
    featured: false,
    showOnHomepage: true,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug || '',
        description: product.description,
        shortDescription: product.shortDescription || '',
        price: product.price,
        originalPrice: product.originalPrice || 0,
        category: product.category || (categories?.[0]?.name ?? ''),
        categoryId: product.categoryId || (categories?.[0]?.id ?? ''),
        stock: product.stock,
        minStockLevel: product.minStockLevel || 5,
        sku: product.sku || '',
        weight: product.weight || 0,
        dimensions: {
          length: product.dimensions?.length || 0,
          width: product.dimensions?.width || 0,
          height: product.dimensions?.height || 0
        },
        images: product.images || [],
        tags: product.tags || [],
        specifications: (product.specifications as Record<string, string>) || {},
        featured: product.featured || false,
        showOnHomepage: product.showOnHomepage !== false,
        isActive: product.isActive !== false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        category: categories?.[0]?.name ?? '',
        categoryId: categories?.[0]?.id ?? ''
      }));
    }
  }, [product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'category') {
      const selectedCategory = categories.find(c => c.name === value);
      setFormData(prev => ({ 
        ...prev, 
        category: value,
        categoryId: selectedCategory?.id || ''
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagChange = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || !formData.description.trim() || formData.price <= 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields correctly.' });
      return;
    }

    const productData: any = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      stock: Number(formData.stock),
      minStockLevel: Number(formData.minStockLevel),
      weight: Number(formData.weight),
      dimensions: {
        length: Number(formData.dimensions.length),
        width: Number(formData.dimensions.width),
        height: Number(formData.dimensions.height)
      },
      sellerId: user.id,
      sellerName: user.name || user.email || 'Unknown Seller',
      rating: product?.rating || 0,
      reviewCount: product?.reviewCount || 0,
      reviews: product?.reviews || [],
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (product) {
      updateProduct(product.id, productData);
      showNotification({ type: 'success', title: 'Product Updated', message: `${product.name} has been updated.` });
    } else {
      addProduct?.(productData);
      showNotification({ type: 'success', title: 'Product Added', message: `${formData.name} has been added.` });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
      <div className="bg-white p-6 rounded-luxury border border-stone-100 shadow-subtle">
        <h3 className="text-lg font-serif font-semibold mb-6 text-stone-900 border-b border-stone-50 pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full input-field" placeholder="Product name" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">SKU *</label>
            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full input-field" placeholder="SKU" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full input-field" required>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Weight (kg) *</label>
            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full input-field" required step="0.001" />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Short Description *</label>
          <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="w-full input-field" placeholder="Short description" required />
        </div>
        <div className="mt-6">
          <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Full Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full input-field" placeholder="Detailed product description" required />
        </div>
      </div>

      <div className="bg-white p-6 rounded-luxury border border-stone-100 shadow-subtle">
        <h3 className="text-lg font-serif font-semibold mb-6 text-stone-900 border-b border-stone-50 pb-2">Pricing & Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Price *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full input-field" required step="0.01" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Original Price</label>
            <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className="w-full input-field" step="0.01" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Stock *</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full input-field" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">Min Alert</label>
            <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} className="w-full input-field" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-luxury border border-stone-100 shadow-subtle">
        <h3 className="text-lg font-serif font-semibold mb-6 text-stone-900 border-b border-stone-50 pb-2">Tags & Visibility</h3>
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest font-semibold text-stone-500 mb-4">Attributes</label>
          <div className="flex flex-wrap gap-2">
            {['trending', 'bestseller', 'new', 'sale', 'premium', 'limited'].map(tag => (
              <button 
                key={tag} 
                type="button" 
                onClick={() => handleTagChange(tag)} 
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                  formData.tags.includes(tag) 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'bg-stone-50 text-stone-400 border border-stone-100 hover:text-stone-600 hover:border-stone-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-10">
          <label className="flex items-center cursor-pointer group">
            <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.featured ? 'bg-stone-900' : 'bg-stone-200'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.featured ? 'translate-x-5' : ''}`} />
            </div>
            <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} className="hidden" />
            <span className="ml-3 text-xs uppercase tracking-widest font-semibold text-stone-600 group-hover:text-stone-900 transition-colors">Featured</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.showOnHomepage ? 'bg-stone-900' : 'bg-stone-200'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.showOnHomepage ? 'translate-x-5' : ''}`} />
            </div>
            <input type="checkbox" name="showOnHomepage" checked={formData.showOnHomepage} onChange={handleChange} className="hidden" />
            <span className="ml-3 text-xs uppercase tracking-widest font-semibold text-stone-600 group-hover:text-stone-900 transition-colors">Home Page</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-stone-100">
        <button type="button" onClick={onClose} className="h-14 px-10 rounded-full text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-widest text-[10px] font-bold">
          Discard
        </button>
        <button type="submit" className="h-14 px-12 bg-stone-900 text-white rounded-full shadow-luxury hover:bg-stone-800 transition-all uppercase tracking-widest text-[10px] font-bold">
          {product ? 'Commit Changes' : 'Curate Product'}
        </button>
      </div>
    </form>
  );
};
