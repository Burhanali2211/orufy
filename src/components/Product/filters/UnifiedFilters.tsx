import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  DollarSign,
  Package,
  MapPin,
  Clock,
  Flower2,
  Droplets,
  Search,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Category } from '@/types';
import { FilterSection, QuickFilterButton } from './FilterComponents';
import { 
  concentrationOptions, 
  originOptions 
} from './FilterOptions';

export interface UnifiedFilterState {
  category: string;
  priceRange: [number, number];
  brands: string[];
  concentration: string[];
  origins: string[];
  sortBy: string;
  search: string;
  rating: number;
  inStock: boolean;
}

interface UnifiedFiltersProps {
  filters: UnifiedFilterState;
  onFiltersChange: (filters: UnifiedFilterState) => void;
  categories: Category[];
  availableBrands?: string[];
  isOpen: boolean;
  onToggle: () => void;
  productCount: number;
  className?: string;
}

export const UnifiedFilters: React.FC<UnifiedFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  isOpen,
  onToggle,
  productCount,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    concentration: false,
    origins: false,
    sorting: false
  });

  const updateFilter = <K extends keyof UnifiedFilterState>(key: K, value: UnifiedFilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: '',
      priceRange: [0, 50000],
      rating: 0,
      inStock: false,
      brands: [],
      concentration: [],
      origins: [],
      sortBy: 'newest',
      search: ''
    });
  };

  const activeFilterCount = [
    filters.category && filters.category !== '' ? 1 : 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0,
    filters.rating > 0 ? 1 : 0,
    filters.inStock ? 1 : 0,
    filters.concentration.length,
    filters.origins.length,
    filters.search !== '' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  if (!isOpen) return null;

  return (
    <div className={`bg-white rounded-3xl shadow-2xl border border-neutral-100 flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-xl shadow-lg">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-lg">Filters</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Refine Collection</p>
          </div>
          {activeFilterCount > 0 && (
            <span className="bg-neutral-900 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {activeFilterCount > 0 && (
            <button 
              onClick={clearAllFilters} 
              className="text-xs text-red-500 hover:text-red-600 transition-colors font-bold uppercase tracking-tight"
            >
              Clear All
            </button>
          )}
          <button onClick={onToggle} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Search Input In-Filters */}
      <div className="p-6 border-b border-neutral-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input 
            type="text" 
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search in results..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        <div className="space-y-2">
          
          <FilterSection 
            title="Sort By" 
            icon={<ArrowUpDown className="h-5 w-5" />} 
            isExpanded={expandedSections.sorting} 
            onToggle={() => toggleSection('sorting')}
          >
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'newest', label: 'Newest Arrivals' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
                { value: 'rating', label: 'Customer Rating' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('sortBy', opt.value)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filters.sortBy === opt.value 
                      ? 'bg-neutral-900 text-white shadow-md' 
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {opt.label}
                  {filters.sortBy === opt.value && <></>}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Categories" icon={<Package className="h-5 w-5" />} isExpanded={expandedSections.category} onToggle={() => toggleSection('category')}>
            <div className="space-y-2">
              <button
                onClick={() => updateFilter('category', '')}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !filters.category ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                All Collections
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateFilter('category', category.id)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    filters.category === category.id ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-[10px] bg-white border border-neutral-100 px-2 py-0.5 rounded-full">{category.productCount}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range" icon={<DollarSign className="h-5 w-5" />} isExpanded={expandedSections.price} onToggle={() => toggleSection('price')}>
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                <span>₹{filters.priceRange[0].toLocaleString()}</span>
                <span>₹{filters.priceRange[1] === 50000 ? '50,000+' : filters.priceRange[1].toLocaleString()}</span>
              </div>
              <div className="px-1">
                <input 
                  type="range" 
                  min="0" 
                  max="50000" 
                  step="500"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-neutral-900" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { range: [0, 2000], label: 'Under ₹2K' },
                  { range: [2000, 5000], label: '₹2K - ₹5K' },
                  { range: [5000, 10000], label: '₹5K - ₹10K' },
                  { range: [10000, 50000], label: 'Premium' }
                ].map(p => (
                  <button 
                    key={p.label}
                    onClick={() => updateFilter('priceRange', p.range as [number, number])}
                    className="py-2 text-[10px] font-bold border border-neutral-100 rounded-lg hover:bg-neutral-50 text-neutral-600 uppercase tracking-tighter"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>



        </div>
      </div>

      <div className="p-6 bg-neutral-900 border-t border-neutral-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-neutral-400 font-bold uppercase">Matches Found</p>
          <p className="text-white font-bold">{productCount}</p>
        </div>
        <button 
          onClick={onToggle}
          className="w-full bg-white text-neutral-900 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-neutral-100 transition-all shadow-xl shadow-black/20"
        >
          View Results
        </button>
      </div>
    </div>
  );
};
