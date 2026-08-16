import React, { memo } from 'react';
import { Loader, AlertCircle, CheckCircle, WifiOff, RefreshCw } from 'lucide-react';

export type LoaderType = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoaderStatus = 'loading' | 'success' | 'error' | 'offline' | 'retry';

interface UniversalLoaderProps {
    type?: LoaderType;
    size?: LoaderSize;
    status?: LoaderStatus;
    text?: string;
    subText?: string;
    progress?: number; // 0-100
    overlay?: boolean;
    className?: string;
    onRetry?: () => void;
    showIcon?: boolean;
    animated?: boolean;
}

const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
};

const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
};

export const UniversalLoader = memo<UniversalLoaderProps>(({
    type = 'spinner',
    size = 'md',
    status = 'loading',
    text,
    subText,
    progress = 0,
    overlay = false,
    className = '',
    onRetry,
    showIcon = true,
    animated = true
}) => {
    const getIcon = () => {
        if (!showIcon) return null;

        const iconClass = `${sizeClasses[size]} ${status === 'loading' ? 'text-blue-500' :
                status === 'success' ? 'text-green-500' :
                    status === 'error' ? 'text-red-500' :
                        status === 'offline' ? 'text-gray-500' :
                            'text-blue-500'
            }`;

        switch (status) {
            case 'success':
                return <CheckCircle className={iconClass} />;
            case 'error':
                return <AlertCircle className={iconClass} />;
            case 'offline':
                return <WifiOff className={iconClass} />;
            case 'retry':
                return <RefreshCw className={`${iconClass} ${animated ? 'hidden' : ''}`} />;
            default:
                return <Loader className={`${iconClass} ${animated ? 'hidden' : ''}`} />;
        }
    };

    const getLoaderContent = () => {
        switch (type) {
            case 'dots':
                return (
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`${sizeClasses[size]} bg-blue-500 rounded-full ${animated ? 'hidden' : ''
                                    }`}
                                style={{
                                    animationDelay: `${i * 0.2}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                );

            case 'pulse':
                return (
                    <div
                        className={`${sizeClasses[size]} bg-blue-500 rounded-full ${animated ? 'hidden' : ''
                            }`}
                    />
                );

            case 'skeleton':
                return (
                    <div className="space-y-2">
                        <div className={`h-4 bg-gray-200 rounded ${animated ? 'hidden' : ''}`} />
                        <div className={`h-4 bg-gray-200 rounded w-3/4 ${animated ? 'hidden' : ''}`} />
                        <div className={`h-4 bg-gray-200 rounded w-1/2 ${animated ? 'hidden' : ''}`} />
                    </div>
                );

            case 'progress':
                return (
                    <div className="w-full max-w-xs">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                        </div>
                        {text && (
                            <p className={`mt-2 text-center ${textSizeClasses[size]} text-gray-600`}>
                                {text}
                            </p>
                        )}
                    </div>
                );

            default: // spinner
                return getIcon();
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            case 'offline':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const content = (
        <div className={`flex flex-col items-center justify-center py-4 ${className}`}>
            <div className="flex flex-col items-center space-y-2">
                {getLoaderContent()}

                {text && (
                    <p className={`${textSizeClasses[size]} font-medium ${getStatusColor()}`}>
                        {text}
                    </p>
                )}

                {subText && (
                    <p className={`${textSizeClasses[size === 'xs' ? 'xs' : 'sm']} text-gray-500 text-center max-w-xs`}>
                        {subText}
                    </p>
                )}

                {status === 'error' && onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                )}

                {status === 'offline' && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                        <WifiOff className="h-3 w-3 mr-1" />
                        <span>Check your internet connection</span>
                    </div>
                )}
            </div>
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
                    {content}
                </div>
            </div>
        );
    }

    return content;
});

UniversalLoader.displayName = 'UniversalLoader';

// Convenience components for common use cases
export const PageLoader = memo<Omit<UniversalLoaderProps, 'type' | 'size'>>((props) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <UniversalLoader type="spinner" size="lg" {...props} />
    </div>
));

export const CardLoader = memo<Omit<UniversalLoaderProps, 'type' | 'size'>>((props) => (
    <div className="p-6">
        <UniversalLoader type="skeleton" size="md" {...props} />
    </div>
));

export const ButtonLoader = memo<Omit<UniversalLoaderProps, 'type' | 'size'>>((props) => (
    <UniversalLoader type="spinner" size="sm" {...props} />
));

export const InlineLoader = memo<Omit<UniversalLoaderProps, 'type' | 'size'>>((props) => (
    <UniversalLoader type="dots" size="sm" {...props} />
));

// Progressive loading component
interface ProgressiveLoaderProps {
    stages: Array<{
        name: string;
        description?: string;
        completed: boolean;
        loading: boolean;
        error?: boolean;
    }>;
    className?: string;
}

export const ProgressiveLoader = memo<ProgressiveLoaderProps>(({
    stages,
    className = ''
}) => {
    const completedStages = stages.filter(stage => stage.completed).length;
    const totalStages = stages.length;
    const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Loading Content</h3>
                    <span className="text-xs text-gray-500">{completedStages}/{totalStages}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3">
                {stages.map((stage, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            {stage.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : stage.error ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : stage.loading ? (
                                <Loader className="h-4 w-4 text-blue-500 hidden" />
                            ) : (
                                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${stage.completed ? 'text-green-600' :
                                    stage.error ? 'text-red-600' :
                                        stage.loading ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                {stage.name}
                            </p>
                            {stage.description && (
                                <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

ProgressiveLoader.displayName = 'ProgressiveLoader';

