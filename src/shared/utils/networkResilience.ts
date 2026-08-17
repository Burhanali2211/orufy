/**
 * Lightweight Network Resilience Types & Primitives
 */

export type RequestPriority = 'critical' | 'high' | 'normal' | 'low';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: '4g',
  };
}

export function useGracefulDegradation() {
  return {
    degradationLevel: 'none' as const,
    shouldLoadImages: true,
    shouldLoadAnimations: true,
    shouldUseOptimizedQueries: false,
  };
}