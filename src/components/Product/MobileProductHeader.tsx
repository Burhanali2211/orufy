import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid3X3, LayoutList, SlidersHorizontal, ChevronRight, ArrowLeft } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug?: string;
}

interface MobileProductHeaderProps {
    productCount: number;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onFilterClick: () => void;
    isFilterActive: boolean;
    onSearchChange: (value: string) => void;
    searchValue: string;
    categories: Category[];
    selectedCategory?: string;
    onCategoryChange: (categoryId: string) => void;
}

export const MobileProductHeader: React.FC<MobileProductHeaderProps> = ({
    productCount,
    viewMode,
    onViewModeChange,
    onFilterClick,
    isFilterActive,
    onSearchChange,
    searchValue,
    categories,
    selectedCategory = '',
    onCategoryChange
}) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="md:hidden bg-white border-b border-black/[0.05] sticky top-0 z-40">
            {/* Header with back button and greeting */}
            <div className="px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-colors"
                    title="Go back"
                >
                    <ArrowLeft className="h-5 w-5 text-[#5f6368]" />
                </button>
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#5f6368] font-medium">Welcome back</span>
                    </div>
                    <h1 className="text-[18px] font-medium text-[#202124]">Discover Products</h1>
                </div>
            </div>

            {/* Search bar with integrated filter button */}
            <div className="px-4 pb-3 flex items-center gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f6368]" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f1f3f4] rounded-full text-[14px] font-medium text-[#202124] placeholder:text-[#5f6368] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1A73E8] transition-colors"
                    />
                </div>
                <button
                    onClick={onFilterClick}
                    className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-all ${
                        isFilterActive
                            ? 'bg-[#e8f0fe] text-[#1A73E8]'
                            : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'
                    }`}
                    title="Toggle filters"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </button>
            </div>

            {/* Horizontally scrollable category pills */}
            <div className="px-4 pb-3 flex items-center gap-2">
                <div
                    ref={scrollContainerRef}
                    className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide"
                >
                    {/* All Items */}
                    <button
                        onClick={() => onCategoryChange('')}
                        className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
                            selectedCategory === ''
                                ? 'bg-[#e8f0fe] text-[#1A73E8] border-[#1A73E8]'
                                : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]'
                        }`}
                    >
                        All Items
                    </button>

                    {/* Category pills */}
                    {categories.slice(0, 5).map(category => (
                        <button
                            key={category.id}
                            onClick={() => onCategoryChange(category.id)}
                            className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
                                selectedCategory === category.id
                                    ? 'bg-[#e8f0fe] text-[#1A73E8] border-[#1A73E8]'
                                    : 'bg-white border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* View mode toggle */}
                <div className="flex bg-[#f1f3f4] rounded-full p-1 shrink-0">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-white text-[#202124] shadow-sm'
                                : 'text-[#5f6368] hover:text-[#202124]'
                        }`}
                        title="Grid view"
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                            viewMode === 'list'
                                ? 'bg-white text-[#202124] shadow-sm'
                                : 'text-[#5f6368] hover:text-[#202124]'
                        }`}
                        title="List view"
                    >
                        <LayoutList className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
