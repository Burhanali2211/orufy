import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  enablePWASupport?: boolean;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  orientation: 'portrait' | 'landscape';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  enablePWASupport = true,
  showMobileMenu = false,
  onMobileMenuToggle
}) => {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPWA: false,
    orientation: 'landscape'
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true;
      const orientation = width > height ? 'landscape' : 'portrait';

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isPWA,
        orientation
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const handleMobileMenuToggle = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMobileMenuToggle?.(newState);
  };

  const containerClasses = [
    'responsive-container',
    viewport.isMobile && 'mobile-view',
    viewport.isTablet && 'tablet-view',
    viewport.isDesktop && 'desktop-view',
    viewport.isPWA && 'pwa-view',
    viewport.orientation === 'landscape' && 'landscape-view',
    viewport.orientation === 'portrait' && 'portrait-view',
    enablePWASupport && viewport.isPWA && 'pwa-safe-area',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* PWA Status Bar Spacer */}
      {enablePWASupport && viewport.isPWA && (
        <div className="pwa-status-bar-spacer h-safe-top" />
      )}

      {/* Mobile Menu Toggle */}
      {viewport.isMobile && showMobileMenu && (
        <div className="mobile-menu-header flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
          <button
            onClick={handleMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {viewport.isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="mobile-menu-content bg-white w-80 h-full shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={handleMobileMenuToggle}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {/* Menu content would go here */}
              <p className="text-sm text-gray-600">Mobile menu content</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="responsive-content">
        {children}
      </div>

      {/* PWA Bottom Safe Area */}
      {enablePWASupport && viewport.isPWA && (
        <div className="pwa-bottom-spacer h-safe-bottom" />
      )}


    </div>
  );
};

// Hook for accessing viewport information
export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPWA: false,
    orientation: 'landscape'
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true;
      const orientation = width > height ? 'landscape' : 'portrait';

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isPWA,
        orientation
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
};

// PWA Installation Hook
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isPWA);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  };

  return {
    isInstallable,
    isInstalled,
    installPWA
  };
};

// Touch and Gesture Support Hook
export const useTouchGestures = () => {
  const [touchInfo, setTouchInfo] = useState({
    isTouch: false,
    supportsHover: true,
    preferredInputSize: 'normal' as 'small' | 'normal' | 'large'
  });

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    const preferredInputSize = window.matchMedia('(pointer: coarse)').matches ? 'large' : 'normal';

    setTouchInfo({
      isTouch,
      supportsHover,
      preferredInputSize
    });
  }, []);

  return touchInfo;
};
