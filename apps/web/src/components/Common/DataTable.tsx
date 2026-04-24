import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Check if we're in admin context by checking the pathname
const isAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
};

// Component to load admin settings
const AdminSettingsLoader: React.FC<{ onSettingsLoad: (settings: any) => void }> = ({ onSettingsLoad }) => {
  const onSettingsLoadRef = React.useRef(onSettingsLoad);
  const lastSettingsRef = React.useRef<string | null>(null);
  
  // Keep ref updated
  React.useEffect(() => {
    onSettingsLoadRef.current = onSettingsLoad;
  }, [onSettingsLoad]);
  
  // Poll localStorage for settings updates
  useEffect(() => {
    if (!isAdminRoute()) return;
    
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem('admin_dashboard_settings');
        if (cached) {
          // Only update if settings actually changed
          if (cached !== lastSettingsRef.current) {
            lastSettingsRef.current = cached;
            const parsed = JSON.parse(cached);
            if (parsed.settings) {
              onSettingsLoadRef.current(parsed.settings);
            }
          }
        }
      } catch (error) {
        // Ignore
      }
    };
    
    // Load once immediately
    loadFromCache();
    
    // Then poll every 2 seconds (reduced frequency)
    const interval = setInterval(loadFromCache, 2000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once
  
  return null;
};

// Safe hook to get admin dashboard settings
const useAdminSettings = () => {
  const [settings, setSettings] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  useEffect(() => {
    setIsAdmin(isAdminRoute());
  }, []);
  
  // Memoize the settings loader to prevent recreating on every render
  const SettingsLoader = React.useMemo(() => {
    return () => <AdminSettingsLoader onSettingsLoad={setSettings} />;
  }, []);
  
  return { 
    settings, 
    isAdminContext: isAdmin,
    SettingsLoader
  };
};

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  onRowClick,
  pagination,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get admin settings if in admin context
  const { settings, isAdminContext, SettingsLoader } = useAdminSettings();

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortColumn];
      const bValue = (b as any)[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const renderSortIcon = (columnKey: string) => {
    const iconColor = isAdminContext && settings 
      ? settings.primary_color_from 
      : '#d97706';
    
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4" style={{ color: isAdminContext ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af' }} />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" style={{ color: iconColor }} />
    ) : (
      <ChevronDown className="h-4 w-4" style={{ color: iconColor }} />
    );
  };

  if (loading) {
    return (
      <div 
        className={`rounded-2xl border overflow-hidden ${isAdminContext 
          ? 'bg-white/5 backdrop-blur-sm border-white/10' 
          : 'bg-white shadow-sm border-gray-200'}`}
      >
        <div className="overflow-x-auto">
          <table className={`min-w-full ${isAdminContext ? 'divide-y divide-white/10' : 'divide-y divide-gray-200'}`}>
            <thead className={isAdminContext ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isAdminContext 
                      ? 'text-white/60' 
                      : 'text-gray-500'}`}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isAdminContext ? 'bg-white/5 divide-y divide-white/10' : 'bg-white divide-y divide-gray-200'}>
              {[...Array(5)].map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-4 rounded animate-pulse ${isAdminContext ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className={`rounded-2xl border p-12 text-center ${isAdminContext 
          ? 'bg-white/5 backdrop-blur-sm border-white/10' 
          : 'bg-white shadow-sm border-gray-200'}`}
      >
        <p className={isAdminContext ? 'text-white/60' : 'text-gray-500'}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {isAdminContext && SettingsLoader && <SettingsLoader />}
      <div 
        className={`rounded-2xl border overflow-hidden ${isAdminContext 
          ? 'bg-white/5 backdrop-blur-sm border-white/10' 
          : 'bg-white shadow-sm border-gray-200'}`}
      >
      {/* Mobile-friendly horizontal scroll with sticky first column */}
      <div className="overflow-x-auto">
        <table className={`min-w-full ${isAdminContext ? 'divide-y divide-white/10' : 'divide-y divide-gray-200'}`}>
          <thead className={`sticky top-0 z-10 ${isAdminContext ? 'bg-white/5' : 'bg-gray-50'}`}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${isAdminContext 
                    ? `text-white/60 ${column.sortable ? 'cursor-pointer select-none hover:bg-white/10 active:bg-white/15' : ''} ${index === 0 ? 'sticky left-0 bg-white/5 z-20' : ''}`
                    : `text-gray-500 ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 active:bg-gray-200' : ''} ${index === 0 ? 'sticky left-0 bg-gray-50 z-20' : ''}`}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isAdminContext ? 'bg-white/5 divide-y divide-white/10' : 'bg-white divide-y divide-gray-200'}>
            {sortedData.map((item) => (
              <tr
                key={item.id}
                className={`${onRowClick
                  ? isAdminContext 
                    ? 'cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors'
                    : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors'
                  : ''
                  }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm ${isAdminContext 
                      ? `text-white ${index === 0 ? 'sticky left-0 bg-white/5 z-10' : ''}`
                      : `text-gray-900 ${index === 0 ? 'sticky left-0 bg-white z-10' : ''}`}`}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div 
          className={`px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 ${isAdminContext 
            ? 'bg-white/5 border-white/10' 
            : 'bg-gray-50 border-gray-200'}`}
        >
          <div className={`text-xs sm:text-sm order-2 sm:order-1 ${isAdminContext ? 'text-white/60' : 'text-gray-700'}`}>
            <span className="hidden sm:inline">Showing </span>
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>
            <span className="hidden sm:inline"> to </span>
            <span className={`hidden sm:inline ${isAdminContext ? 'text-white/60' : 'text-gray-700'}`}>-</span>
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}
            </span>
            <span className="hidden sm:inline"> of </span>
            <span className="font-medium">{pagination.totalItems}</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 order-1 sm:order-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${isAdminContext 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
                : 'border-gray-300 hover:bg-gray-100 active:bg-gray-200'}`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 1 &&
                    page <= pagination.currentPage + 1)
                ) {
                  const isActive = page === pagination.currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => pagination.onPageChange(page)}
                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${isActive
                        ? isAdminContext && settings
                          ? 'text-white'
                          : 'bg-amber-600 text-white'
                        : isAdminContext
                          ? 'text-white/60 hover:bg-white/10 active:bg-white/15'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                      style={isActive && isAdminContext && settings ? {
                        background: `linear-gradient(to right, ${settings.primary_color_from}, ${settings.primary_color_to})`
                      } : undefined}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pagination.currentPage - 2 ||
                  page === pagination.currentPage + 2
                ) {
                  return (
                    <span key={page} className={`px-2 ${isAdminContext ? 'text-white/40' : 'text-gray-400'}`}>
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`p-2 rounded-lg border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${isAdminContext 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
                : 'border-gray-300 hover:bg-gray-100 active:bg-gray-200'}`}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

