import React from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  description = 'There is no data to display at the moment.',
  icon: Icon = Package,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-16 h-16 bg-stone-100 border border-stone-200 rounded-3xl flex items-center justify-center mb-4 text-stone-700 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  className = ''
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-xs animate-pulse ${className}`}
        >
          <div className="flex items-center space-x-4">
            <div className="bg-stone-200 rounded-xl h-16 w-16" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="h-3 bg-stone-100 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs animate-pulse ${className}`}>
      <div className="border-b border-stone-100 px-6 py-4 bg-stone-50">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-3.5 bg-stone-200 rounded w-full" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-stone-100 px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-3 bg-stone-100 rounded w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'text';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  className = ''
}) => {
  switch (type) {
    case 'card':
      return <CardSkeleton count={count} className={className} />;
    case 'table':
      return <TableSkeleton rows={count} className={className} />;
    case 'list':
      return (
        <div className={`space-y-3 animate-pulse ${className}`}>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="h-12 bg-stone-100 rounded-xl" />
          ))}
        </div>
      );
    case 'text':
      return (
        <div className={`space-y-2 animate-pulse ${className}`}>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="h-3 bg-stone-100 rounded" />
          ))}
        </div>
      );
    default:
      return <CardSkeleton count={count} className={className} />;
  }
};

export const AdminLoadingState: React.FC<{ title?: string; subtitle?: string; className?: string }> = ({
  title = 'Loading...',
  subtitle = 'Please wait while we load the content',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mb-4" />
      <h3 className="text-sm font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500">{subtitle}</p>
    </div>
  );
};
