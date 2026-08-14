import { useEffect, useState, useCallback, useRef } from 'react';

// WCAG compliance levels
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Color contrast ratios for different WCAG levels
export const CONTRAST_RATIOS = {
  A: { normal: 3, large: 3 },
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 }
} as const;

// Accessibility preferences
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// Focus management
export interface FocusManager {
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: (element?: HTMLElement) => void;
  moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') => void;
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
}

// Announcement types for screen readers
export type AnnouncementPriority = 'polite' | 'assertive' | 'off';

/**
 * Hook for managing accessibility preferences
 */
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    if (typeof window === 'undefined') {
      return {
        reducedMotion: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: false,
        focusVisible: false,
        colorBlindness: 'none'
      };
    }

    return detectAccessibilityPreferences();
  });

  useEffect(() => {
    const updatePreferences = () => {
      try {
        setPreferences(detectAccessibilityPreferences());
      } catch (error) {
        console.warn('Failed to update accessibility preferences:', error);
      }
    };

    // Listen for media query changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    // Listen for storage changes (user preferences)
    // Wrap in try-catch to prevent errors from browser extensions
    const handleStorageChange = (event: StorageEvent | null) => {
      try {
        // Safely check if event exists and has required properties
        if (!event) return;
        
        // Only process events related to our accessibility preferences
        // Check if event.key exists before accessing it
        if (event.key === 'accessibility_preferences' || event.key === null) {
          updatePreferences();
        }
      } catch (error) {
        // Silently ignore errors from browser extensions or malformed events
        // This prevents extension errors from breaking our app
        if (process.env.NODE_ENV === 'development') {
          console.debug('Storage event error (likely from extension):', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // Save to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('accessibility_preferences') || '{}');
      localStorage.setItem('accessibility_preferences', JSON.stringify({
        ...saved,
        [key]: value
      }));
    } catch (error) {
      console.warn('Failed to save accessibility preference:', error);
    }
  }, []);

  return {
    preferences,
    updatePreference
  };
};

/**
 * Detect accessibility preferences from system and user settings
 */
function detectAccessibilityPreferences(): AccessibilityPreferences {
  const preferences: AccessibilityPreferences = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: false,
    colorBlindness: 'none'
  };

  // Check for screen reader
  preferences.screenReader = !!(
    window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Dragon/i) ||
    window.speechSynthesis ||
    (window as any).speechSynthesis
  );

  // Load saved preferences
  try {
    const saved = JSON.parse(localStorage.getItem('accessibility_preferences') || '{}');
    Object.assign(preferences, saved);
  } catch (error) {
    console.warn('Failed to load accessibility preferences:', error);
  }

  return preferences;
}

/**
 * Hook for focus management
 */
export const useFocusManagement = (): FocusManager => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        const element = el as HTMLElement;
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden';
      }) as HTMLElement[];
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [getFocusableElements]);

  const restoreFocus = useCallback((element?: HTMLElement) => {
    const targetElement = element || previousFocusRef.current;
    if (targetElement && document.contains(targetElement)) {
      targetElement.focus();
    }
    previousFocusRef.current = null;
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const focusableElements = getFocusableElements(document.body);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    let targetIndex: number;
    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'previous':
        targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case 'first':
        targetIndex = 0;
        break;
      case 'last':
        targetIndex = focusableElements.length - 1;
        break;
    }

    focusableElements[targetIndex]?.focus();
  }, [getFocusableElements]);

  return {
    trapFocus,
    restoreFocus,
    moveFocus,
    getFocusableElements
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReaderAnnouncements = () => {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement container
    if (!announcementRef.current) {
      const container = document.createElement('div');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.className = 'sr-only';
      container.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(container);
      announcementRef.current = container;
    }

    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((
    message: string, 
    priority: AnnouncementPriority = 'polite'
  ) => {
    if (!announcementRef.current) return;

    // Update aria-live attribute
    announcementRef.current.setAttribute('aria-live', priority);
    
    // Clear and set message
    announcementRef.current.textContent = '';
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return { announce };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  handlers: Record<string, (event: KeyboardEvent) => void>
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = [];
      
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('meta');
      
      const keyCombo = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
      
      if (handlers[keyCombo]) {
        handlers[keyCombo](event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = colorContrast.hexToRgb(color1);
    const rgb2 = colorContrast.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = colorContrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = colorContrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check WCAG compliance
  checkWCAGCompliance: (
    foreground: string, 
    background: string, 
    level: WCAGLevel = 'AA',
    isLargeText: boolean = false
  ): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    const required = CONTRAST_RATIOS[level][isLargeText ? 'large' : 'normal'];
    return ratio >= required;
  }
};

/**
 * ARIA utilities
 */
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create ARIA describedby relationship
  createDescribedBy: (elements: HTMLElement[]): string => {
    return elements
      .map(el => el.id || (el.id = ariaUtils.generateId()))
      .join(' ');
  },

  // Set ARIA expanded state
  setExpanded: (element: HTMLElement, expanded: boolean): void => {
    element.setAttribute('aria-expanded', expanded.toString());
  },

  // Set ARIA selected state
  setSelected: (element: HTMLElement, selected: boolean): void => {
    element.setAttribute('aria-selected', selected.toString());
  },

  // Set ARIA pressed state
  setPressed: (element: HTMLElement, pressed: boolean): void => {
    element.setAttribute('aria-pressed', pressed.toString());
  },

  // Set ARIA checked state
  setChecked: (element: HTMLElement, checked: boolean | 'mixed'): void => {
    element.setAttribute('aria-checked', checked.toString());
  }
};

/**
 * Skip link utilities
 */
export const skipLinks = {
  create: (target: string, text: string = 'Skip to main content'): HTMLAnchorElement => {
    const skipLink = document.createElement('a');
    skipLink.href = target;
    skipLink.textContent = text;
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    return skipLink;
  },

  install: (links: Array<{ target: string; text: string }>): void => {
    const container = document.createElement('div');
    container.className = 'skip-links';
    
    links.forEach(({ target, text }) => {
      container.appendChild(skipLinks.create(target, text));
    });
    
    document.body.insertBefore(container, document.body.firstChild);
  }
};

/**
 * Accessibility testing utilities
 */
export const accessibilityTest = {
  // Check for missing alt text
  checkAltText: (container: HTMLElement = document.body): HTMLImageElement[] => {
    const images = container.querySelectorAll('img');
    return Array.from(images).filter(img => 
      !img.alt && 
      !img.getAttribute('aria-label') && 
      !img.getAttribute('aria-labelledby') &&
      img.getAttribute('role') !== 'presentation'
    );
  },

  // Check for missing form labels
  checkFormLabels: (container: HTMLElement = document.body): HTMLInputElement[] => {
    const inputs = container.querySelectorAll('input, select, textarea');
    return Array.from(inputs).filter(input => {
      const element = input as HTMLInputElement;
      return !element.labels?.length && 
             !element.getAttribute('aria-label') && 
             !element.getAttribute('aria-labelledby') &&
             element.type !== 'hidden';
    });
  },

  // Check heading hierarchy
  checkHeadingHierarchy: (container: HTMLElement = document.body): Array<{ element: HTMLElement; issue: string }> => {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const issues: Array<{ element: HTMLElement; issue: string }> = [];
    
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        issues.push({
          element: heading as HTMLElement,
          issue: `Heading level ${level} follows level ${previousLevel}, skipping levels`
        });
      }
      
      previousLevel = level;
    });
    
    return issues;
  },

  // Generate accessibility report
  generateReport: (container: HTMLElement = document.body) => {
    return {
      missingAltText: accessibilityTest.checkAltText(container),
      missingFormLabels: accessibilityTest.checkFormLabels(container),
      headingIssues: accessibilityTest.checkHeadingHierarchy(container),
      timestamp: new Date().toISOString()
    };
  }
};
