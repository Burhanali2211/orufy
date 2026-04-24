import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  DollarSign,
  Package,
  MapPin,
  Clock,
  Sparkles,
  Flower2,
  Crown,
  Droplets
} from 'lucide-react';
import { Category } from '../../types';

export interface AttrFilterState {
  category: string;
  priceRange: [number, number];
  brands: string[];
  longevity: string[];
  sillage: string[];
  concentration: string[];
  origins: string[];
  fragranceFamily: string[];
  sortBy: string;
  search: string;
  // Keep for compatibility but not used in UI
  rating: number;
  inStock: boolean;
}

interface AttrFiltersProps {
  filters: AttrFilterState;
  onFiltersChange: (filters: AttrFilterState) => void;
  categories: Category[];
  availableBrands: string[]; // Keep for compatibility but not used
  isOpen: boolean;
  onToggle: () => void;
  productCount: number;
  className?: string;
}

// Attar-specific filter options
const longevityOptions = [
  { value: 'light', label: 'Light (2-4 hours)', icon: '🌸' },
  { value: 'moderate', label: 'Moderate (4-8 hours)', icon: '🌺' },
  { value: 'long', label: 'Long-lasting (8-12 hours)', icon: '🌹' },
  { value: 'very-long', label: 'Very Long (12+ hours)', icon: '👑' }
];

const sillageOptions = [
  { value: 'intimate', label: 'Intimate (Close to skin)', icon: '🤏' },
  { value: 'moderate', label: 'Moderate (Arm\'s length)', icon: '🫴' },
  { value: 'strong', label: 'Strong (Room filling)', icon: '💨' },
  { value: 'very-strong', label: 'Very Strong (Projection)', icon: '✨' }
];

const concentrationOptions = [
  { value: 'pure-oil', label: 'Pure Oil', premium: true },
  { value: 'concentrated', label: 'Concentrated', premium: true },
  { value: 'diluted', label: 'Diluted' },
  { value: 'blend', label: 'Blend' }
];

const originOptions = [
  { value: 'kannauj', label: 'Kannauj, India', flag: '🇮🇳' },
  { value: 'mysore', label: 'Mysore, Karnataka', flag: '🇮🇳' },
  { value: 'kashmir', label: 'Kashmir, India', flag: '🇮🇳' },
  { value: 'assam', label: 'Assam, India', flag: '🇮🇳' },
  { value: 'bulgarian', label: 'Bulgaria (Rose Oil)', flag: '🇧🇬' },
  { value: 'cambodian', label: 'Cambodia (Oudh)', flag: '🇰🇭' },
  { value: 'arabian', label: 'Arabian Peninsula', flag: '🇸🇦' }
];

const fragranceFamilyOptions = [
  { value: 'floral', label: 'Floral', icon: '🌸' },
  { value: 'woody', label: 'Woody', icon: '🌳' },
  { value: 'oriental', label: 'Oriental', icon: '🏺' },
  { value: 'spicy', label: 'Spicy', icon: '🌶️' },
  { value: 'fresh', label: 'Fresh', icon: '💧' },
  { value: 'musky', label: 'Musky', icon: '🦌' },
  { value: 'citrus', label: 'Citrus', icon: '🍊' },
  { value: 'herbal', label: 'Herbal', icon: '🌿' }
];

export const AttrFilters: React.FC<AttrFiltersProps> = ({
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
    longevity: true,
    sillage: true,
    concentration: true,
    origins: false,
    fragranceFamily: false
  });

  const updateFilter = (key: keyof AttrFilterState, value: any) => {
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
      category: '',
      priceRange: [0, 25000],
      rating: 0,
      inStock: false,
      brands: [],
      longevity: [],
      sillage: [],
      concentration: [],
      origins: [],
      fragranceFamily: [],
      sortBy: 'featured',
      search: ''
    });
  };

  const activeFilterCount = [
    filters.category && filters.category !== '' ? 1 : 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 25000 ? 1 : 0,
    filters.longevity.length,
    filters.sillage.length,
    filters.concentration.length,
    filters.origins.length,
    filters.fragranceFamily.length
  ].reduce((sum, count) => sum + count, 0);

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
    premium?: boolean;
  }> = ({ title, icon, sectionKey, children, premium = false }) => (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-neutral-25 rounded-lg transition-colors px-2"
      >
        <div className="flex items-center space-x-3">
          <div className={`${premium ? 'text-amber-500' : 'text-neutral-600'}`}>{icon}</div>
          <span className={`font-medium text-sm ${premium ? 'text-amber-900' : 'text-neutral-900'}`}>
            {title}
            {premium && <Crown className="inline h-3 w-3 ml-1 text-amber-500" />}
          </span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        )}
      </button>
      
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const QuickFilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    premium?: boolean;
  }> = ({ label, isActive, onClick, icon, premium = false }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? premium
            ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300 shadow-sm'
            : 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700 border border-neutral-300 shadow-sm'
          : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
      }`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span>{label}</span>
    </button>
  );

  return (
    <div className={`bg-white rounded-xl shadow-luxury border border-neutral-200 flex flex-col h-full ${className}`}>
      {/* Luxury Filter Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg">
            <Filter className="h-4 w-4 text-neutral-700" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-base">Attar Filters</h3>
            <p className="text-xs text-neutral-500">Discover your perfect fragrance</p>
          </div>
          {activeFilterCount > 0 && (
            <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Elegant Results Count */}
      <div className="px-6 py-4 bg-gradient-to-r from-neutral-25 to-white border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">{productCount}</span> exquisite attars found
          </p>
          <Sparkles className="h-4 w-4 text-amber-500" />
        </div>
      </div>

      {/* Quick Filters Section */}
      <div className="p-6 border-b border-neutral-100 flex-shrink-0">
        <h4 className="text-sm font-medium text-neutral-900 mb-3 flex items-center">
          <Droplets className="h-4 w-4 mr-2 text-neutral-600" />
          Quick Filters
        </h4>
        <div className="flex flex-wrap gap-2">
          <QuickFilterButton
            label="Pure Oil"
            isActive={filters.concentration.includes('pure-oil')}
            onClick={() => {
              const newConcentration = filters.concentration.includes('pure-oil')
                ? filters.concentration.filter(c => c !== 'pure-oil')
                : [...filters.concentration, 'pure-oil'];
              updateFilter('concentration', newConcentration);
            }}
            icon="💎"
            premium
          />
          <QuickFilterButton
            label="Long-lasting"
            isActive={filters.longevity.includes('very-long')}
            onClick={() => {
              const newLongevity = filters.longevity.includes('very-long')
                ? filters.longevity.filter(l => l !== 'very-long')
                : [...filters.longevity, 'very-long'];
              updateFilter('longevity', newLongevity);
            }}
            icon="⏰"
          />
          <QuickFilterButton
            label="Strong Sillage"
            isActive={filters.sillage.includes('very-strong')}
            onClick={() => {
              const newSillage = filters.sillage.includes('very-strong')
                ? filters.sillage.filter(s => s !== 'very-strong')
                : [...filters.sillage, 'very-strong'];
              updateFilter('sillage', newSillage);
            }}
            icon="💨"
          />
          <QuickFilterButton
            label="Premium"
            isActive={filters.priceRange[0] >= 10000}
            onClick={() => {
              updateFilter('priceRange', filters.priceRange[0] >= 10000 ? [0, 25000] : [10000, 25000]);
            }}
            icon="👑"
            premium
          />
        </div>
      </div>

      {/* Filter Sections - Improved Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-0">
          {/* Category Filter */}
          <FilterSection
            title="Attar Categories"
            icon={<Package className="h-5 w-5" />}
            sectionKey="category"
          >
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={!filters.category || filters.category === ''}
                  onChange={() => updateFilter('category', '')}
                  className="form-radio text-neutral-600 focus:ring-neutral-500 h-4 w-4"
                />
                <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm font-medium">
                  All Categories
                </span>
              </label>
              {categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category.name}
                    onChange={() => updateFilter('category', category.name)}
                    className="form-radio text-neutral-600 focus:ring-neutral-500 h-4 w-4"
                  />
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {category.name}
                  </span>
                  <span className="text-xs text-neutral-400 ml-auto bg-neutral-100 px-2 py-1 rounded-full">
                    {category.productCount}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range Filter */}
          <FilterSection
            title="Price Range (₹)"
            icon={<DollarSign className="h-5 w-5" />}
            sectionKey="price"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-600 mb-2 font-medium">Minimum</label>
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 transition-all"
                    placeholder="1000"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-600 mb-2 font-medium">Maximum</label>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 25000])}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 transition-all"
                    placeholder="25000"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>₹{filters.priceRange[0].toLocaleString('en-IN')}</span>
                <span>₹{filters.priceRange[1].toLocaleString('en-IN')}</span>
              </div>
              {/* Luxury Price Range Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { range: [1000, 5000], label: '₹1K - ₹5K', desc: 'Premium' },
                  { range: [5000, 10000], label: '₹5K - ₹10K', desc: 'Luxury' },
                  { range: [10000, 15000], label: '₹10K - ₹15K', desc: 'Elite' },
                  { range: [15000, 25000], label: '₹15K+', desc: 'Royal' }
                ].map(({ range, label, desc }) => (
                  <button
                    key={label}
                    onClick={() => updateFilter('priceRange', range)}
                    className="px-3 py-3 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all text-left"
                  >
                    <div className="font-medium text-neutral-700">{label}</div>
                    <div className="text-neutral-500 text-xs">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Longevity Filter */}
          <FilterSection
            title="Longevity"
            icon={<Clock className="h-5 w-5" />}
            sectionKey="longevity"
            premium
          >
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {longevityOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.longevity.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('longevity', [...filters.longevity, option.value]);
                      } else {
                        updateFilter('longevity', filters.longevity.filter(l => l !== option.value));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Sillage Filter */}
          <FilterSection
            title="Sillage (Projection)"
            icon={<Sparkles className="h-5 w-5" />}
            sectionKey="sillage"
            premium
          >
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {sillageOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.sillage.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('sillage', [...filters.sillage, option.value]);
                      } else {
                        updateFilter('sillage', filters.sillage.filter(s => s !== option.value));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Concentration Filter */}
          <FilterSection
            title="Concentration"
            icon={<Droplets className="h-5 w-5" />}
            sectionKey="concentration"
            premium
          >
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {concentrationOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.concentration.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('concentration', [...filters.concentration, option.value]);
                      } else {
                        updateFilter('concentration', filters.concentration.filter(c => c !== option.value));
                      }
                    }}
                    className={`form-checkbox h-4 w-4 rounded focus:ring-amber-500 ${
                      option.premium ? 'text-amber-600' : 'text-neutral-600'
                    }`}
                  />
                  <span className={`text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm ${
                    option.premium ? 'font-medium' : ''
                  }`}>
                    {option.label}
                    {option.premium && <Crown className="inline h-3 w-3 ml-1 text-amber-500" />}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Origins Filter */}
          <FilterSection
            title="Origin"
            icon={<MapPin className="h-5 w-5" />}
            sectionKey="origins"
          >
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {originOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.origins.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('origins', [...filters.origins, option.value]);
                      } else {
                        updateFilter('origins', filters.origins.filter(o => o !== option.value));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-neutral-600 rounded focus:ring-neutral-500"
                  />
                  <span className="text-lg">{option.flag}</span>
                  <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors text-sm">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Fragrance Family Filter */}
          <FilterSection
            title="Fragrance Family"
            icon={<Flower2 className="h-5 w-5" />}
            sectionKey="fragranceFamily"
          >
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 pb-2">
              {fragranceFamilyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (filters.fragranceFamily.includes(option.value)) {
                      updateFilter('fragranceFamily', filters.fragranceFamily.filter(f => f !== option.value));
                    } else {
                      updateFilter('fragranceFamily', [...filters.fragranceFamily, option.value]);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filters.fragranceFamily.includes(option.value)
                      ? 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700 border border-neutral-300 shadow-sm'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  );
};
