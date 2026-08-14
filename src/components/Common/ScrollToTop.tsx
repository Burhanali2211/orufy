import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Disable browser's native scroll restoration so it can't override ours
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force instant scroll — 'instant' prevents any animation fighting us
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Belt-and-suspenders: also reset these directly in case the browser ignores window.scrollTo
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};
