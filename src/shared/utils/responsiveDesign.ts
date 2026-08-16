import { useState, useEffect, useCallback, useMemo } from 'react';

// Enhanced breakpoint system
export const BREAKPOINTS = {
  xs: 320,   // Extra small devices
  sm: 640,   // Small devices
  md: 768,   // Medium devices
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
  '2xl': 1536, // 2X large devices
  '3xl': 1920, // Ultra wide displays
  '4xl': 2560  // 4K displays
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv';

// Orientation types
export type Orientation = 'portrait' | 'landscape';

// Viewport information
export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  deviceType: DeviceType;
  orientation: Orientation;
  pixelRatio: number;
  isTouch: boolean;
  isPWA: boolean;
  isRetina: boolean;
  aspectRatio: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Container sizes for different breakpoints
export const CONTAINER_SIZES = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px'
} as const;

// Grid system configuration
export const GRID_COLUMNS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 12,
  xl: 12,
  '2xl': 12,
  '3xl': 16,
  '4xl': 20
} as const;

// Spacing scale for responsive design
export const SPACING_SCALE = {
  xs: { base: 4, scale: 1 },
  sm: { base: 4, scale: 1.2 },
  md: { base: 6, scale: 1.4 },
  lg: { base: 8, scale: 1.6 },
  xl: { base: 10, scale: 1.8 },
  '2xl': { base: 12, scale: 2 },
  '3xl': { base: 16, scale: 2.2 },
  '4xl': { base: 20, scale: 2.4 }
} as const;

// Typography scale for responsive design
export const TYPOGRAPHY_SCALE = {
  xs: { base: 14, scale: 1 },
  sm: { base: 14, scale: 1.1 },
  md: { base: 16, scale: 1.2 },
  lg: { base: 16, scale: 1.3 },
  xl: { base: 18, scale: 1.4 },
  '2xl': { base: 18, scale: 1.5 },
  '3xl': { base: 20, scale: 1.6 },
  '4xl': { base: 22, scale: 1.7 }
} as const;

/**
 * Enhanced responsive hook with comprehensive viewport information
 */
export const useResponsiveDesign = () => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg' as BreakpointKey,
        deviceType: 'desktop' as DeviceType,
        orientation: 'landscape' as Orientation,
        pixelRatio: 1,
        isTouch: false,
        isPWA: false,
        isRetina: false,
        aspectRatio: 1.33,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      };
    }

    return calculateViewportInfo();
  });

  const updateViewportInfo = useCallback(() => {
    setViewportInfo(calculateViewportInfo());
  }, []);

  useEffect(() => {
    // Initial calculation
    updateViewportInfo();

    // Listen for resize events
    const handleResize = debounce(updateViewportInfo, 150);
    window.addEventListener('resize', handleResize);

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(updateViewportInfo, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // Listen for PWA installation
    const handleBeforeInstallPrompt = () => {
      updateViewportInfo();
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [updateViewportInfo]);

  // Responsive utilities
  const isBreakpoint = useCallback((breakpoint: BreakpointKey) => {
    return viewportInfo.breakpoint === breakpoint;
  }, [viewportInfo.breakpoint]);

  const isBreakpointUp = useCallback((breakpoint: BreakpointKey) => {
    return viewportInfo.width >= BREAKPOINTS[breakpoint];
  }, [viewportInfo.width]);

  const isBreakpointDown = useCallback((breakpoint: BreakpointKey) => {
    return viewportInfo.width < BREAKPOINTS[breakpoint];
  }, [viewportInfo.width]);

  const getResponsiveValue = useCallback(<T>(values: Partial<Record<BreakpointKey, T>>): T | undefined => {
    const breakpoints = Object.keys(BREAKPOINTS) as BreakpointKey[];
    const sortedBreakpoints = breakpoints.sort((a, b) => BREAKPOINTS[a] - BREAKPOINTS[b]);

    // Find the largest breakpoint that matches
    for (let i = sortedBreakpoints.length - 1; i >= 0; i--) {
      const bp = sortedBreakpoints[i];
      if (viewportInfo.width >= BREAKPOINTS[bp] && values[bp] !== undefined) {
        return values[bp];
      }
    }

    // Fallback to the smallest available value
    for (const bp of sortedBreakpoints) {
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }

    return undefined;
  }, [viewportInfo.width]);

  const getContainerSize = useCallback(() => {
    return CONTAINER_SIZES[viewportInfo.breakpoint];
  }, [viewportInfo.breakpoint]);

  const getGridColumns = useCallback(() => {
    return GRID_COLUMNS[viewportInfo.breakpoint];
  }, [viewportInfo.breakpoint]);

  const getSpacing = useCallback((multiplier: number = 1) => {
    const config = SPACING_SCALE[viewportInfo.breakpoint];
    return config.base * config.scale * multiplier;
  }, [viewportInfo.breakpoint]);

  const getTypographySize = useCallback((multiplier: number = 1) => {
    const config = TYPOGRAPHY_SCALE[viewportInfo.breakpoint];
    return config.base * config.scale * multiplier;
  }, [viewportInfo.breakpoint]);

  return {
    ...viewportInfo,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    getResponsiveValue,
    getContainerSize,
    getGridColumns,
    getSpacing,
    getTypographySize,
    isMobile: viewportInfo.deviceType === 'mobile',
    isTablet: viewportInfo.deviceType === 'tablet',
    isDesktop: viewportInfo.deviceType === 'desktop',
    isPortrait: viewportInfo.orientation === 'portrait',
    isLandscape: viewportInfo.orientation === 'landscape'
  };
};

/**
 * Calculate comprehensive viewport information
 */
function calculateViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const aspectRatio = width / height;

  // Determine breakpoint
  let breakpoint: BreakpointKey = 'xs';
  const breakpointEntries = Object.entries(BREAKPOINTS) as [BreakpointKey, number][];
  for (const [bp, minWidth] of breakpointEntries.reverse()) {
    if (width >= minWidth) {
      breakpoint = bp;
      break;
    }
  }

  // Determine device type
  let deviceType: DeviceType = 'desktop';
  if (width < BREAKPOINTS.md) {
    deviceType = 'mobile';
  } else if (width < BREAKPOINTS.lg) {
    deviceType = 'tablet';
  } else if (width >= BREAKPOINTS['3xl']) {
    deviceType = 'tv';
  }

  // Determine orientation
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';

  // Check for touch support
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check for PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: fullscreen)').matches ||
                (window.navigator as any).standalone === true;

  // Check for retina display
  const isRetina = pixelRatio > 1;

  // Calculate safe area insets (for PWA/mobile)
  const safeAreaInsets = {
    top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0')
  };

  return {
    width,
    height,
    breakpoint,
    deviceType,
    orientation,
    pixelRatio,
    isTouch,
    isPWA,
    isRetina,
    aspectRatio,
    safeAreaInsets
  };
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

/**
 * Hook for responsive classes
 */
export const useResponsiveClasses = () => {
  const { breakpoint, deviceType, orientation, isPWA, isTouch } = useResponsiveDesign();

  return useMemo(() => {
    const classes = [
      `breakpoint-${breakpoint}`,
      `device-${deviceType}`,
      `orientation-${orientation}`,
      isTouch && 'touch-device',
      isPWA && 'pwa-mode',
      !isTouch && 'no-touch'
    ].filter(Boolean);

    return classes.join(' ');
  }, [breakpoint, deviceType, orientation, isPWA, isTouch]);
};

/**
 * Hook for responsive grid system
 */
export const useResponsiveGrid = (columns?: Partial<Record<BreakpointKey, number>>) => {
  const { getGridColumns, getResponsiveValue } = useResponsiveDesign();

  const gridColumns = useMemo(() => {
    if (columns) {
      return getResponsiveValue(columns) || getGridColumns();
    }
    return getGridColumns();
  }, [columns, getResponsiveValue, getGridColumns]);

  const getColumnSpan = useCallback((span: number | Partial<Record<BreakpointKey, number>>) => {
    if (typeof span === 'number') {
      return Math.min(span, gridColumns);
    }
    return Math.min(getResponsiveValue(span) || 1, gridColumns);
  }, [gridColumns, getResponsiveValue]);

  const getColumnWidth = useCallback((span: number | Partial<Record<BreakpointKey, number>>) => {
    const actualSpan = getColumnSpan(span);
    return `${(actualSpan / gridColumns) * 100}%`;
  }, [getColumnSpan, gridColumns]);

  return {
    gridColumns,
    getColumnSpan,
    getColumnWidth
  };
};

/**
 * Hook for responsive spacing
 */
export const useResponsiveSpacing = () => {
  const { getSpacing } = useResponsiveDesign();

  const spacing = useMemo(() => ({
    xs: getSpacing(0.25),
    sm: getSpacing(0.5),
    md: getSpacing(1),
    lg: getSpacing(1.5),
    xl: getSpacing(2),
    '2xl': getSpacing(3),
    '3xl': getSpacing(4),
    '4xl': getSpacing(6)
  }), [getSpacing]);

  return spacing;
};

/**
 * Hook for responsive typography
 */
export const useResponsiveTypography = () => {
  const { getTypographySize } = useResponsiveDesign();

  const typography = useMemo(() => ({
    xs: getTypographySize(0.75),
    sm: getTypographySize(0.875),
    base: getTypographySize(1),
    lg: getTypographySize(1.125),
    xl: getTypographySize(1.25),
    '2xl': getTypographySize(1.5),
    '3xl': getTypographySize(1.875),
    '4xl': getTypographySize(2.25),
    '5xl': getTypographySize(3),
    '6xl': getTypographySize(3.75)
  }), [getTypographySize]);

  return typography;
};

/**
 * Media query utilities
 */
export const mediaQueries = {
  up: (breakpoint: BreakpointKey) => `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`,
  down: (breakpoint: BreakpointKey) => `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,
  between: (min: BreakpointKey, max: BreakpointKey) => 
    `@media (min-width: ${BREAKPOINTS[min]}px) and (max-width: ${BREAKPOINTS[max] - 1}px)`,
  only: (breakpoint: BreakpointKey) => {
    const breakpointKeys = Object.keys(BREAKPOINTS) as BreakpointKey[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    
    if (nextBreakpoint) {
      return `@media (min-width: ${BREAKPOINTS[breakpoint]}px) and (max-width: ${BREAKPOINTS[nextBreakpoint] - 1}px)`;
    } else {
      return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
    }
  },
  touch: '@media (hover: none) and (pointer: coarse)',
  hover: '@media (hover: hover) and (pointer: fine)',
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  pwa: '@media (display-mode: standalone)'
};

/**
 * Responsive image utilities
 */
export const getResponsiveImageSizes = (
  sizes: Partial<Record<BreakpointKey, string>>
): string => {
  const breakpointKeys = Object.keys(BREAKPOINTS) as BreakpointKey[];
  const sortedBreakpoints = breakpointKeys.sort((a, b) => BREAKPOINTS[b] - BREAKPOINTS[a]);
  
  const sizesArray: string[] = [];
  
  for (const bp of sortedBreakpoints) {
    if (sizes[bp]) {
      if (bp === 'xs') {
        sizesArray.push(sizes[bp]!);
      } else {
        sizesArray.push(`(min-width: ${BREAKPOINTS[bp]}px) ${sizes[bp]}`);
      }
    }
  }
  
  return sizesArray.join(', ');
};
