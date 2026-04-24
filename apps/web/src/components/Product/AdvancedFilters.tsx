import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Crown, Sparkles, Clock, DollarSign, Package, MapPin, Flower2, Droplets } from 'lucide-react';

interface AdvancedFilterState {
    category: string;
    priceRange: [number, number];
    rating: number;
    inStock: boolean;
    featured: boolean;
    newArrivals: boolean;
    onSale: boolean;
    brands: string[];
    longevity: string[];
    sillage: string[];
    concentration: string[];
    origins: string[];
    fragranceFamily: string[];
}

interface AdvancedFiltersProps {
    filters: AdvancedFilterState;
    onFiltersChange: (filters: AdvancedFilterState) => void;
    categories: any[];
    isOpen: boolean;
    onToggle: () => void;
    productCount: number;
}

const longevityOptions = [
    { value: 'poor', label: 'Poor (0-2 hours)', icon: '⏱️' },
    { value: 'weak', label: 'Weak (2-4 hours)', icon: '⏰' },
    { value: 'moderate', label: 'Moderate (4-6 hours)', icon: '🕐' },
    { value: 'long', label: 'Long (6-8 hours)', icon: '🕕' },
    { value: 'very-long', label: 'Very Long (8+ hours)', icon: '🕘' }
];

const sillageOptions = [
    { value: 'intimate', label: 'Intimate', icon: '🤫' },
    { value: 'moderate', label: 'Moderate', icon: '👥' },
    { value: 'strong', label: 'Strong', icon: '💨' },
    { value: 'very-strong', label: 'Very Strong', icon: '🌪️' }
];

const concentrationOptions = [
    { value: 'pure-oil', label: 'Pure Oil', premium: true },
    { value: 'extrait', label: 'Extrait de Parfum', premium: true },
    { value: 'edp', label: 'Eau de Parfum' },
    { value: 'edt', label: 'Eau de Toilette' },
    { value: 'edc', label: 'Eau de Cologne' }
];

const originOptions = [
    { value: 'india', label: 'India', flag: '🇮🇳' },
    { value: 'arabia', label: 'Arabia', flag: '🇸🇦' },
    { value: 'france', label: 'France', flag: '🇫🇷' },
    { value: 'italy', label: 'Italy', flag: '🇮🇹' },
    { value: 'turkey', label: 'Turkey', flag: '🇹🇷' }
];

const fragranceFamilyOptions = [
    { value: 'floral', label: 'Floral', icon: '🌸' },
    { value: 'oriental', label: 'Oriental', icon: '🏺' },
    { value: 'woody', label: 'Woody', icon: '🌳' },
    { value: 'fresh', label: 'Fresh', icon: '🌿' },
    { value: 'citrus', label: 'Citrus', icon: '🍋' },
    { value: 'spicy', label: 'Spicy', icon: '🌶️' },
    { value: 'musky', label: 'Musky', icon: '🦌' },
    { value: 'amber', label: 'Amber', icon: '🟫' }
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    filters,
    onFiltersChange,
    categories,
    isOpen,
    onToggle,
    productCount
}) => {
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        price: true,
        quality: true,
        advanced: false
    });

    const updateFilter = (key: keyof AdvancedFilterState, value: any) => {
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
            priceRange: [0, 50000],
            rating: 0,
            inStock: false,
            featured: false,
            newArrivals: false,
            onSale: false,
            brands: [],
            longevity: [],
            sillage: [],
            concentration: [],
            origins: [],
            fragranceFamily: []
        });
    };

    const activeFilterCount = [
        filters.category && filters.category !== '' ? 1 : 0,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0,
        filters.rating > 0 ? 1 : 0,
        filters.inStock ? 1 : 0,
        filters.featured ? 1 : 0,
        filters.newArrivals ? 1 : 0,
        filters.onSale ? 1 : 0,
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
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg transition-colors px-3"
            >
                <div className="flex items-center space-x-3">
                    <div className={`${premium ? 'text-yellow-500' : 'text-gray-600'}`}>{icon}</div>
                    <span className={`font-semibold text-sm ${premium ? 'text-yellow-800' : 'text-gray-900'}`}>
                        {title}
                        {premium && <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />}
                    </span>
                </div>
                {expandedSections[sectionKey] ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
            </button>

            {expandedSections[sectionKey] && (
                <div className="pb-4 px-3">
                    {children}
                </div>
            )}
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
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                    ? premium
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                }`}
        >
            {icon && <span>{icon}</span>}
            <span>{label}</span>
        </button>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                            <Filter className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Advanced Filters</h3>
                            <p className="text-sm text-gray-600">
                                Find your perfect product • {productCount} results
                            </p>
                        </div>
                        {activeFilterCount > 0 && (
                            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                                {activeFilterCount} active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
                            >
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={onToggle}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                        Quick Filters
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        <QuickFilterButton
                            label="Premium Collection"
                            isActive={filters.featured}
                            onClick={() => updateFilter('featured', !filters.featured)}
                            icon="👑"
                            premium
                        />
                        <QuickFilterButton
                            label="New Arrivals"
                            isActive={filters.newArrivals}
                            onClick={() => updateFilter('newArrivals', !filters.newArrivals)}
                            icon="✨"
                        />
                        <QuickFilterButton
                            label="On Sale"
                            isActive={filters.onSale}
                            onClick={() => updateFilter('onSale', !filters.onSale)}
                            icon="🔥"
                        />
                        <QuickFilterButton
                            label="In Stock Only"
                            isActive={filters.inStock}
                            onClick={() => updateFilter('inStock', !filters.inStock)}
                            icon="📦"
                        />
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
                            label="Long Lasting"
                            isActive={filters.longevity.includes('very-long')}
                            onClick={() => {
                                const newLongevity = filters.longevity.includes('very-long')
                                    ? filters.longevity.filter(l => l !== 'very-long')
                                    : [...filters.longevity, 'very-long'];
                                updateFilter('longevity', newLongevity);
                            }}
                            icon="⏰"
                        />
                    </div>
                </div>

                {/* Main Filters */}
                <div className="flex-1 overflow-y-auto p-6 max-h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-0">
                            {/* Category Filter */}
                            <FilterSection
                                title="Categories"
                                icon={<Package className="h-5 w-5" />}
                                sectionKey="category"
                            >
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={!filters.category || filters.category === ''}
                                            onChange={() => updateFilter('category', '')}
                                            className="form-radio text-purple-600 focus:ring-purple-500 h-4 w-4"
                                        />
                                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
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
                                                className="form-radio text-purple-600 focus:ring-purple-500 h-4 w-4"
                                            />
                                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                                                {category.name}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-auto bg-gray-100 px-2 py-1 rounded-full">
                                                {category.productCount || 0}
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
                                            <label className="block text-xs text-gray-600 mb-2 font-medium">Minimum</label>
                                            <input
                                                type="number"
                                                value={filters.priceRange[0]}
                                                onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="1000"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-600 mb-2 font-medium">Maximum</label>
                                            <input
                                                type="number"
                                                value={filters.priceRange[1]}
                                                onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 50000])}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="50000"
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Price Ranges */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { range: [1000, 5000], label: '₹1K - ₹5K' },
                                            { range: [5000, 15000], label: '₹5K - ₹15K' },
                                            { range: [15000, 30000], label: '₹15K - ₹30K' },
                                            { range: [30000, 50000], label: '₹30K+' }
                                        ].map(({ range, label }) => (
                                            <button
                                                key={label}
                                                onClick={() => updateFilter('priceRange', range)}
                                                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Rating Filter */}
                            <div className="border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                                    <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                                    Minimum Rating
                                </h4>
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => updateFilter('rating', filters.rating === rating ? 0 : rating)}
                                            className={`p-2 rounded-lg transition-colors ${filters.rating >= rating
                                                    ? 'text-yellow-500'
                                                    : 'text-gray-300 hover:text-yellow-400'
                                                }`}
                                        >
                                            <Sparkles className="w-5 h-5" />
                                        </button>
                                    ))}
                                    <span className="text-sm text-gray-600 ml-2">
                                        {filters.rating > 0 ? `${filters.rating}+ stars` : 'Any rating'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-0">
                            {/* Quality Attributes */}
                            <FilterSection
                                title="Quality Attributes"
                                icon={<Crown className="h-5 w-5" />}
                                sectionKey="quality"
                                premium
                            >
                                <div className="space-y-4">
                                    {/* Longevity */}
                                    <div>
                                        <h5 className="font-medium text-sm text-gray-800 mb-2">Longevity</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {longevityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        if (filters.longevity.includes(option.value)) {
                                                            updateFilter('longevity', filters.longevity.filter(l => l !== option.value));
                                                        } else {
                                                            updateFilter('longevity', [...filters.longevity, option.value]);
                                                        }
                                                    }}
                                                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-all ${filters.longevity.includes(option.value)
                                                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sillage */}
                                    <div>
                                        <h5 className="font-medium text-sm text-gray-800 mb-2">Sillage</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {sillageOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        if (filters.sillage.includes(option.value)) {
                                                            updateFilter('sillage', filters.sillage.filter(s => s !== option.value));
                                                        } else {
                                                            updateFilter('sillage', [...filters.sillage, option.value]);
                                                        }
                                                    }}
                                                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-all ${filters.sillage.includes(option.value)
                                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Concentration */}
                                    <div>
                                        <h5 className="font-medium text-sm text-gray-800 mb-2">Concentration</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {concentrationOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        if (filters.concentration.includes(option.value)) {
                                                            updateFilter('concentration', filters.concentration.filter(c => c !== option.value));
                                                        } else {
                                                            updateFilter('concentration', [...filters.concentration, option.value]);
                                                        }
                                                    }}
                                                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-all ${filters.concentration.includes(option.value)
                                                            ? option.premium
                                                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                                                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {option.premium && <Crown className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Advanced Attributes */}
                            <FilterSection
                                title="Advanced Attributes"
                                icon={<Sparkles className="h-5 w-5" />}
                                sectionKey="advanced"
                            >
                                <div className="space-y-4">
                                    {/* Origins */}
                                    <div>
                                        <h5 className="font-medium text-sm text-gray-800 mb-2">Origin</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {originOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        if (filters.origins.includes(option.value)) {
                                                            updateFilter('origins', filters.origins.filter(o => o !== option.value));
                                                        } else {
                                                            updateFilter('origins', [...filters.origins, option.value]);
                                                        }
                                                    }}
                                                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-all ${filters.origins.includes(option.value)
                                                            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <span>{option.flag}</span>
                                                    <span>{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fragrance Family */}
                                    <div>
                                        <h5 className="font-medium text-sm text-gray-800 mb-2">Fragrance Family</h5>
                                        <div className="flex flex-wrap gap-2">
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
                                                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-all ${filters.fragranceFamily.includes(option.value)
                                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </FilterSection>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        {productCount} products match your filters
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onToggle}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onToggle}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilters;