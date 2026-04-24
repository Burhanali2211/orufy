import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

// Public logo path fallbacks (in order of preference)
const LOGO_FALLBACKS = ['/logo-optimized.webp', '/logo.png', '/logo.webp'];

interface LogoProps {
  siteName?: string;
  logoUrl?: string | null;
}

export const Logo: React.FC<LogoProps> = ({ siteName, logoUrl }) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [error, setError] = useState(false);

  // Normalize logo URL from database
  useEffect(() => {
    // Try to normalize the provided logo URL
    const normalized = normalizeImageUrl(logoUrl);
    
    if (normalized && isValidImageUrl(normalized)) {
      setLogoSrc(normalized);
      setError(false);
    } else {
      // Try fallbacks
      for (const fallback of LOGO_FALLBACKS) {
        if (isValidImageUrl(fallback)) {
          setLogoSrc(fallback);
          setError(false);
          return;
        }
      }
      // No valid logo found
      setLogoSrc('');
      setError(true);
    }
  }, [logoUrl]);

  const handleError = () => {
    // Try next fallback
    const currentIndex = LOGO_FALLBACKS.indexOf(logoSrc);
    if (currentIndex >= 0 && currentIndex < LOGO_FALLBACKS.length - 1) {
      const nextFallback = LOGO_FALLBACKS[currentIndex + 1];
      setLogoSrc(nextFallback);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
      {error || !logoSrc ? (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
          <span className="text-xs text-gray-500">Logo</span>
        </div>
      ) : (
        <img
          src={logoSrc}
          alt="Logo"
          onError={handleError}
          className="w-10 h-10 object-contain"
          loading="eager"
        />
      )}
      {siteName && (
        <span className="font-bold text-gray-900 text-xl tracking-tight">{siteName}</span>
      )}
    </Link>
  );
};
