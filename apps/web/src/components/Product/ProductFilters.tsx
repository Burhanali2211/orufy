import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp, Star, DollarSign, Package, Tag, Shield } from 'lucide-react';
import { Category } from '../../types';

export interface FilterState {
  category: string;
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  brands: string[];
  tags: string[];
  features: string[];
  sortBy: string;
  search: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: Category[];
  availableBrands: string[];
  availableTags: string[];
  availableFeatures: string[];
  isOpen: boolean;
  onToggle: () => void;
  productCount: number;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  availableBrands,
  availableTags,
  availableFeatures,
  isOpen,
  onToggle,
  productCount,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    brands: false,
    features: false,
    tags: false
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: 'all',
      priceRange: [0, 25000],
      rating: 0,
      inStock: false,
      brands: [],
      tags: [],
      features: [],
      sortBy: 'featured',
      search: ''
    });
  };

  const activeFilterCount = [
    filters.category !== 'all' ? 1 : 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 25000 ? 1 : 0,
    filters.rating > 0 ? 1 : 0,
    filters.inStock ? 1 : 0,
    filters.brands.length,
    filters.tags.length,
    filters.features.length
  ].reduce((sum, count) => sum + count, 0);

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 rounded transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">{icon}</div>
          <span className="font-medium text-gray-900 text-sm">{title}</span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24 ${className}`}>
      {/* Compact Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Compact Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-medium text-gray-900">{productCount}</span> products
        </p>
      </div>

      {/* Compact Filter Sections */}
      <div className="p-4 space-y-0 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Category Filter */}
        <FilterSection
          title="Category"
          icon={<Package className="h-4 w-4" />}
          sectionKey="category"
        >
          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={filters.category === 'all'}
                onChange={() => updateFilter('category', 'all')}
                className="form-radio text-blue-600 focus:ring-blue-500 h-3 w-3"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors text-sm">
                All Categories
              </span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category.name}
                  onChange={() => updateFilter('category', category.name)}
                  className="form-radio text-blue-600 focus:ring-blue-500 h-3 w-3"
                />
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors text-sm">
                  {category.name}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {category.productCount}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range Filter */}
        <FilterSection
          title="Price Range (₹)"
          icon={<DollarSign className="h-4 w-4" />}
          sectionKey="price"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-neutral-600 mb-1">Min</label>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1000"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-600 mb-1">Max</label>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 25000])}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="25000"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>₹{filters.priceRange[0].toLocaleString('en-IN')}</span>
              <span>₹{filters.priceRange[1].toLocaleString('en-IN')}</span>
            </div>
            {/* Quick Price Range Buttons for Attars */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => updateFilter('priceRange', [1000, 5000])}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                ₹1K - ₹5K
              </button>
              <button
                onClick={() => updateFilter('priceRange', [5000, 10000])}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                ₹5K - ₹10K
              </button>
              <button
                onClick={() => updateFilter('priceRange', [10000, 15000])}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                ₹10K - ₹15K
              </button>
              <button
                onClick={() => updateFilter('priceRange', [15000, 25000])}
                className="px-3 py-2 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                ₹15K+
              </button>
            </div>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection
          title="Minimum Rating"
          icon={<Star className="h-4 w-4" />}
          sectionKey="rating"
        >
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => updateFilter('rating', rating === filters.rating ? 0 : rating)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all ${
                  filters.rating === rating
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-300 hover:border-neutral-400 text-neutral-600'
                }`}
              >
                <Star className={`h-4 w-4 ${filters.rating === rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          {filters.rating > 0 && (
            <p className="text-xs text-neutral-600 mt-2">
              {filters.rating}+ stars and above
            </p>
          )}
        </FilterSection>

        {/* Stock Filter */}
        <FilterSection
          title="Availability"
          icon={<Package className="h-4 w-4" />}
          sectionKey="category"
        >
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => updateFilter('inStock', e.target.checked)}
              className="form-checkbox h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
              In Stock Only
            </span>
          </label>
        </FilterSection>

        {/* Brands Filter */}
        {availableBrands.length > 0 && (
          <FilterSection
            title="Brands"
            icon={<Tag className="h-4 w-4" />}
            sectionKey="brands"
          >
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableBrands.map((brand) => (
                <label key={brand} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('brands', [...filters.brands, brand]);
                      } else {
                        updateFilter('brands', filters.brands.filter(b => b !== brand));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Features Filter */}
        {availableFeatures.length > 0 && (
          <FilterSection
            title="Features"
            icon={<Shield className="h-4 w-4" />}
            sectionKey="features"
          >
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.features.includes(feature)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('features', [...filters.features, feature]);
                      } else {
                        updateFilter('features', filters.features.filter(f => f !== feature));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <FilterSection
            title="Tags"
            icon={<Tag className="h-4 w-4" />}
            sectionKey="tags"
          >
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (filters.tags.includes(tag)) {
                      updateFilter('tags', filters.tags.filter(t => t !== tag));
                    } else {
                      updateFilter('tags', [...filters.tags, tag]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filters.tags.includes(tag)
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </FilterSection>
        )}
      </div>
    </div>
  );
};