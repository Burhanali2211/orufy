import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  useResponsiveDesign, 
  useResponsiveClasses, 
  useResponsiveGrid,
  BreakpointKey 
} from '../../utils/responsiveDesign';
import { 
  useAccessibilityPreferences, 
  useFocusManagement,
  useScreenReaderAnnouncements 
} from '../../utils/accessibilityUtils';

// Layout configuration
interface LayoutConfig {
  container: {
    maxWidth?: Partial<Record<BreakpointKey, string>>;
    padding?: Partial<Record<BreakpointKey, string>>;
    margin?: Partial<Record<BreakpointKey, string>>;
  };
  grid: {
    columns?: Partial<Record<BreakpointKey, number>>;
    gap?: Partial<Record<BreakpointKey, string>>;
  };
  breakpoints: {
    behavior?: 'fluid' | 'stepped';
    customBreakpoints?: Record<string, number>;
  };
}

// Component props
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  config?: Partial<LayoutConfig>;
  className?: string;
  enableAccessibility?: boolean;
  enableAnimations?: boolean;
  skipLinks?: Array<{ target: string; text: string }>;
  landmark?: 'main' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer';
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

// Grid item props
interface ResponsiveGridItemProps {
  children: React.ReactNode;
  span?: number | Partial<Record<BreakpointKey, number>>;
  offset?: number | Partial<Record<BreakpointKey, number>>;
  order?: number | Partial<Record<BreakpointKey, number>>;
  className?: string;
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
}

// Container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: Partial<Record<BreakpointKey, string>>;
  padding?: Partial<Record<BreakpointKey, string>>;
  className?: string;
  fluid?: boolean;
  centerContent?: boolean;
}

// Default layout configuration
const DEFAULT_CONFIG: LayoutConfig = {
  container: {
    maxWidth: {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    padding: {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
      '2xl': '3.5rem'
    }
  },
  grid: {
    columns: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 12,
      xl: 12,
      '2xl': 12
    },
    gap: {
      xs: '1rem',
      sm: '1.5rem',
      md: '2rem',
      lg: '2.5rem',
      xl: '3rem',
      '2xl': '3.5rem'
    }
  },
  breakpoints: {
    behavior: 'fluid'
  }
};

/**
 * Main responsive layout component
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  config = {},
  className = '',
  enableAccessibility = true,
  enableAnimations = true,
  skipLinks = [],
  landmark = 'main',
  ariaLabel,
  ariaLabelledBy
}) => {
  const { 
    breakpoint, 
    deviceType, 
    orientation, 
    isPWA, 
    isTouch,
    safeAreaInsets 
  } = useResponsiveDesign();
  
  const { preferences } = useAccessibilityPreferences();
  const { announce } = useScreenReaderAnnouncements();
  const responsiveClasses = useResponsiveClasses();
  
  const [layoutReady, setLayoutReady] = useState(false);
  
  // Merge configuration with defaults
  const layoutConfig = useMemo(() => {
    return {
      container: { ...DEFAULT_CONFIG.container, ...config.container },
      grid: { ...DEFAULT_CONFIG.grid, ...config.grid },
      breakpoints: { ...DEFAULT_CONFIG.breakpoints, ...config.breakpoints }
    };
  }, [config]);

  // Skip links removed — loader is used instead for initial UX

  // Announce layout changes to screen readers
  useEffect(() => {
    if (enableAccessibility && layoutReady) {
      const message = `Layout updated for ${deviceType} device in ${orientation} orientation`;
      announce(message, 'polite');
    }
  }, [breakpoint, deviceType, orientation, enableAccessibility, announce, layoutReady]);

  // Set layout ready after initial render
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  // Apply CSS custom properties for responsive values
  useEffect(() => {
    const root = document.documentElement;
    
    // Set safe area insets
    root.style.setProperty('--safe-area-inset-top', `${safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-inset-right', `${safeAreaInsets.right}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${safeAreaInsets.left}px`);
    
    // Set current breakpoint
    root.style.setProperty('--current-breakpoint', breakpoint);
    root.style.setProperty('--device-type', deviceType);
    root.style.setProperty('--orientation', orientation);
  }, [safeAreaInsets, breakpoint, deviceType, orientation]);

  // Build layout classes
  const layoutClasses = useMemo(() => {
    const classes = [
      'responsive-layout',
      responsiveClasses,
      preferences.reducedMotion && 'reduce-motion',
      preferences.highContrast && 'high-contrast',
      preferences.largeText && 'large-text',
      isTouch && 'touch-enabled',
      isPWA && 'pwa-mode',
      className
    ].filter(Boolean);

    return classes.join(' ');
  }, [responsiveClasses, preferences, isTouch, isPWA, className]);

  // Animation variants
  const layoutVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const LayoutComponent = landmark === 'main' ? 'main' : landmark;

  return (
    <LayoutComponent
      className={layoutClasses}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role={landmark === 'main' ? undefined : landmark}
    >
      {enableAnimations && !preferences.reducedMotion ? (
        <motion.div
          variants={layoutVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </LayoutComponent>
  );
};

/**
 * Responsive container component
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  padding,
  className = '',
  fluid = false,
  centerContent = true
}) => {
  const { getResponsiveValue } = useResponsiveDesign();
  
  const containerStyles = useMemo(() => {
    const styles: React.CSSProperties = {};
    
    if (!fluid && maxWidth) {
      styles.maxWidth = getResponsiveValue(maxWidth) || '100%';
    }
    
    if (padding) {
      styles.padding = getResponsiveValue(padding) || '1rem';
    }
    
    return styles;
  }, [fluid, maxWidth, padding, getResponsiveValue]);

  const containerClasses = useMemo(() => {
    const classes = [
      'responsive-container',
      fluid ? 'w-full' : 'max-w-full',
      centerContent && 'mx-auto',
      className
    ].filter(Boolean);

    return classes.join(' ');
  }, [fluid, centerContent, className]);

  return (
    <div className={containerClasses} style={containerStyles}>
      {children}
    </div>
  );
};

/**
 * Responsive grid component
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  columns?: Partial<Record<BreakpointKey, number>>;
  gap?: Partial<Record<BreakpointKey, string>>;
  className?: string;
}> = ({ children, columns, gap, className = '' }) => {
  const { getResponsiveValue } = useResponsiveDesign();
  const { gridColumns } = useResponsiveGrid(columns);
  
  const gridStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
      gap: getResponsiveValue(gap) || '1rem'
    };
    
    return styles;
  }, [gridColumns, gap, getResponsiveValue]);

  return (
    <div className={`responsive-grid ${className}`} style={gridStyles}>
      {children}
    </div>
  );
};

/**
 * Responsive grid item component
 */
export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  span = 1,
  offset = 0,
  order,
  className = '',
  alignSelf = 'stretch'
}) => {
  const { getResponsiveValue } = useResponsiveDesign();
  const { getColumnSpan } = useResponsiveGrid();
  
  const itemStyles = useMemo(() => {
    const actualSpan = typeof span === 'number' ? span : getResponsiveValue(span) || 1;
    const actualOffset = typeof offset === 'number' ? offset : getResponsiveValue(offset) || 0;
    const actualOrder = typeof order === 'number' ? order : getResponsiveValue(order);
    
    const styles: React.CSSProperties = {
      gridColumn: `span ${getColumnSpan(actualSpan)}`,
      alignSelf
    };
    
    if (actualOffset > 0) {
      styles.gridColumnStart = actualOffset + 1;
    }
    
    if (actualOrder !== undefined) {
      styles.order = actualOrder;
    }
    
    return styles;
  }, [span, offset, order, alignSelf, getResponsiveValue, getColumnSpan]);

  return (
    <div className={`responsive-grid-item ${className}`} style={itemStyles}>
      {children}
    </div>
  );
};

/**
 * Responsive stack component for vertical layouts
 */
export const ResponsiveStack: React.FC<{
  children: React.ReactNode;
  spacing?: Partial<Record<BreakpointKey, string>>;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  direction?: 'column' | 'row' | Partial<Record<BreakpointKey, 'column' | 'row'>>;
  className?: string;
}> = ({ 
  children, 
  spacing, 
  align = 'stretch', 
  justify = 'start',
  direction = 'column',
  className = '' 
}) => {
  const { getResponsiveValue } = useResponsiveDesign();
  
  const stackStyles = useMemo(() => {
    const actualDirection = typeof direction === 'string' 
      ? direction 
      : getResponsiveValue(direction) || 'column';
    
    const styles: React.CSSProperties = {
      display: 'flex',
      flexDirection: actualDirection,
      alignItems: align === 'start' ? 'flex-start' : 
                  align === 'end' ? 'flex-end' : 
                  align === 'center' ? 'center' : 'stretch',
      justifyContent: justify === 'start' ? 'flex-start' :
                     justify === 'end' ? 'flex-end' :
                     justify === 'center' ? 'center' :
                     justify === 'between' ? 'space-between' :
                     justify === 'around' ? 'space-around' :
                     justify === 'evenly' ? 'space-evenly' : 'flex-start',
      gap: getResponsiveValue(spacing) || '1rem'
    };
    
    return styles;
  }, [direction, align, justify, spacing, getResponsiveValue]);

  return (
    <div className={`responsive-stack ${className}`} style={stackStyles}>
      {children}
    </div>
  );
};

/**
 * Responsive aspect ratio component
 */
export const ResponsiveAspectRatio: React.FC<{
  children: React.ReactNode;
  ratio?: number | Partial<Record<BreakpointKey, number>>;
  className?: string;
}> = ({ children, ratio = 16/9, className = '' }) => {
  const { getResponsiveValue } = useResponsiveDesign();
  
  const aspectRatioStyles = useMemo(() => {
    const actualRatio = typeof ratio === 'number' 
      ? ratio 
      : getResponsiveValue(ratio) || 16/9;
    
    return {
      position: 'relative' as const,
      width: '100%',
      paddingBottom: `${(1 / actualRatio) * 100}%`
    };
  }, [ratio, getResponsiveValue]);

  return (
    <div className={`responsive-aspect-ratio ${className}`} style={aspectRatioStyles}>
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
};
