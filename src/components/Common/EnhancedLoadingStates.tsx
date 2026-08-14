import React from 'react';
import { Package, Search } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No data found',
    description = 'There is no data to display at the moment.',
    icon: Icon = Package,
    action,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
            <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Icon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 mb-4">{description}</p>
            {action && <div className="mt-2">{action}</div>}
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
                    className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hidden ${className}`}
                >
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-200 rounded-lg h-16 w-16" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
        <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
            <div className="hidden">
                {/* Table header */}
                <div className="border-b border-gray-200 px-6 py-3">
                    <div className="flex space-x-4">
                        {Array.from({ length: columns }).map((_, index) => (
                            <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
                        ))}
                    </div>
                </div>

                {/* Table rows */}
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="border-b border-gray-200 px-6 py-4">
                        <div className="flex space-x-4">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={colIndex} className="h-4 bg-gray-200 rounded w-full"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
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
                <div className={`space-y-3 ${className}`}>
                    {Array.from({ length: count }).map((_, index) => (
                        <div key={index} className="h-4 bg-gray-200 rounded hidden"></div>
                    ))}
                </div>
            );
        case 'text':
            return (
                <div className={`space-y-2 ${className}`}>
                    {Array.from({ length: count }).map((_, index) => (
                        <div key={index} className="h-3 bg-gray-200 rounded hidden"></div>
                    ))}
                </div>
            );
        default:
            return <CardSkeleton count={count} className={className} />;
    }
};

interface AdminLoadingStateProps {
    title?: string;
    subtitle?: string;
    showProgressBar?: boolean;
    className?: string;
}

export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({
    title = 'Loading...',
    subtitle = 'Please wait while we load the content',
    showProgressBar = true,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <div className="mb-4">
                <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full hidden"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500">{subtitle}</p>
            {showProgressBar && (
                <div className="mt-6 w-64 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full hidden" style={{ width: '75%' }}></div>
                </div>
            )}
        </div>
    );
};