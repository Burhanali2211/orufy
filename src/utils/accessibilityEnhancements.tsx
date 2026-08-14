import React, { useEffect, useRef, useState } from 'react';

// Accessibility Constants
export const ARIA_ROLES = {
  button: 'button',
  link: 'link',
  menu: 'menu',
  menuitem: 'menuitem',
  tab: 'tab',
  tabpanel: 'tabpanel',
  dialog: 'dialog',
  alert: 'alert',
  status: 'status',
  progressbar: 'progressbar',
  grid: 'grid',
  gridcell: 'gridcell',
  columnheader: 'columnheader',
  rowheader: 'rowheader'
} as const;

export const ARIA_STATES = {
  expanded: 'aria-expanded',
  selected: 'aria-selected',
  checked: 'aria-checked',
  disabled: 'aria-disabled',
  hidden: 'aria-hidden',
  pressed: 'aria-pressed',
  current: 'aria-current'
} as const;

export const ARIA_PROPERTIES = {
  label: 'aria-label',
  labelledby: 'aria-labelledby',
  describedby: 'aria-describedby',
  controls: 'aria-controls',
  owns: 'aria-owns',
  live: 'aria-live',
  atomic: 'aria-atomic',
  relevant: 'aria-relevant'
} as const;

// Keyboard Navigation Hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; disabled?: boolean }>,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onSelect?: (id: string) => void;
  } = {}
) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { loop = true, orientation = 'vertical', onSelect } = options;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    const enabledItems = items.filter(item => !item.disabled);
    const currentEnabledIndex = enabledItems.findIndex(
      item => item.id === items[focusedIndex]?.id
    );

    let nextIndex = currentEnabledIndex;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          nextIndex = currentEnabledIndex + 1;
          if (nextIndex >= enabledItems.length) {
            nextIndex = loop ? 0 : enabledItems.length - 1;
          }
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          nextIndex = currentEnabledIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? enabledItems.length - 1 : 0;
          }
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          nextIndex = currentEnabledIndex + 1;
          if (nextIndex >= enabledItems.length) {
            nextIndex = loop ? 0 : enabledItems.length - 1;
          }
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          nextIndex = currentEnabledIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? enabledItems.length - 1 : 0;
          }
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect && enabledItems[currentEnabledIndex]) {
          onSelect(enabledItems[currentEnabledIndex].id);
        }
        break;
    }

    if (nextIndex !== currentEnabledIndex && enabledItems[nextIndex]) {
      const actualIndex = items.findIndex(item => item.id === enabledItems[nextIndex].id);
      setFocusedIndex(actualIndex);
    }
  };

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
};

// Focus Management Hook
export const useFocusManagement = () => {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableElementsSelector));
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  return {
    getFocusableElements,
    trapFocus,
    restoreFocus
  };
};

// Screen Reader Announcements Hook
export const useScreenReaderAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);

    // Create a temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
      setAnnouncements(prev => prev.filter(msg => msg !== message));
    }, 1000);
  };

  return {
    announce,
    announcements
  };
};

// Color Contrast Checker
export const checkColorContrast = (foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
};

// Reduced Motion Hook
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// High Contrast Mode Hook
export const useHighContrastMode = (): boolean => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows High Contrast mode
      const isHighContrastWindows = window.matchMedia('(-ms-high-contrast: active)').matches;

      // Check for forced colors (newer standard)
      const isForcedColors = window.matchMedia('(forced-colors: active)').matches;

      setIsHighContrast(isHighContrastWindows || isForcedColors);
    };

    checkHighContrast();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(-ms-high-contrast: active)'),
      window.matchMedia('(forced-colors: active)')
    ];

    const handleChange = () => checkHighContrast();

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  return isHighContrast;
};

// ARIA Live Region Hook
export const useAriaLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateLiveRegion = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  };

  const clearLiveRegion = () => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  };

  return {
    liveRegionRef,
    updateLiveRegion,
    clearLiveRegion
  };
};

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
      onBlur={(e) => e.currentTarget.classList.add('sr-only')}
    >
      {children}
    </a>
  );
};

// Accessibility Audit Function
export const auditAccessibility = (element: HTMLElement): {
  issues: Array<{ type: string; message: string; element: HTMLElement }>;
  score: number;
} => {
  const issues: Array<{ type: string; message: string; element: HTMLElement }> = [];

  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push({
        type: 'missing-alt-text',
        message: 'Image missing alt text',
        element: img as HTMLElement
      });
    }
  });

  // Check for missing form labels
  const inputs = element.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    const hasLabel = input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      element.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'missing-form-label',
        message: 'Form control missing label',
        element: input as HTMLElement
      });
    }
  });

  // Check for insufficient color contrast
  const textElements = element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // This is a simplified check - in practice, you'd need to convert colors and check contrast
      // For now, we'll skip this check as it requires more complex color parsing
    }
  });

  // Check for missing heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > lastLevel + 1) {
      issues.push({
        type: 'heading-hierarchy',
        message: `Heading level ${level} follows level ${lastLevel}, skipping levels`,
        element: heading as HTMLElement
      });
    }
    lastLevel = level;
  });

  // Calculate score (100 - number of issues)
  const score = Math.max(0, 100 - issues.length * 5);

  return { issues, score };
};

// Initialize accessibility features
export const initializeAccessibility = () => {
  // Skip link is handled by React component, no need to add programmatically

  // Add main landmark if it doesn't exist
  if (!document.querySelector('main')) {
    const mainContent = document.querySelector('#main-content, .main-content, [role="main"]');
    if (mainContent && mainContent.tagName !== 'MAIN') {
      const main = document.createElement('main');
      main.id = 'main-content';
      mainContent.parentNode?.insertBefore(main, mainContent);
      main.appendChild(mainContent);
    }
  }

  // Set up global keyboard navigation
  document.addEventListener('keydown', (event) => {
    // Escape key to close modals/dropdowns
    if (event.key === 'Escape') {
      const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
      openModals.forEach(modal => {
        const closeButton = modal.querySelector('[data-close], [aria-label*="close"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      });
    }
  });
};
