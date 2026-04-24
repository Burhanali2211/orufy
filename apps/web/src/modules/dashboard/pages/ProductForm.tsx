import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';

interface ProductFormState {
  name: string;
  description: string;
  price: string;        // ₹, user input
  comparePrice: string; // ₹, user input
  stock: string;
  category: string;
  sku: string;
  isActive: boolean;
  images: string[];
}

const EMPTY: ProductFormState = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  stock: '',
  category: '',
  sku: '',
  isActive: true,
  images: [],
};

interface RawProduct {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  comparePrice?: unknown;
  stock?: unknown;
  category?: unknown;
  sku?: unknown;
  isActive?: unknown;
  images?: unknown;
}

function productToForm(p: RawProduct): ProductFormState {
  return {
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    price: p.price != null ? String(Number(p.price) / 100) : '',
    comparePrice: p.comparePrice != null ? String(Number(p.comparePrice) / 100) : '',
    stock: p.stock != null ? String(p.stock) : '',
    category: String(p.category ?? ''),
    sku: String(p.sku ?? ''),
    isActive: Boolean(p.isActive ?? true),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
  };
}

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useDashboardAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductFormState>(EMPTY);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isEdit) return;

    apiClient
      .get<{ product: RawProduct }>(`/api/dashboard/products/${id}`)
      .then(({ product }) => setForm(productToForm(product)))
      .catch(() => setError('Could not load product.'))
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit, user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (form.images.length >= 3) {
      alert('Maximum 3 images allowed.');
      return;
    }
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await apiClient.post<{ url: string }>(
        '/api/dashboard/upload/image',
        body
      );
      setForm((prev) => ({ ...prev, images: [...prev.images, res.url] }));
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!form.price) {
      setError('Price is required.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Math.round(parseFloat(form.price) * 100),
      comparePrice: form.comparePrice
        ? Math.round(parseFloat(form.comparePrice) * 100)
        : undefined,
      stock: form.stock ? parseInt(form.stock, 10) : 0,
      category: form.category.trim() || undefined,
      sku: form.sku.trim() || undefined,
      isActive: form.isActive,
      images: form.images,
    };

    try {
      if (isEdit) {
        await apiClient.put(`/api/dashboard/products/${id}`, payload);
      } else {
        await apiClient.post('/api/dashboard/products', payload);
      }
      navigate('/dashboard/products');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save product.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="max-w-2xl">
        <div className="h-4 bg-gray-100 animate-pulse rounded w-24 mb-6" />
        <div className="h-7 bg-gray-100 animate-pulse rounded w-40 mb-8" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 animate-pulse rounded mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/dashboard/products"
        className="inline-block text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Products
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {isEdit ? 'Edit product' : 'Add product'}
      </h1>

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Price + Compare price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare price (₹)
            </label>
            <p className="text-xs text-gray-400 -mt-0.5 mb-1">
              Original price for showing discount
            </p>
            <input
              name="comparePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.comparePrice}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stock + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock quantity
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="sku"
            value={form.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Show in my store
          </label>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images{' '}
            <span className="text-gray-400 font-normal">(max 3)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={url} className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={url}
                  alt={`Product image ${i + 1}`}
                  className="w-full h-full object-cover rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-900"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.images.length < 3 && (
              <button
                type="button"
                onClick={handleImageClick}
                disabled={uploadingImage}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 flex-shrink-0"
              >
                {uploadingImage ? (
                  <span className="text-xs">Uploading…</span>
                ) : (
                  <>
                    <span className="text-2xl leading-none">+</span>
                    <span className="text-xs mt-1">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <Link
            to="/dashboard/products"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
