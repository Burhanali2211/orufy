import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ==================== MOBILE AUTH ====================

export const useMobileAuth = () => {
  const { isMobileAuthOpen, mobileAuthMode, openMobileAuth, closeMobileAuth } = useAuth();
  return { isOpen: isMobileAuthOpen, mode: mobileAuthMode, open: openMobileAuth, close: closeMobileAuth };
};

// ==================== MOBILE DETECTION ====================

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  });
  const [screenWidth, setScreenWidth] = useState<number>(() => typeof window !== 'undefined' ? window.innerWidth : 0);
  const [screenHeight, setScreenHeight] = useState<number>(() => typeof window !== 'undefined' ? window.innerHeight : 0);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, screenWidth, screenHeight, isPortrait, isLandscape: !isPortrait, isSmallScreen: screenWidth < 640, isMediumScreen: screenWidth >= 640 && screenWidth < 1024, isLargeScreen: screenWidth >= 1024 };
};

// ==================== UNIFIED MOBILE HOOK ====================

export const useMobileFeatures = () => {
  const auth = useMobileAuth();
  const detection = useMobileDetection();
  return { auth, detection, ...detection, ...auth };
};

// ==================== SWIPE GESTURES ====================

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  preventDefaultTouchmove?: boolean;
}

export const useSwipeGesture = (gestures: SwipeOptions, config: SwipeConfig = {}) => {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const touchStartVertical = useRef<number | null>(null);
  const touchEndVertical = useRef<number | null>(null);

  const { minSwipeDistance = 50, preventDefaultTouchmove = false } = config;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
    touchStartVertical.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
    touchEndVertical.current = e.targetTouches[0].clientY;
    if (preventDefaultTouchmove && e.cancelable) {
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const distanceVertical = touchStartVertical.current! - touchEndVertical.current!;
    const isUpSwipe = distanceVertical > minSwipeDistance;
    const isDownSwipe = distanceVertical < -minSwipeDistance;

    // Detect primary direction
    if (Math.abs(distance) > Math.abs(distanceVertical)) {
      if (isLeftSwipe && gestures.onSwipeLeft) gestures.onSwipeLeft();
      if (isRightSwipe && gestures.onSwipeRight) gestures.onSwipeRight();
    } else {
      if (isUpSwipe && gestures.onSwipeUp) gestures.onSwipeUp();
      if (isDownSwipe && gestures.onSwipeDown) gestures.onSwipeDown();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

// ==================== DEFAULT EXPORT ====================

export default useMobileFeatures;
