import React, { createContext, useContext, ReactNode, useReducer, useCallback, useMemo, useEffect } from 'react';
import { User, Product, Category, CartItem, Order } from '../types';
import { useNormalizedState, useBatchedUpdates } from '../utils/stateManagement';
import { primaryCache } from '../utils/cache';

// Global state structure
interface GlobalState {
  user: {
    currentUser: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    preferences: Record<string, any>;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: number;
    }>;
    modals: Record<string, boolean>;
    loading: Record<string, boolean>;
  };
  network: {
    isOnline: boolean;
    isSlowConnection: boolean;
    retryQueue: Array<{
      id: string;
      action: () => Promise<any>;
      retries: number;
      maxRetries: number;
    }>;
  };
  cache: {
    invalidationQueue: string[];
    lastCleanup: number;
    stats: {
      hits: number;
      misses: number;
      evictions: number;
    };
  };
}

// Action types for global state
type GlobalAction = 
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_USER_LOADING'; loading: boolean }
  | { type: 'SET_USER_PREFERENCES'; preferences: Record<string, any> }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'ADD_NOTIFICATION'; notification: GlobalState['ui']['notifications'][0] }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'SET_MODAL'; modalId: string; isOpen: boolean }
  | { type: 'SET_LOADING'; key: string; loading: boolean }
  | { type: 'SET_NETWORK_STATUS'; isOnline: boolean; isSlowConnection: boolean }
  | { type: 'ADD_RETRY_ACTION'; action: GlobalState['network']['retryQueue'][0] }
  | { type: 'REMOVE_RETRY_ACTION'; id: string }
  | { type: 'UPDATE_CACHE_STATS'; stats: Partial<GlobalState['cache']['stats']> }
  | { type: 'ADD_CACHE_INVALIDATION'; key: string }
  | { type: 'CLEAR_CACHE_INVALIDATION_QUEUE' };

// Global state reducer
function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          currentUser: action.user,
          isAuthenticated: !!action.user,
          loading: false
        }
      };

    case 'SET_USER_LOADING':
      return {
        ...state,
        user: { ...state.user, loading: action.loading }
      };

    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        user: { ...state.user, preferences: { ...state.user.preferences, ...action.preferences } }
      };

    case 'SET_THEME':
      return {
        ...state,
        ui: { ...state.ui, theme: action.theme }
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      };

    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        ui: { ...state.ui, mobileMenuOpen: !state.ui.mobileMenuOpen }
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.notification]
        }
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.id)
        }
      };

    case 'SET_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: { ...state.ui.modals, [action.modalId]: action.isOpen }
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: { ...state.ui.loading, [action.key]: action.loading }
        }
      };

    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        network: {
          ...state.network,
          isOnline: action.isOnline,
          isSlowConnection: action.isSlowConnection
        }
      };

    case 'ADD_RETRY_ACTION':
      return {
        ...state,
        network: {
          ...state.network,
          retryQueue: [...state.network.retryQueue, action.action]
        }
      };

    case 'REMOVE_RETRY_ACTION':
      return {
        ...state,
        network: {
          ...state.network,
          retryQueue: state.network.retryQueue.filter(a => a.id !== action.id)
        }
      };

    case 'UPDATE_CACHE_STATS':
      return {
        ...state,
        cache: {
          ...state.cache,
          stats: { ...state.cache.stats, ...action.stats }
        }
      };

    case 'ADD_CACHE_INVALIDATION':
      return {
        ...state,
        cache: {
          ...state.cache,
          invalidationQueue: [...state.cache.invalidationQueue, action.key]
        }
      };

    case 'CLEAR_CACHE_INVALIDATION_QUEUE':
      return {
        ...state,
        cache: {
          ...state.cache,
          invalidationQueue: []
        }
      };

    default:
      return state;
  }
}

// Initial global state
const initialGlobalState: GlobalState = {
  user: {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    preferences: {}
  },
  ui: {
    theme: 'light',
    sidebarOpen: false,
    mobileMenuOpen: false,
    notifications: [],
    modals: {},
    loading: {}
  },
  network: {
    isOnline: navigator.onLine,
    isSlowConnection: false,
    retryQueue: []
  },
  cache: {
    invalidationQueue: [],
    lastCleanup: Date.now(),
    stats: {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }
};

// Context type
interface GlobalStateContextType {
  state: GlobalState;
  actions: {
    // User actions
    setUser: (user: User | null) => void;
    setUserLoading: (loading: boolean) => void;
    setUserPreferences: (preferences: Record<string, any>) => void;
    
    // UI actions
    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    addNotification: (notification: Omit<GlobalState['ui']['notifications'][0], 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    setModal: (modalId: string, isOpen: boolean) => void;
    setLoading: (key: string, loading: boolean) => void;
    
    // Network actions
    setNetworkStatus: (isOnline: boolean, isSlowConnection: boolean) => void;
    addRetryAction: (action: () => Promise<any>, maxRetries?: number) => string;
    removeRetryAction: (id: string) => void;
    processRetryQueue: () => Promise<void>;
    
    // Cache actions
    updateCacheStats: (stats: Partial<GlobalState['cache']['stats']>) => void;
    invalidateCache: (key: string) => void;
    processCacheInvalidation: () => void;
    cleanupCache: () => void;
  };
  
  // Selectors
  selectors: {
    isAuthenticated: () => boolean;
    getCurrentUser: () => User | null;
    getTheme: () => 'light' | 'dark';
    isLoading: (key: string) => boolean;
    getNotifications: () => GlobalState['ui']['notifications'];
    isModalOpen: (modalId: string) => boolean;
    getNetworkStatus: () => { isOnline: boolean; isSlowConnection: boolean };
    getCacheStats: () => GlobalState['cache']['stats'];
  };
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

interface GlobalStateProviderProps {
  children: ReactNode;
}

export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(globalStateReducer, initialGlobalState);
  const batchUpdate = useBatchedUpdates();

  // Actions
  const actions = useMemo(() => ({
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', user }),
    setUserLoading: (loading: boolean) => dispatch({ type: 'SET_USER_LOADING', loading }),
    setUserPreferences: (preferences: Record<string, any>) => 
      dispatch({ type: 'SET_USER_PREFERENCES', preferences }),
    
    setTheme: (theme: 'light' | 'dark') => dispatch({ type: 'SET_THEME', theme }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    toggleMobileMenu: () => dispatch({ type: 'TOGGLE_MOBILE_MENU' }),
    
    addNotification: (notification: Omit<GlobalState['ui']['notifications'][0], 'id' | 'timestamp'>) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: { ...notification, id, timestamp: Date.now() }
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', id });
      }, 5000);
    },
    
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', id }),
    setModal: (modalId: string, isOpen: boolean) => dispatch({ type: 'SET_MODAL', modalId, isOpen }),
    setLoading: (key: string, loading: boolean) => dispatch({ type: 'SET_LOADING', key, loading }),
    
    setNetworkStatus: (isOnline: boolean, isSlowConnection: boolean) =>
      dispatch({ type: 'SET_NETWORK_STATUS', isOnline, isSlowConnection }),
    
    addRetryAction: (action: () => Promise<any>, maxRetries = 3): string => {
      const id = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({
        type: 'ADD_RETRY_ACTION',
        action: { id, action, retries: 0, maxRetries }
      });
      return id;
    },
    
    removeRetryAction: (id: string) => dispatch({ type: 'REMOVE_RETRY_ACTION', id }),
    
    processRetryQueue: async () => {
      const queue = [...state.network.retryQueue];
      
      for (const item of queue) {
        try {
          await item.action();
          dispatch({ type: 'REMOVE_RETRY_ACTION', id: item.id });
        } catch (error) {
          if (item.retries < item.maxRetries) {
            // Increment retry count and keep in queue
            const updatedItem = { ...item, retries: item.retries + 1 };
            dispatch({ type: 'REMOVE_RETRY_ACTION', id: item.id });
            dispatch({ type: 'ADD_RETRY_ACTION', action: updatedItem });
          } else {
            // Max retries reached, remove from queue
            dispatch({ type: 'REMOVE_RETRY_ACTION', id: item.id });
          }
        }
      }
    },
    
    updateCacheStats: (stats: Partial<GlobalState['cache']['stats']>) =>
      dispatch({ type: 'UPDATE_CACHE_STATS', stats }),
    
    invalidateCache: (key: string) => dispatch({ type: 'ADD_CACHE_INVALIDATION', key }),
    
    processCacheInvalidation: () => {
      batchUpdate(() => {
        state.cache.invalidationQueue.forEach(key => {
          primaryCache.delete(key);
        });
        dispatch({ type: 'CLEAR_CACHE_INVALIDATION_QUEUE' });
      });
    },
    
    cleanupCache: () => {
      primaryCache.cleanup();
      dispatch({
        type: 'UPDATE_CACHE_STATS',
        stats: { ...primaryCache.getStats() }
      });
    }
  }), [state.network.retryQueue, state.cache.invalidationQueue, batchUpdate]);

  // Selectors
  const selectors = useMemo(() => ({
    isAuthenticated: () => state.user.isAuthenticated,
    getCurrentUser: () => state.user.currentUser,
    getTheme: () => state.ui.theme,
    isLoading: (key: string) => state.ui.loading[key] || false,
    getNotifications: () => state.ui.notifications,
    isModalOpen: (modalId: string) => state.ui.modals[modalId] || false,
    getNetworkStatus: () => ({
      isOnline: state.network.isOnline,
      isSlowConnection: state.network.isSlowConnection
    }),
    getCacheStats: () => state.cache.stats
  }), [state]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => actions.setNetworkStatus(true, false);
    const handleOffline = () => actions.setNetworkStatus(false, false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [actions]);

  // Process retry queue when coming back online
  useEffect(() => {
    if (state.network.isOnline && state.network.retryQueue.length > 0) {
      actions.processRetryQueue();
    }
  }, [state.network.isOnline, state.network.retryQueue.length, actions]);

  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - state.cache.lastCleanup > 5 * 60 * 1000) { // 5 minutes
        actions.cleanupCache();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [state.cache.lastCleanup, actions]);

  const contextValue: GlobalStateContextType = useMemo(() => ({
    state,
    actions,
    selectors
  }), [state, actions, selectors]);

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};
