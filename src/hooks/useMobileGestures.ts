import { useState, useCallback, useRef, useEffect } from 'react';
import { useMemoryCleanup } from './useMemoryCleanup';
import { performanceMonitor } from '../utils/performance';

// Touch gesture configuration
interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultTouchmove?: boolean;
  throttleMs?: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

// Performance-optimized throttle for touch events
const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// Hook for swipe gesture detection with performance optimizations
export const useSwipeGesture = (
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchmove = true,
    throttleMs = 16, // ~60fps
  } = config;

  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const { registerEventListener } = useMemoryCleanup();
  const gestureRef = useRef<HTMLElement | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    performanceMonitor.startMeasure('touch-gesture-start');
    const touch = e.targetTouches[0];
    setTouchEnd(null);
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    });
    performanceMonitor.endMeasure('touch-gesture-start');
  }, []);

  const onTouchMove = useCallback(throttle((e: React.TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault();
    }
    const touch = e.targetTouches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    });
  }, throttleMs), [preventDefaultTouchmove, throttleMs]);

  const onTouchEnd = useCallback(() => {
    performanceMonitor.startMeasure('touch-gesture-end');
    
    if (!touchStart || !touchEnd) {
      performanceMonitor.endMeasure('touch-gesture-end', false);
      return;
    }

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const deltaTime = touchEnd.time - touchStart.time;

    // Check if swipe was fast enough
    if (deltaTime > maxSwipeTime) {
      performanceMonitor.endMeasure('touch-gesture-end', false);
      return;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          handlers.onSwipeLeft?.();
        } else {
          handlers.onSwipeRight?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          handlers.onSwipeUp?.();
        } else {
          handlers.onSwipeDown?.();
        }
      }
    }
    
    performanceMonitor.endMeasure('touch-gesture-end');
  }, [touchStart, touchEnd, minSwipeDistance, maxSwipeTime, handlers]);

  // Enhanced touch event handling with passive listeners for better performance
  const bindGestures = useCallback((element: HTMLElement | null) => {
    if (gestureRef.current) {
      // Cleanup previous listeners
      gestureRef.current = null;
    }
    
    if (element) {
      gestureRef.current = element;
      
      // Use passive listeners for better performance
      registerEventListener(element, 'touchstart', onTouchStart as any, { passive: true });
      registerEventListener(element, 'touchmove', onTouchMove as any, { passive: !preventDefaultTouchmove });
      registerEventListener(element, 'touchend', onTouchEnd as any, { passive: true });
    }
  }, [onTouchStart, onTouchMove, onTouchEnd, preventDefaultTouchmove, registerEventListener]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    bindGestures,
  };
};

// Hook for long press detection with haptic feedback
interface LongPressConfig {
  threshold?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  enableHaptics?: boolean;
}

export const useLongPress = (
  onLongPress: () => void,
  config: LongPressConfig = {}
) => {
  const { threshold = 500, onStart, onFinish, onCancel, enableHaptics = true } = config;
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timerId = useRef<NodeJS.Timeout>();
  const { safeSetTimeout } = useMemoryCleanup();

  const triggerHapticFeedback = useCallback(() => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
  }, [enableHaptics]);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isPressed.current) return;
    
    e.preventDefault(); // Prevent default to avoid context menus
    isPressed.current = true;
    onStart?.();

    timerId.current = safeSetTimeout(() => {
      if (isPressed.current) {
        isLongPressActive.current = true;
        triggerHapticFeedback();
        onLongPress();
        onFinish?.();
      }
    }, threshold);
  }, [onLongPress, threshold, onStart, onFinish, triggerHapticFeedback, safeSetTimeout]);

  const clear = useCallback((shouldTriggerOnCancel = true) => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    
    if (shouldTriggerOnCancel && isPressed.current && !isLongPressActive.current) {
      onCancel?.();
    }
    
    isLongPressActive.current = false;
    isPressed.current = false;
  }, [onCancel]);

  return {
    onMouseDown: start,
    onMouseUp: () => clear(true),
    onMouseLeave: () => clear(false),
    onTouchStart: start,
    onTouchEnd: () => clear(true),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(), // Prevent context menu
  };
};

// Hook for pinch-to-zoom detection with performance optimizations
interface PinchConfig {
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
  throttleMs?: number;
}

export const usePinchZoom = (config: PinchConfig = {}) => {
  const {
    minScale = 0.5,
    maxScale = 3,
    throttleMs = 16,
    ...callbacks
  } = config;
  
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const { registerEventListener } = useMemoryCleanup();

  const getDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      performanceMonitor.startMeasure('pinch-gesture');
      const distance = getDistance(e.touches);
      setInitialDistance(distance);
      callbacks.onPinchStart?.(1);
    }
  }, [callbacks, getDistance]);

  const onTouchMove = useCallback(throttle((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      let scale = distance / initialDistance;
      
      // Clamp scale to min/max values
      scale = Math.max(minScale, Math.min(maxScale, scale));
      
      setCurrentScale(scale);
      callbacks.onPinchMove?.(scale);
    }
  }, throttleMs), [initialDistance, callbacks, getDistance, minScale, maxScale, throttleMs]);

  const onTouchEnd = useCallback(() => {
    if (initialDistance) {
      performanceMonitor.endMeasure('pinch-gesture');
      callbacks.onPinchEnd?.(currentScale);
      setInitialDistance(null);
      setCurrentScale(1);
    }
  }, [initialDistance, currentScale, callbacks]);

  const bindPinchGestures = useCallback((element: HTMLElement | null) => {
    if (element) {
      registerEventListener(element, 'touchstart', onTouchStart as any, { passive: true });
      registerEventListener(element, 'touchmove', onTouchMove as any, { passive: false });
      registerEventListener(element, 'touchend', onTouchEnd as any, { passive: true });
    }
  }, [onTouchStart, onTouchMove, onTouchEnd, registerEventListener]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    bindPinchGestures,
    currentScale,
  };
};

// Hook for detecting mobile device and orientation
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const checkMobile = useCallback(() => {
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(userAgent) || window.innerWidth <= 768);
  }, []);

  const checkOrientation = useCallback(() => {
    setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  }, []);

  // Check on mount and window resize
  useEffect(() => {
    checkMobile();
    checkOrientation();

    const handleResize = () => {
      checkMobile();
      checkOrientation();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [checkMobile, checkOrientation]);

  return {
    isMobile,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

// Hook for mobile-specific viewport handling
export const useMobileViewport = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      setViewportHeight(currentHeight);

      // Detect virtual keyboard (significant height reduction on mobile)
      const heightDifference = initialHeight - currentHeight;
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    viewportHeight,
    isKeyboardOpen,
  };
};
