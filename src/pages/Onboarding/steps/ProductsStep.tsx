import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Plus, Trash2, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';

const CATEGORY_SUGGESTIONS: Record<string, { name: string; price: string; description: string }> = {
  'Clothing & Apparel': { name: 'Classic Tailored Oxford Shirt', price: '1499', description: '100% organic cotton luxury weave.' },
  'General Products': { name: 'Premium Sample Product', price: '1850', description: 'High quality premium product.' },
  'Jewelry & Accessories': { name: 'Handmade Sterling Silver Pendant', price: '1899', description: '925 silver handcrafted necklace.' },
  'Beauty & Wellness': { name: 'Botanical Radiance Glow Serum', price: '899', description: 'Infused with saffron and cold-pressed botanical oils.' },
  'Handicrafts & Art': { name: 'Handcrafted Brass Carved Decor Piece', price: '2200', description: 'Artisan engraved heirloom piece.' },
  'Gourmet & Foods': { name: 'Artisanal Kashmiri Saffron (1g)', price: '650', description: 'Grade A+ pure Mongra saffron threads.' },
  'Electronics & Tech': { name: 'Active Wireless Earbuds', price: '2999', description: 'Hi-Fi studio sound with 32h battery.' },
  'General Commerce': { name: 'Signature Lifestyle Essential', price: '999', description: 'Crafted for daily excellence.' },
};

export const ProductsStep: React.FC = () => {
  const { data, addProduct, removeProduct, nextStep, prevStep } = useOnboarding();
  const categoryKey = data.business.category || 'General Products';
  const suggestion = CATEGORY_SUGGESTIONS[categoryKey] || CATEGORY_SUGGESTIONS['General Products'];

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price.trim()) {
      addProduct({
        name: name.trim(),
        price: price.trim(),
        description: 'Premium quality product.',
        category: data.business.category || 'General',
      });
      setName('');
      setPrice('');
    }
  };

  const handleApplySuggestion = () => {
    setName(suggestion.name);
    setPrice(suggestion.price);
  };

  const hasAtLeastOneProduct = data.initialProducts.length >= 1;

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Title & One Main Idea */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Add your first product.
        </h1>
        <p className="text-sm sm:text-base text-stone-500 font-normal leading-relaxed">
          Add a starter product to set up your catalog. You can edit, import, and organize inventory anytime from your merchant dashboard.
        </p>
      </div>

      {/* Product Entry Form */}
      <form onSubmit={handleAdd} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
              Product Title
            </label>
            {!name && (
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full hover:bg-stone-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Fill sample product</span>
              </button>
            )}
          </div>

          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${suggestion.name}`}
            className="w-full px-5 py-4 text-base sm:text-lg font-bold text-stone-900 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 shadow-2xs transition-all placeholder:text-stone-300 placeholder:font-medium"
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
              Price (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1499"
                className="w-full pl-10 pr-5 py-4 text-base sm:text-lg font-bold text-stone-900 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 shadow-2xs transition-all placeholder:text-stone-300 placeholder:font-medium"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !price.trim()}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            name.trim() && price.trim()
              ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-98 shadow-sm cursor-pointer'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add to Catalog</span>
        </button>
      </form>

      {/* Added Products Shelf Display */}
      {data.initialProducts.length > 0 && (
        <div className="space-y-3 pt-2">
          <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
            Catalog Items ({data.initialProducts.length})
          </span>
          <div className="space-y-2.5">
            {data.initialProducts.map((prod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs group transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{prod.name}</h4>
                    <p className="text-xs text-stone-500 font-semibold mt-0.5">₹{prod.price}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(idx)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-full font-bold text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all active:scale-98 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!hasAtLeastOneProduct}
          className={`inline-flex items-center gap-2 px-9 py-4 rounded-full font-bold text-sm transition-all ${
            hasAtLeastOneProduct
              ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-md shadow-stone-900/10 active:scale-98 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
