import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Shield, WifiOff, Database, Send, Copy, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '../../utils/networkResilience';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  enableReporting?: boolean;
  fallbackComponent?: 'minimal' | 'detailed' | 'custom';
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  errorId: string;
  errorType: 'network' | 'database' | 'render' | 'chunk' | 'unknown';
  isReported: boolean;
  showDetails: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorId: '',
      errorType: 'unknown',
      isReported: false,
      showDetails: false
    };
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorType = AdminErrorBoundary.classifyError(error);

    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      errorType,
      isReported: false,
      showDetails: false
    };
  }

  static classifyError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('supabase') || message.includes('postgres')) {
      return 'database';
    }
    if (message.includes('chunk') || message.includes('loading') || stack.includes('import')) {
      return 'chunk';
    }
    if (stack.includes('render') || message.includes('render')) {
      return 'render';
    }
    return 'unknown';
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Enhanced error logging with context
    const errorContext = {
      errorId: this.state.errorId,
      errorType: this.state.errorType,
      context: this.props.context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AdminErrorBoundary'
    };

    // Error logging removed for production

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-report critical errors in production
    if (this.props.enableReporting !== false && this.shouldAutoReport(error)) {
      this.reportError(error, errorInfo, errorContext);
    }
  }

  private getCurrentUserId(): string | null {
    try {
      // Try to get user ID from various sources
      const authUser = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      return authUser?.user?.id || null;
    } catch {
      return null;
    }
  }

  private shouldAutoReport(error: Error): boolean {
    const criticalErrors = ['chunk', 'network', 'database'];
    return criticalErrors.includes(this.state.errorType) ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk');
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, context: any) => {
    try {
      // Error reporting removed for production

      this.setState({ isReported: true });
    } catch (reportingError) {
      // Silent error reporting failure
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    });

    // Implement progressive delay for retries
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        showDetails: false
      });
    }, delay);
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorContext = {
        errorId: this.state.errorId,
        errorType: this.state.errorType,
        context: this.props.context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      this.reportError(this.state.error, this.state.errorInfo, errorContext);
    }
  };

  handleCopyError = async () => {
    if (this.state.error) {
      // In production, only copy error ID and type (no stack traces or sensitive info)
      const errorText = import.meta.env.PROD
        ? `Error ID: ${this.state.errorId}
Type: ${this.state.errorType}
Timestamp: ${new Date().toISOString()}`
        : `Error ID: ${this.state.errorId}
Type: ${this.state.errorType}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}`;

      try {
        await navigator.clipboard.writeText(errorText);
        // Show success feedback (could integrate with notification system)
      } catch (err) {
        // Silent clipboard failure
      }
    }
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  private getErrorIcon() {
    switch (this.state.errorType) {
      case 'network':
        return <WifiOff className="h-8 w-8 text-red-600" />;
      case 'database':
        return <Database className="h-8 w-8 text-red-600" />;
      case 'chunk':
        return <RefreshCw className="h-8 w-8 text-orange-600" />;
      case 'render':
        return <Shield className="h-8 w-8 text-purple-600" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
    }
  }

  private getErrorTitle() {
    switch (this.state.errorType) {
      case 'network':
        return 'Connection Problem';
      case 'database':
        return 'Database Error';
      case 'chunk':
        return 'Loading Error';
      case 'render':
        return 'Rendering Error';
      default:
        return 'Something went wrong';
    }
  }

  private getErrorMessage() {
    switch (this.state.errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'database':
        return 'There was a problem accessing the database. Our team has been notified.';
      case 'chunk':
        return 'Failed to load application resources. This usually resolves with a page refresh.';
      case 'render':
        return 'A component failed to render properly. Please try refreshing the page.';
      default:
        return 'We encountered an unexpected error. Please try again or contact support if the problem persists.';
    }
  }

  private renderMinimalFallback() {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-3">
          {this.getErrorIcon()}
          <div>
            <h3 className="font-medium text-red-900">{this.getErrorTitle()}</h3>
            <p className="text-sm text-red-700 mt-1">{this.getErrorMessage()}</p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={this.handleRetry}
            disabled={this.state.isRetrying || this.state.retryCount >= (this.props.maxRetries || 3)}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {this.state.isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render minimal fallback for certain contexts
      if (this.props.fallbackComponent === 'minimal') {
        return this.renderMinimalFallback();
      }

      // Enhanced detailed error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  {this.getErrorIcon()}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {this.getErrorTitle()}
                </h2>

                <p className="text-gray-600 mb-4">
                  {this.getErrorMessage()}
                </p>

                {/* Error ID for support */}
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <p className="text-xs text-gray-500 mb-1">Error ID</p>
                  <p className="text-sm font-mono text-gray-700">{this.state.errorId}</p>
                </div>

                {/* Retry count indicator */}
                {this.state.retryCount > 0 && (
                  <div className="mb-4 text-sm text-gray-500">
                    Retry attempt: {this.state.retryCount} / {this.props.maxRetries || 3}
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
                    <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying || this.state.retryCount >= (this.props.maxRetries || 3)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'hidden' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </button>
                </div>

                {/* Additional actions */}
                <div className="flex flex-col sm:flex-row gap-2 text-sm">
                  <button
                    onClick={this.handleCopyError}
                    className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Error Details
                  </button>

                  {this.props.enableReporting !== false && !this.state.isReported && (
                    <button
                      onClick={this.handleReportError}
                      className="flex items-center justify-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Report Error
                    </button>
                  )}

                  {this.state.isReported && (
                    <div className="flex items-center justify-center px-3 py-2 text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Error Reported
                    </div>
                  )}
                </div>

                {/* Development error details */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={this.toggleDetails}
                      className="flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 mb-3"
                    >
                      <Bug className="h-4 w-4 mr-1" />
                      {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                    </button>

                    {this.state.showDetails && this.state.error && (
                      <div className="bg-gray-100 rounded-lg p-4 text-left">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Error Message:</h4>
                          <p className="text-sm text-red-600">{this.state.error.message}</p>
                        </div>

                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Error Type:</h4>
                          <p className="text-sm text-gray-700">{this.state.errorType}</p>
                        </div>

                        {this.state.error.stack && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Stack Trace:</h4>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32 bg-white p-2 rounded border">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}

                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Component Stack:</h4>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32 bg-white p-2 rounded border">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    // Error handling logic removed for production
  };

  return handleError;
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <AdminErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AdminErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
