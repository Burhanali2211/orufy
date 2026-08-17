import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

interface LogoProps {
  siteName?: string;
  logoUrl?: string | null;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ siteName = 'Store', logoUrl, className = '' }) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const normalized = normalizeImageUrl(logoUrl);
    if (normalized && isValidImageUrl(normalized)) {
      setLogoSrc(normalized);
      setError(false);
    } else {
      setLogoSrc('');
      setError(true);
    }
  }, [logoUrl]);

  return (
    <Link to="/" className={`flex items-center gap-3 flex-shrink-0 min-w-0 ${className}`}>
      {!error && logoSrc ? (
        <img
          src={logoSrc}
          alt={siteName}
          className="h-9 w-auto max-w-[140px] max-h-10 object-contain rounded"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center text-sm sm:text-base shadow-sm">
          {siteName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-lg font-bold text-stone-900 tracking-tight truncate">
        {siteName}
      </span>
    </Link>
  );
};

export default Logo;
