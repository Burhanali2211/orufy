import React, { useEffect, useState } from 'react';

interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  className?: string;
  responsive?: 'all' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
}

interface ResponsiveTableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (record: T) => void;
  emptyMessage?: string;
  className?: string;
}

export const ResponsiveTable = <T extends Record<string, unknown> = Record<string, unknown>>(
  props: ResponsiveTableProps<T>
) => {
  const {
    columns,
    data,
    loading = false,
    onRowClick,
    emptyMessage = 'No data available',
    className = ''
  } = props;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter columns based on responsive breakpoints
  const visibleColumns = columns.filter(col => {
    if (col.responsive === 'all' || !col.responsive) return true;
    
    const breakpoints: Record<string, number> = {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    };
    
    return windowWidth >= (breakpoints[col.responsive] || 0);
  });

  // Calculate if we should use fixed table layout
  const hasColumnWidths = visibleColumns.some(col => col.width || col.minWidth || col.maxWidth);
  const useFixedLayout = hasColumnWidths && windowWidth >= 768;

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table 
          className={`min-w-full divide-y divide-gray-200 ${useFixedLayout ? '' : ''}`}
          style={{ tableLayout: useFixedLayout ? 'fixed' : 'auto' }}
        >
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  style={{ 
                    width: column.width ? (typeof column.width === 'string' ? column.width : `${column.width}px`) : 'auto',
                    minWidth: column.minWidth ? (typeof column.minWidth === 'string' ? column.minWidth : `${column.minWidth}px`) : 'auto',
                    maxWidth: column.maxWidth ? (typeof column.maxWidth === 'string' ? column.maxWidth : `${column.maxWidth}px`) : 'none'
                  }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{emptyMessage}</h3>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={(record['id'] as string) || index}
                  onClick={() => onRowClick?.(record)}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={`${(record['id'] as string) || index}-${column.key}`}
                      className={`px-6 py-4 text-sm ${column.className || ''}`}
                      style={{
                        width: column.width ? (typeof column.width === 'string' ? column.width : `${column.width}px`) : 'auto',
                        minWidth: column.minWidth ? (typeof column.minWidth === 'string' ? column.minWidth : `${column.minWidth}px`) : 'auto',
                        maxWidth: column.maxWidth ? (typeof column.maxWidth === 'string' ? column.maxWidth : `${column.maxWidth}px`) : 'none',
                        whiteSpace: column.width || column.maxWidth ? 'nowrap' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {column.render
                        ? column.render(record[column.key], record)
                        : (record[column.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{emptyMessage}</h3>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.map((record, index) => (
              <div
                key={(record['id'] as string) || index}
                onClick={() => onRowClick?.(record)}
                className={`p-4 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <div className="space-y-3">
                  {visibleColumns.map((column) => (
                    <div key={`${(record['id'] as string) || index}-${column.key}`} className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">{column.title}</dt>
                      <dd className="text-sm text-gray-900 break-words max-w-[60%]">
                        {column.render
                          ? column.render(record[column.key], record)
                          : (record[column.key] as React.ReactNode)}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};