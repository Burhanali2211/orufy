/**
 * Hook to automatically track page views with Google Analytics
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};

