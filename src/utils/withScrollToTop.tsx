import React from 'react';
import { useScrollToTop } from '../hooks/useScrollToTop';

/**
 * Higher-order component that wraps a component with scroll-to-top functionality
 * Useful for specific pages that need custom scroll behavior
 */
export const withScrollToTop = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function WrappedComponent(props: P) {
    const { scrollToTop } = useScrollToTop();
    
    React.useEffect(() => {
      scrollToTop('instant');
    }, [scrollToTop]);

    return <Component {...props} />;
  };
};
