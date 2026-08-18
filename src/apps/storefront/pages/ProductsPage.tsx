import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import {
    Search, Grid3X3, LayoutList, Star, Heart, ShoppingCart, ShoppingBag,
    ChevronDown, ChevronUp, X, SlidersHorizontal, ArrowUpDown,
    Check, Flame, RotateCcw, ChevronLeft, ChevronRight, Wind, Info, ArrowRight, Tag
} from 'lucide-react';
import { useProducts } from '@/shared/contexts/ProductContext';
import { useCart } from '@/shared/contexts/CartContext';
import { ProductCard } from '@/shared/components/Product/ProductCard';
import { MobileProductHeader } from '@/shared/components/Product/MobileProductHeader';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
    category: string;
    search: string;
    priceRange: [number, number];
    rating: number;
    brand: string;
    discount: number;
    availability: string;
    sortBy: string;
}

const ProductsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { slug } = useParams<{ slug?: string }>();
    const { products, categories, loading, fetchProducts, pagination } = useProducts();
    const { items, itemCount, total } = useCart();
    const navigate = useNavigate();

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [comparingIds, setComparingIds] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [isCartWidgetDismissed, setIsCartWidgetDismissed] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState({
        category: true,
        price: true,
        rating: true,
        discount: false,
        availability: false
    });

    // Price slider state
    const [priceSliderValue, setPriceSliderValue] = useState(100000);
    const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
        };
    }, []);

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        category: '',
        search: searchParams.get('q') || '',
        priceRange: [0, 100000],
        rating: 0,
        brand: '',
        discount: 0,
        availability: 'all',
        sortBy: 'newest'
    });

    useEffect(() => {
        const categoryParam = searchParams.get('category') || slug || '';
        if (categories.length > 0 && categoryParam) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryParam);
            if (isUUID) {
                setFilters(prev => ({ ...prev, category: categoryParam }));
            } else {
                const category = categories.find(c => c.slug === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase());
                if (category) setFilters(prev => ({ ...prev, category: category.id }));
            }
        }
    }, [categories, searchParams, slug]);

    // Fetch products on category/search change
    useEffect(() => {
        const delay = filters.search ? 350 : 0;
        const timer = setTimeout(() => {
            fetchProducts(1, 40, {
                categoryId: filters.category || undefined,
                search: filters.search || undefined
            });
        }, delay);
        return () => clearTimeout(timer);
    }, [filters.category, filters.search, fetchProducts]);

    // Calculate dynamic product counts per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        products.forEach(p => {
            if (p.categoryId) {
                counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
            }
            if (p.category) {
                const matchedCat = categories.find(c => c.name.toLowerCase() === p.category?.toLowerCase());
                if (matchedCat && matchedCat.id !== p.categoryId) {
                    counts[matchedCat.id] = (counts[matchedCat.id] || 0) + 1;
                }
            }
        });
        return counts;
    }, [products, categories]);

    // Robust Filtering Logic
    const filteredProducts = useMemo(() => {
        let filtered = [...products];
        
        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
        }
        
        if (filters.category) {
            const targetCat = categories.find(c => c.id === filters.category);
            filtered = filtered.filter(p => 
                p.categoryId === filters.category ||
                (targetCat && p.category?.toLowerCase() === targetCat.name.toLowerCase())
            );
        }
        
        if (filters.rating > 0) filtered = filtered.filter(p => (p.rating || 4.5) >= filters.rating);
        
        if (filters.discount > 0) {
            filtered = filtered.filter(p => {
                if (!p.originalPrice) return false;
                const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                return d >= filters.discount;
            });
        }
        
        if (filters.availability === 'in-stock') filtered = filtered.filter(p => p.stock > 0);

        filtered = filtered.filter(p => p.price >= (filters.priceRange[0] * 100) && p.price <= (filters.priceRange[1] * 100));
        
        return filtered;
    }, [products, categories, filters]);

    const sortedProducts = useMemo(() => {
        const sorted = [...filteredProducts];
        switch (filters.sortBy) {
            case 'price-low-high': return sorted.sort((a, b) => a.price - b.price);
            case 'price-high-low': return sorted.sort((a, b) => b.price - a.price);
            case 'rating': return sorted.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
            default: return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }, [filteredProducts, filters.sortBy]);

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Automatically scroll to top whenever filters change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [filters.category, filters.rating, filters.priceRange, filters.availability, filters.sortBy]);

    const toggleCompare = (id: string) => {
        setComparingIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(0, 4)
        );
    };

    // Sort categories by product count descending, and remove empty categories
    const sortedCategories = useMemo(() => {
        return [...categories]
            .filter(a => (categoryCounts[a.id] || 0) > 0)
            .sort((a, b) => {
                const countA = categoryCounts[a.id] || 0;
                const countB = categoryCounts[b.id] || 0;
                return countB - countA;
            });
    }, [categories, categoryCounts]);

    // Visible categories limit for smooth UX
    const visibleCategories = useMemo(() => {
        if (showAllCategories) return sortedCategories;
        return sortedCategories.slice(0, 7);
    }, [sortedCategories, showAllCategories]);

    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            <MobileProductHeader
                productCount={sortedProducts.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
                isFilterActive={isFilterOpen}
                onSearchChange={(value) => handleFilterChange('search', value)}
                searchValue={filters.search}
                categories={categories}
                selectedCategory={filters.category}
                onCategoryChange={(categoryId) => handleFilterChange('category', categoryId)}
            />

            <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8">

                {/* ── Sidebar Filters ── */}
                <aside className={`w-full lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                    <div className="lg:sticky lg:top-24 bg-white rounded-[24px] border border-black/[0.05] overflow-hidden">

                        {/* Filter Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05] bg-white">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-[#202124]" />
                                <h2 className="text-[14px] font-medium text-[#202124]">Filter Products</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setFilters({ category: '', search: '', priceRange: [0, 100000], rating: 0, brand: '', discount: 0, availability: 'all', sortBy: 'newest' });
                                        setPriceSliderValue(100000);
                                    }}
                                    className="text-[12px] font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                                >
                                    Clear all
                                </button>
                                <button onClick={() => setIsFilterOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-[#f1f3f4] cursor-pointer">
                                    <X className="h-4 w-4 text-[#5f6368]" />
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Section */}
                        <FilterSection
                            title="Category"
                            expanded={expandedFilters.category}
                            onToggle={() => setExpandedFilters(p => ({ ...p, category: !p.category }))}
                        >
                            <div className="pt-2 pb-3 px-2 space-y-1">
                                {/* All Categories Option */}
                                <button
                                    onClick={() => handleFilterChange('category', '')}
                                    className={`flex items-center justify-between w-full px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all cursor-pointer ${
                                        filters.category === ''
                                            ? 'bg-stone-900 text-white shadow-xs'
                                            : 'text-stone-700 hover:bg-stone-100'
                                    }`}
                                >
                                    <span>All Categories</span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                        filters.category === '' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                                    }`}>
                                        {products.length}
                                    </span>
                                </button>

                                {/* Individual Categories */}
                                {visibleCategories.map(c => {
                                    const count = categoryCounts[c.id] || 0;
                                    const isSelected = filters.category === c.id;

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => handleFilterChange('category', isSelected ? '' : c.id)}
                                            className={`flex items-center justify-between w-full px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-stone-900 text-white shadow-xs'
                                                    : 'text-stone-700 hover:bg-stone-100'
                                            }`}
                                        >
                                            <span className="truncate pr-2">{c.name}</span>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}

                                {categories.length > 7 && (
                                    <button
                                        onClick={() => setShowAllCategories(!showAllCategories)}
                                        className="w-full text-center py-2 text-[12px] font-medium text-stone-900 hover:bg-stone-100 rounded-xl transition-colors mt-1"
                                    >
                                        {showAllCategories ? 'Show Less ↑' : `+ ${categories.length - 7} More Categories`}
                                    </button>
                                )}
                            </div>
                        </FilterSection>

                        {/* Price Range Filter */}
                        <FilterSection
                            title="Price Range"
                            expanded={expandedFilters.price}
                            onToggle={() => setExpandedFilters(p => ({ ...p, price: !p.price }))}
                        >
                            <div className="px-4 pb-4 pt-2 space-y-4">
                                <div className="flex justify-between text-[13px] font-medium text-[#5f6368]">
                                    <span>₹0</span>
                                    <span className="text-[#202124]">₹{priceSliderValue.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100000"
                                    step="500"
                                    value={priceSliderValue}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setPriceSliderValue(val);
                                        if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
                                        priceDebounceRef.current = setTimeout(() => {
                                            handleFilterChange('priceRange', [0, val]);
                                        }, 300);
                                    }}
                                    className="w-full h-1 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-900"
                                />
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {[299, 499, 999, 2000].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setPriceSliderValue(p);
                                                handleFilterChange('priceRange', [0, p]);
                                            }}
                                            className={`text-[12px] px-3 py-1.5 rounded-full border cursor-pointer font-medium transition-colors ${
                                                priceSliderValue === p
                                                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                            }`}
                                        >
                                            Under ₹{p.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FilterSection>

                        {/* Rating Filter */}
                        <FilterSection
                            title="Customer Rating"
                            expanded={expandedFilters.rating}
                            onToggle={() => setExpandedFilters(p => ({ ...p, rating: !p.rating }))}
                        >
                            <div className="pt-1 pb-3 px-2 space-y-1">
                                {[4, 3, 2, 1].map(stars => (
                                    <button
                                        key={stars}
                                        onClick={() => handleFilterChange('rating', filters.rating === stars ? 0 : stars)}
                                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all ${
                                            filters.rating === stars ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}`} />
                                                ))}
                                            </div>
                                            <span>& Up</span>
                                        </div>
                                        {filters.rating === stars && <Check className="w-4 h-4 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Availability */}
                        <FilterSection
                            title="Availability"
                            expanded={expandedFilters.availability}
                            onToggle={() => setExpandedFilters(p => ({ ...p, availability: !p.availability }))}
                        >
                            <div className="px-4 pb-4 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.availability === 'in-stock'}
                                        onChange={() => handleFilterChange('availability', filters.availability === 'in-stock' ? 'all' : 'in-stock')}
                                        className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                    />
                                    <span className="text-[13px] text-stone-600 font-medium group-hover:text-stone-900">In Stock Only</span>
                                </label>
                            </div>
                        </FilterSection>

                    </div>
                </aside>

                {/* ── Main Product Display Area ── */}
                <main className="flex-1 min-w-0">
                    
                    {/* Top Control Bar */}
                    <div className="hidden md:flex bg-white rounded-[24px] border border-stone-200 p-4 mb-6 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                                    isFilterOpen ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Filter</span>
                            </button>
                            <span className="text-[13px] font-medium text-stone-500">
                                Showing <strong className="text-stone-900">{sortedProducts.length}</strong> Products
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="h-10 bg-white border border-stone-200 rounded-xl text-[13px] font-medium px-4 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 cursor-pointer text-stone-800"
                            >
                                <option value="newest">Sort by: Newest Arrivals</option>
                                <option value="price-low-high">Price: Low to High</option>
                                <option value="price-high-low">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                            </select>

                            {/* View Mode Switcher */}
                            <div className="flex bg-[#f1f3f4] p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
                                    aria-label="Grid View"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
                                    aria-label="List View"
                                >
                                    <LayoutList className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Pill Bar */}
                    {(filters.category || filters.rating > 0 || filters.priceRange[1] < 100000 || filters.search) && (
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="text-[12px] font-medium text-[#5f6368] mr-1">Active Filters:</span>
                            {filters.category && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dadce0] text-[12px] font-medium text-[#3c4043]">
                                    {categories.find(c => c.id === filters.category)?.name || 'Category'}
                                    <X className="w-3.5 h-3.5 cursor-pointer text-[#5f6368] hover:text-[#202124]" onClick={() => handleFilterChange('category', '')} />
                                </span>
                            )}
                            {filters.rating > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dadce0] text-[12px] font-medium text-[#3c4043]">
                                    {filters.rating}+ Stars
                                    <X className="w-3.5 h-3.5 cursor-pointer text-[#5f6368] hover:text-[#202124]" onClick={() => handleFilterChange('rating', 0)} />
                                </span>
                            )}
                            {filters.priceRange[1] < 100000 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#dadce0] text-[12px] font-medium text-[#3c4043]">
                                    Under ₹{filters.priceRange[1].toLocaleString()}
                                    <X className="w-3.5 h-3.5 cursor-pointer text-[#5f6368] hover:text-[#202124]" onClick={() => { setPriceSliderValue(100000); handleFilterChange('priceRange', [0, 100000]); }} />
                                </span>
                            )}
                        </div>
                    )}

                    {/* Product Grid — EXACTLY 4 PRODUCTS PER ROW ON DESKTOP */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[3/4] bg-white border border-black/[0.05] rounded-3xl hidden" />)}
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[24px] border border-black/[0.05]">
                            <Wind className="h-12 w-12 text-[#dadce0] mx-auto mb-4" />
                            <h3 className="text-[20px] font-normal text-[#202124] mb-2">No products found for this filter</h3>
                            <p className="text-[14px] text-[#5f6368] max-w-sm mx-auto mb-6">Try clearing active filters or searching for another fragrance category.</p>
                            <button 
                               onClick={() => setFilters({ category: '', search: '', priceRange: [0, 100000], rating: 0, brand: '', discount: 0, availability: 'all', sortBy: 'newest' })}
                               className="px-6 py-3 bg-[#f1f3f4] text-[#202124] rounded-full text-[14px] font-medium hover:bg-[#e8eaed] transition-colors"
                            >
                               Reset All Filters
                            </button>
                        </div>
                    ) : (
                        <div className={
                            viewMode === 'grid' 
                                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-5" 
                                : "space-y-4"
                        }>
                            {sortedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isListView={viewMode === 'list'}
                                    onCompareToggle={toggleCompare}
                                    isComparing={comparingIds.includes(product.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-2">
                            <button 
                                onClick={() => { fetchProducts(pagination.page - 1, 40, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={pagination.page === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4 text-stone-700" />
                            </button>
                            <div className="flex gap-1.5">
                                {Array.from({ length: pagination.pages }).map((_, i) => (
                                     <button 
                                        key={i}
                                        onClick={() => { fetchProducts(i + 1, 40, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-10 h-10 rounded-full text-[14px] font-medium transition-all cursor-pointer ${pagination.page === i + 1 ? 'bg-stone-900 text-white shadow-xs' : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => { fetchProducts(pagination.page + 1, 40, { categoryId: filters.category || undefined, search: filters.search || undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={pagination.page === pagination.pages}
                                className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4 text-stone-700" />
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const FilterSection: React.FC<{ title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }> = memo(({ title, expanded, onToggle, children }) => (
    <div className="border-t border-black/[0.05]">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full px-4 py-4 cursor-pointer hover:bg-[#f8f9fa] transition-colors"
        >
            <span className="text-[13px] font-medium uppercase tracking-wide text-[#5f6368]">{title}</span>
            <ChevronDown className={`h-4 w-4 text-[#5f6368] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && children}
    </div>
));
FilterSection.displayName = 'FilterSection';

export default ProductsPage;
