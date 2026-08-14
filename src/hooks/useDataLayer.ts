import { useState, useEffect, useCallback, useRef } from 'react';
import { dataLayer, DataLayerResponse, QueryOptions, MutationOptions } from '../utils/dataLayer';
import { optimisticUpdates } from '../utils/optimisticUpdates';
import { offlineSync } from '../utils/offlineSync';

// Query state
interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
}

// Mutation state
interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables?: any) => Promise<T>;
  reset: () => void;
}

// Optimistic update state
interface OptimisticState {
  hasPendingUpdates: boolean;
  pendingCount: number;
  rollback: (updateId?: string) => Promise<void>;
}

/**
 * Hook for querying data with intelligent caching
 */
export function useQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  entityType: string = 'default',
  options: QueryOptions & {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
): QueryState<T> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
    fromCache: boolean;
    lastUpdated: number | null;
  }>({
    data: null,
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: null
  });

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  const queryFnRef = useRef(queryFn);
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update query function ref
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const executeQuery = useCallback(async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const isStale = now - lastFetchRef.current > staleTime;
    
    if (!force && !isStale && state.data !== null) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response: DataLayerResponse<T> = await dataLayer.query(
        key,
        queryFnRef.current,
        entityType,
        queryOptions
      );

      setState({
        data: response.data,
        loading: false,
        error: null,
        fromCache: response.fromCache,
        lastUpdated: response.timestamp
      });

      lastFetchRef.current = now;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
    }
  }, [key, entityType, enabled, staleTime, state.data, queryOptions]);

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  // Initial fetch
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => executeQuery();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, executeQuery]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    intervalRef.current = setInterval(() => executeQuery(), refetchInterval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, executeQuery]);

  return {
    ...state,
    refetch
  };
}

/**
 * Hook for mutations with optimistic updates
 */
export function useMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  entityType: string,
  options: MutationOptions & {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    onSettled?: (data: T | null, error: Error | null, variables: V) => void;
  } = {}
): MutationState<T> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const { onSuccess, onError, onSettled, ...mutationOptions } = options;

  const mutate = useCallback(async (variables: V): Promise<T> => {
    setState({ data: null, loading: true, error: null });

    try {
      const response: DataLayerResponse<T> = await dataLayer.mutate(
        `${entityType}_${Date.now()}`,
        () => mutationFn(variables),
        entityType,
        variables?.id || 'unknown',
        mutationOptions
      );

      setState({
        data: response.data,
        loading: false,
        error: null
      });

      onSuccess?.(response.data, variables);
      onSettled?.(response.data, null, variables);

      return response.data;
    } catch (error) {
      const err = error as Error;
      setState({
        data: null,
        loading: false,
        error: err
      });

      onError?.(err, variables);
      onSettled?.(null, err, variables);

      throw error;
    }
  }, [mutationFn, entityType, mutationOptions, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    mutate,
    reset
  };
}

/**
 * Hook for creating entities
 */
export function useCreate<T>(
  entityType: string,
  options: MutationOptions & {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useMutation<T, T>(
    (data: T) => dataLayer.create(entityType, data, options).then(r => r.data),
    entityType,
    options
  );
}

/**
 * Hook for updating entities
 */
export function useUpdate<T>(
  entityType: string,
  options: MutationOptions & {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useMutation<T, { id: string; updates: Partial<T> }>(
    ({ id, updates }) => dataLayer.update(entityType, id, updates, options).then(r => r.data),
    entityType,
    options
  );
}

/**
 * Hook for deleting entities
 */
export function useDelete(
  entityType: string,
  options: MutationOptions & {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useMutation<void, string>(
    (id: string) => dataLayer.delete(entityType, id, options).then(r => r.data),
    entityType,
    options
  );
}

/**
 * Hook for optimistic updates state
 */
export function useOptimisticUpdates(entityType?: string, entityId?: string): OptimisticState {
  const [pendingUpdates, setPendingUpdates] = useState(0);

  useEffect(() => {
    const updatePendingCount = () => {
      const updates = entityType && entityId 
        ? optimisticUpdates.getUpdatesForEntity(entityType, entityId)
        : optimisticUpdates.getPendingUpdates();
      
      setPendingUpdates(updates.length);
    };

    // Initial count
    updatePendingCount();

    // Listen for optimistic update events
    const handleOptimisticUpdate = () => updatePendingCount();
    const handleUpdateConfirmed = () => updatePendingCount();
    const handleUpdateFailed = () => updatePendingCount();

    optimisticUpdates.on('optimisticUpdate', handleOptimisticUpdate);
    optimisticUpdates.on('updateConfirmed', handleUpdateConfirmed);
    optimisticUpdates.on('updateFailed', handleUpdateFailed);

    return () => {
      optimisticUpdates.off('optimisticUpdate', handleOptimisticUpdate);
      optimisticUpdates.off('updateConfirmed', handleUpdateConfirmed);
      optimisticUpdates.off('updateFailed', handleUpdateFailed);
    };
  }, [entityType, entityId]);

  const rollback = useCallback(async (updateId?: string) => {
    if (updateId) {
      await optimisticUpdates.cancelUpdate(updateId);
    } else if (entityType && entityId) {
      const updates = optimisticUpdates.getUpdatesForEntity(entityType, entityId);
      for (const update of updates) {
        await optimisticUpdates.cancelUpdate(update.id);
      }
    }
  }, [entityType, entityId]);

  return {
    hasPendingUpdates: pendingUpdates > 0,
    pendingCount: pendingUpdates,
    rollback
  };
}

/**
 * Hook for offline sync status
 */
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState(offlineSync.getSyncStatus());

  useEffect(() => {
    const handleStatusUpdate = (status: any) => {
      setSyncStatus(status);
    };

    offlineSync.on('statusUpdated', handleStatusUpdate);
    return () => offlineSync.off('statusUpdated', handleStatusUpdate);
  }, []);

  const syncNow = useCallback(() => {
    offlineSync.syncOperations();
  }, []);

  const clearPending = useCallback(() => {
    offlineSync.clearPendingOperations();
  }, []);

  return {
    ...syncStatus,
    syncNow,
    clearPending,
    pendingOperations: offlineSync.getPendingOperations()
  };
}

/**
 * Hook for real-time subscriptions
 */
export function useSubscription<T>(
  entityType: string,
  entityId: string,
  options: {
    enabled?: boolean;
    onData?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): {
  data: T | null;
  connected: boolean;
  error: Error | null;
} {
  const [state, setState] = useState<{
    data: T | null;
    connected: boolean;
    error: Error | null;
  }>({
    data: null,
    connected: false,
    error: null
  });

  const { enabled = true, onData, onError } = options;

  useEffect(() => {
    if (!enabled) return;

    setState(prev => ({ ...prev, connected: true, error: null }));

    const unsubscribe = dataLayer.subscribe<T>(
      entityType,
      entityId,
      (data: T) => {
        setState(prev => ({ ...prev, data, error: null }));
        onData?.(data);
      }
    );

    return () => {
      unsubscribe();
      setState(prev => ({ ...prev, connected: false }));
    };
  }, [entityType, entityId, enabled, onData]);

  return state;
}

/**
 * Hook for batch operations
 */
export function useBatch<T>(
  entityType: string,
  options: MutationOptions & {
    onSuccess?: (results: T[]) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useMutation<T[], Array<{
    type: 'create' | 'update' | 'delete';
    entityType: string;
    entityId?: string;
    data?: any;
  }>>(
    (operations) => dataLayer.batch(operations, options).then(r => r.data),
    entityType,
    options
  );
}

/**
 * Hook for cache invalidation
 */
export function useCacheInvalidation() {
  const invalidateByTags = useCallback((tags: string[]) => {
    return dataLayer.invalidateCacheByTags(tags);
  }, []);

  return {
    invalidateByTags
  };
}

/**
 * Hook for data layer status and metrics
 */
export function useDataLayerStatus() {
  const [status, setStatus] = useState({
    cacheHitRate: 0,
    pendingQueries: 0,
    pendingMutations: 0,
    offlineOperations: 0,
    optimisticUpdates: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus({
        cacheHitRate: 0, // Implement cache hit rate calculation
        pendingQueries: 0, // Implement pending queries count
        pendingMutations: 0, // Implement pending mutations count
        offlineOperations: offlineSync.getPendingOperations().length,
        optimisticUpdates: optimisticUpdates.getPendingUpdates().length
      });
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  return status;
}
