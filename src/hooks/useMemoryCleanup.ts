import React, { useEffect, useRef, useCallback } from 'react';

interface CleanupRegistry {
  subscriptions: Array<() => void>;
  timers: Array<NodeJS.Timeout>;
  intervals: Array<NodeJS.Timeout>;
  eventListeners: Array<{
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>;
  observers: Array<IntersectionObserver | MutationObserver | ResizeObserver>;
  abortControllers: Array<AbortController>;
}

/**
 * Custom hook for managing component cleanup and preventing memory leaks
 * Automatically cleans up subscriptions, timers, event listeners, and observers
 */
export const useMemoryCleanup = () => {
  const cleanupRegistry = useRef<CleanupRegistry>({
    subscriptions: [],
    timers: [],
    intervals: [],
    eventListeners: [],
    observers: [],
    abortControllers: []
  });

  const isUnmounted = useRef(false);

  // Register a subscription for cleanup
  const registerSubscription = useCallback((unsubscribe: () => void) => {
    if (!isUnmounted.current) {
      cleanupRegistry.current.subscriptions.push(unsubscribe);
    }
    return unsubscribe;
  }, []);

  // Register a timer for cleanup
  const registerTimer = useCallback((timer: NodeJS.Timeout) => {
    if (!isUnmounted.current) {
      cleanupRegistry.current.timers.push(timer);
    }
    return timer;
  }, []);

  // Register an interval for cleanup
  const registerInterval = useCallback((interval: NodeJS.Timeout) => {
    if (!isUnmounted.current) {
      cleanupRegistry.current.intervals.push(interval);
    }
    return interval;
  }, []);

  // Register an event listener for cleanup
  const registerEventListener = useCallback(<T extends Element | Window | Document>(
    element: T,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (!isUnmounted.current) {
      element.addEventListener(event, handler, options);
      cleanupRegistry.current.eventListeners.push({
        element,
        event,
        handler,
        options
      });
    }
    
    return () => {
      element.removeEventListener(event, handler, options);
    };
  }, []);

  // Register an observer for cleanup
  const registerObserver = useCallback(<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
    observer: T
  ) => {
    if (!isUnmounted.current) {
      cleanupRegistry.current.observers.push(observer);
    }
    return observer;
  }, []);

  // Register an AbortController for cleanup
  const registerAbortController = useCallback(() => {
    const controller = new AbortController();
    if (!isUnmounted.current) {
      cleanupRegistry.current.abortControllers.push(controller);
    }
    return controller;
  }, []);

  // Safe timeout that auto-cleans up
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      if (!isUnmounted.current) {
        callback();
      }
    }, delay);
    
    return registerTimer(timer);
  }, [registerTimer]);

  // Safe interval that auto-cleans up
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(() => {
      if (!isUnmounted.current) {
        callback();
      }
    }, delay);
    
    return registerInterval(interval);
  }, [registerInterval]);

  // Safe fetch with AbortController
  const safeFetch = useCallback(async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const controller = registerAbortController();
    
    return fetch(input, {
      ...init,
      signal: controller.signal
    });
  }, [registerAbortController]);

  // Manual cleanup function
  const cleanup = useCallback(() => {
    const registry = cleanupRegistry.current;

    // Cleanup subscriptions
    registry.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error during subscription cleanup:', error);
      }
    });

    // Cleanup timers
    registry.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Error during timer cleanup:', error);
      }
    });

    // Cleanup intervals
    registry.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn('Error during interval cleanup:', error);
      }
    });

    // Cleanup event listeners
    registry.eventListeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        // Silent cleanup
      }
    });

    // Cleanup observers
    registry.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        // Silent cleanup
      }
    });

    // Cleanup AbortControllers
    registry.abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        // Silent cleanup
      }
    });

    // Clear all registries
    registry.subscriptions = [];
    registry.timers = [];
    registry.intervals = [];
    registry.eventListeners = [];
    registry.observers = [];
    registry.abortControllers = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    registerSubscription,
    registerTimer,
    registerInterval,
    registerEventListener,
    registerObserver,
    registerAbortController,
    safeSetTimeout,
    safeSetInterval,
    safeFetch,
    cleanup,
    isUnmounted: () => isUnmounted.current
  };
};

/**
 * Hook for managing component state with automatic cleanup
 * Prevents state updates after component unmount
 */
export const useSafeState = <T>(initialState: T | (() => T)) => {
  const { isUnmounted } = useMemoryCleanup();
  const [state, setState] = React.useState(initialState);

  const safeSetState = useCallback((
    value: T | ((prevState: T) => T)
  ) => {
    if (!isUnmounted()) {
      setState(value);
    }
  }, [isUnmounted]);

  return [state, safeSetState] as const;
};

/**
 * Hook for managing async operations with cleanup
 */
export const useAsyncOperation = () => {
  const { registerAbortController, isUnmounted } = useMemoryCleanup();

  const executeAsync = useCallback(async <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    const controller = registerAbortController();
    
    try {
      const result = await asyncFn(controller.signal);
      return isUnmounted() ? null : result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Operation was cancelled
      }
      throw error;
    }
  }, [registerAbortController, isUnmounted]);

  return { executeAsync };
};