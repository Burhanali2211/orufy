/**
 * Hook for programmatic scroll to top functionality
 * Can be used in components that need to scroll to top on specific actions
 */
export const useScrollToTop = () => {
  const scrollToTop = (behavior: 'smooth' | 'instant' = 'smooth') => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior
    });
  };

  return { scrollToTop };
};
