import React, { useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { Product, User, Category, CartItem, Order } from '../types';

// Normalized state structure for efficient data management
export interface NormalizedState<T> {
  byId: Record<string, T>;
  allIds: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  metadata: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// Entity types for normalization
export type EntityType = 'products' | 'users' | 'categories' | 'cartItems' | 'orders';

// Action types for normalized state management
export type NormalizedAction<T> = 
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_ENTITIES'; entities: T[]; replace?: boolean }
  | { type: 'ADD_ENTITY'; entity: T }
  | { type: 'UPDATE_ENTITY'; id: string; updates: Partial<T> }
  | { type: 'REMOVE_ENTITY'; id: string }
  | { type: 'CLEAR_ENTITIES' }
  | { type: 'SET_METADATA'; metadata: Partial<NormalizedState<T>['metadata']> }
  | { type: 'INVALIDATE' }
  | { type: 'BATCH_UPDATE'; updates: Array<{ id: string; updates: Partial<T> }> };

// Generic normalized state reducer
export function createNormalizedReducer<T extends { id: string }>() {
  return function normalizedReducer(
    state: NormalizedState<T>,
    action: NormalizedAction<T>
  ): NormalizedState<T> {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, loading: action.loading };

      case 'SET_ERROR':
        return { ...state, error: action.error, loading: false };

      case 'SET_ENTITIES': {
        const { entities, replace = false } = action;
        const byId = replace ? {} : { ...state.byId };
        const allIds = replace ? [] : [...state.allIds];

        entities.forEach(entity => {
          byId[entity.id] = entity;
          if (!allIds.includes(entity.id)) {
            allIds.push(entity.id);
          }
        });

        return {
          ...state,
          byId,
          allIds,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          metadata: {
            ...state.metadata,
            total: allIds.length
          }
        };
      }

      case 'ADD_ENTITY': {
        const { entity } = action;
        if (state.byId[entity.id]) {
          // Entity already exists, update it
          return {
            ...state,
            byId: { ...state.byId, [entity.id]: entity },
            lastUpdated: Date.now()
          };
        }

        return {
          ...state,
          byId: { ...state.byId, [entity.id]: entity },
          allIds: [...state.allIds, entity.id],
          lastUpdated: Date.now(),
          metadata: {
            ...state.metadata,
            total: state.allIds.length + 1
          }
        };
      }

      case 'UPDATE_ENTITY': {
        const { id, updates } = action;
        if (!state.byId[id]) return state;

        return {
          ...state,
          byId: {
            ...state.byId,
            [id]: { ...state.byId[id], ...updates }
          },
          lastUpdated: Date.now()
        };
      }

      case 'REMOVE_ENTITY': {
        const { id } = action;
        const { [id]: removed, ...remainingById } = state.byId;
        const allIds = state.allIds.filter(entityId => entityId !== id);

        return {
          ...state,
          byId: remainingById,
          allIds,
          lastUpdated: Date.now(),
          metadata: {
            ...state.metadata,
            total: allIds.length
          }
        };
      }

      case 'CLEAR_ENTITIES':
        return {
          ...state,
          byId: {},
          allIds: [],
          lastUpdated: Date.now(),
          metadata: {
            ...state.metadata,
            total: 0,
            hasMore: false,
            nextCursor: undefined
          }
        };

      case 'SET_METADATA':
        return {
          ...state,
          metadata: { ...state.metadata, ...action.metadata }
        };

      case 'BATCH_UPDATE': {
        const { updates } = action;
        const byId = { ...state.byId };
        
        updates.forEach(({ id, updates: entityUpdates }) => {
          if (byId[id]) {
            byId[id] = { ...byId[id], ...entityUpdates };
          }
        });

        return {
          ...state,
          byId,
          lastUpdated: Date.now()
        };
      }

      case 'INVALIDATE':
        return {
          ...state,
          lastUpdated: 0,
          error: null
        };

      default:
        return state;
    }
  };
}

// Initial state factory
export function createInitialNormalizedState<T>(): NormalizedState<T> {
  return {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    metadata: {
      total: 0,
      hasMore: false
    }
  };
}

// Hook for normalized state management with optimizations
export function useNormalizedState<T extends { id: string }>(
  entityType: EntityType,
  options: {
    cacheTimeout?: number;
    enablePersistence?: boolean;
    enableOptimisticUpdates?: boolean;
  } = {}
) {
  const {
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    enablePersistence = false,
    enableOptimisticUpdates = true
  } = options;

  const reducer = useMemo(() => createNormalizedReducer<T>(), []);
  const initialState = useMemo(() => {
    if (enablePersistence) {
      try {
        const stored = localStorage.getItem(`normalized_${entityType}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if cache is still valid
          if (Date.now() - parsed.lastUpdated < cacheTimeout) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn(`Failed to load persisted state for ${entityType}:`, error);
      }
    }
    return createInitialNormalizedState<T>();
  }, [entityType, enablePersistence, cacheTimeout]);

  const [state, dispatch] = useReducer(reducer, initialState);
  const optimisticUpdatesRef = useRef<Map<string, T>>(new Map());

  // Persist state changes
  useEffect(() => {
    if (enablePersistence && state.lastUpdated > 0) {
      try {
        localStorage.setItem(`normalized_${entityType}`, JSON.stringify(state));
      } catch (error) {
        console.warn(`Failed to persist state for ${entityType}:`, error);
      }
    }
  }, [state, entityType, enablePersistence]);

  // Selectors with memoization
  const selectors = useMemo(() => ({
    // Get all entities as array
    getAll: (): T[] => state.allIds.map(id => state.byId[id]).filter(Boolean),
    
    // Get entity by ID
    getById: (id: string): T | undefined => state.byId[id],
    
    // Get multiple entities by IDs
    getByIds: (ids: string[]): T[] => ids.map(id => state.byId[id]).filter(Boolean),
    
    // Get filtered entities
    getFiltered: (predicate: (entity: T) => boolean): T[] => 
      state.allIds.map(id => state.byId[id]).filter(Boolean).filter(predicate),
    
    // Get sorted entities
    getSorted: (compareFn: (a: T, b: T) => number): T[] =>
      state.allIds.map(id => state.byId[id]).filter(Boolean).sort(compareFn),
    
    // Get paginated entities
    getPaginated: (page: number, pageSize: number): T[] => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return state.allIds.slice(start, end).map(id => state.byId[id]).filter(Boolean);
    },
    
    // Check if entity exists
    has: (id: string): boolean => id in state.byId,
    
    // Get total count
    getCount: (): number => state.allIds.length,
    
    // Check if data is stale
    isStale: (): boolean => {
      if (state.lastUpdated === 0) return true;
      return Date.now() - state.lastUpdated > cacheTimeout;
    }
  }), [state, cacheTimeout]);

  // Actions with optimistic updates
  const actions = useMemo(() => ({
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', loading }),
    
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', error }),
    
    setEntities: (entities: T[], replace = false) => 
      dispatch({ type: 'SET_ENTITIES', entities, replace }),
    
    addEntity: (entity: T) => dispatch({ type: 'ADD_ENTITY', entity }),
    
    updateEntity: useCallback((id: string, updates: Partial<T>) => {
      if (enableOptimisticUpdates && state.byId[id]) {
        // Store original for rollback
        optimisticUpdatesRef.current.set(id, state.byId[id]);
      }
      dispatch({ type: 'UPDATE_ENTITY', id, updates });
    }, [enableOptimisticUpdates, state.byId]),
    
    removeEntity: (id: string) => dispatch({ type: 'REMOVE_ENTITY', id }),
    
    clearEntities: () => dispatch({ type: 'CLEAR_ENTITIES' }),
    
    setMetadata: (metadata: Partial<NormalizedState<T>['metadata']>) =>
      dispatch({ type: 'SET_METADATA', metadata }),
    
    batchUpdate: (updates: Array<{ id: string; updates: Partial<T> }>) =>
      dispatch({ type: 'BATCH_UPDATE', updates }),
    
    invalidate: () => dispatch({ type: 'INVALIDATE' }),
    
    // Rollback optimistic update
    rollbackOptimisticUpdate: useCallback((id: string) => {
      const original = optimisticUpdatesRef.current.get(id);
      if (original) {
        dispatch({ type: 'UPDATE_ENTITY', id, updates: original });
        optimisticUpdatesRef.current.delete(id);
      }
    }, [])
  }), [enableOptimisticUpdates, state.byId]);

  return {
    state,
    selectors,
    actions,
    isLoading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    metadata: state.metadata
  };
}

// Context optimization utilities
export function createOptimizedContext<T>(defaultValue: T) {
  const Context = React.createContext<T>(defaultValue);
  
  // Prevent unnecessary re-renders by splitting read and write contexts
  const ReadContext = React.createContext<T>(defaultValue);
  const WriteContext = React.createContext<T>(defaultValue);
  
  return { Context, ReadContext, WriteContext };
}

// Memoized selector hook to prevent unnecessary re-renders
export function useMemoizedSelector<T, R>(
  selector: (state: T) => R,
  state: T,
  deps: React.DependencyList = []
): R {
  return useMemo(() => selector(state), [state, ...deps]);
}

// Batch state updates to reduce re-renders
export function useBatchedUpdates() {
  const batchedUpdatesRef = useRef<Array<() => void>>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const batchUpdate = useCallback((updateFn: () => void) => {
    batchedUpdatesRef.current.push(updateFn);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = batchedUpdatesRef.current;
      batchedUpdatesRef.current = [];

      // Execute all batched updates
      updates.forEach(update => update());
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return batchUpdate;
}

// Data normalization utilities for complex relational data
export interface NormalizedSchema<T> {
  entities: Record<string, T>;
  result: string | string[];
}

export interface RelationshipMap {
  [entityType: string]: {
    [fieldName: string]: {
      type: 'oneToOne' | 'oneToMany' | 'manyToMany';
      targetEntity: string;
      foreignKey?: string;
      joinTable?: string;
    };
  };
}

// Normalize array of entities with relationships
export function normalizeEntities<T extends { id: string }>(
  entities: T[],
  relationships: RelationshipMap = {}
): NormalizedSchema<T> {
  const normalizedEntities: Record<string, T> = {};
  const result: string[] = [];

  entities.forEach(entity => {
    normalizedEntities[entity.id] = { ...entity };
    result.push(entity.id);

    // Process relationships
    Object.entries(relationships).forEach(([entityType, relations]) => {
      Object.entries(relations).forEach(([fieldName, relation]) => {
        const fieldValue = (entity as any)[fieldName];

        if (fieldValue) {
          switch (relation.type) {
            case 'oneToOne':
              if (typeof fieldValue === 'object' && fieldValue.id) {
                (normalizedEntities[entity.id] as any)[fieldName] = fieldValue.id;
              }
              break;

            case 'oneToMany':
              if (Array.isArray(fieldValue)) {
                (normalizedEntities[entity.id] as any)[fieldName] = fieldValue.map(
                  item => typeof item === 'object' ? item.id : item
                );
              }
              break;

            case 'manyToMany':
              if (Array.isArray(fieldValue)) {
                (normalizedEntities[entity.id] as any)[fieldName] = fieldValue.map(
                  item => typeof item === 'object' ? item.id : item
                );
              }
              break;
          }
        }
      });
    });
  });

  return {
    entities: normalizedEntities,
    result
  };
}

// Denormalize entities back to their original structure
export function denormalizeEntities<T extends { id: string }>(
  normalizedData: NormalizedSchema<T>,
  allEntities: Record<string, Record<string, any>>,
  relationships: RelationshipMap = {}
): T[] {
  const resultIds = Array.isArray(normalizedData.result)
    ? normalizedData.result
    : [normalizedData.result];

  return resultIds.map(id => {
    const entity = { ...normalizedData.entities[id] };

    // Restore relationships
    Object.entries(relationships).forEach(([entityType, relations]) => {
      Object.entries(relations).forEach(([fieldName, relation]) => {
        const fieldValue = (entity as any)[fieldName];

        if (fieldValue) {
          const targetEntities = allEntities[relation.targetEntity] || {};

          switch (relation.type) {
            case 'oneToOne':
              if (typeof fieldValue === 'string') {
                (entity as any)[fieldName] = targetEntities[fieldValue] || null;
              }
              break;

            case 'oneToMany':
              if (Array.isArray(fieldValue)) {
                (entity as any)[fieldName] = fieldValue
                  .map(itemId => targetEntities[itemId])
                  .filter(Boolean);
              }
              break;

            case 'manyToMany':
              if (Array.isArray(fieldValue)) {
                (entity as any)[fieldName] = fieldValue
                  .map(itemId => targetEntities[itemId])
                  .filter(Boolean);
              }
              break;
          }
        }
      });
    });

    return entity as T;
  });
}

// Hook for managing normalized relational data
export function useNormalizedRelationalData<T extends { id: string }>(
  entityType: EntityType,
  relationships: RelationshipMap = {},
  options: {
    cacheTimeout?: number;
    enablePersistence?: boolean;
  } = {}
) {
  const normalizedState = useNormalizedState<T>(entityType, options);
  const allEntitiesRef = useRef<Record<string, Record<string, any>>>({});

  const setRelatedEntities = useCallback((
    relatedEntityType: string,
    entities: Record<string, any>
  ) => {
    allEntitiesRef.current[relatedEntityType] = entities;
  }, []);

  const getDenormalizedEntities = useCallback((): T[] => {
    const normalizedData = {
      entities: normalizedState.state.byId,
      result: normalizedState.state.allIds
    };

    return denormalizeEntities(normalizedData, allEntitiesRef.current, relationships);
  }, [normalizedState.state, relationships]);

  const addEntitiesWithRelations = useCallback((entities: T[]) => {
    const normalized = normalizeEntities(entities, relationships);
    normalizedState.actions.setEntities(Object.values(normalized.entities));
  }, [normalizedState.actions, relationships]);

  return {
    ...normalizedState,
    setRelatedEntities,
    getDenormalizedEntities,
    addEntitiesWithRelations
  };
}
