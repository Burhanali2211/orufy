import { useQueryState, parseAsString, parseAsInteger, parseAsBoolean } from 'nuqs';

export function useProductFilters() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all'));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('newest'));
  const [minPrice, setMinPrice] = useQueryState('min_price', parseAsInteger.withDefault(0));
  const [maxPrice, setMaxPrice] = useQueryState('max_price', parseAsInteger.withDefault(100000));
  const [inStockOnly, setInStockOnly] = useQueryState('in_stock', parseAsBoolean.withDefault(false));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setSort('newest');
    setMinPrice(0);
    setMaxPrice(100000);
    setInStockOnly(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || 
    (category && category !== 'all') || 
    (sort && sort !== 'newest') || 
    minPrice > 0 || 
    maxPrice < 100000 || 
    inStockOnly || 
    page > 1
  );

  return {
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    inStockOnly,
    setInStockOnly,
    page,
    setPage,
    resetFilters,
    hasActiveFilters,
  };
}
