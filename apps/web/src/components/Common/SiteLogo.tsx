import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

const LOGO_FALLBACKS = ['/logo-optimized.webp', '/logo.png', '/logo.webp'];

interface SiteLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  showFallbackIcon?: boolean;
}

const sizeMap = {
  sm: { container: 'w-6 h-6', icon: 'w-4 h-4', img: 'w-6 h-6' },
  md: { container: 'w-8 h-8', icon: 'w-5 h-5', img: 'w-8 h-8' },
  lg: { container: 'w-10 h-10', icon: 'w-6 h-6', img: 'w-10 h-10' },
  xl: { container: 'w-14 h-14', icon: 'w-8 h-8', img: 'w-14 h-14' },
};

export const SiteLogo: React.FC<SiteLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'default',
  showFallbackIcon = true,
}) => {
  const { getSiteSetting } = useSettings();
  const logoUrl = getSiteSetting('logo_url');
  
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const normalized = normalizeImageUrl(logoUrl);
    
    if (normalized && isValidImageUrl(normalized)) {
      setCurrentSrc(normalized);
      setHasError(false);
      setIsLoading(false);
    } else {
      for (const fallback of LOGO_FALLBACKS) {
        if (isValidImageUrl(fallback)) {
          setCurrentSrc(fallback);
          setHasError(false);
          setIsLoading(false);
          return;
        }
      }
      setHasError(true);
      setIsLoading(false);
    }
  }, [logoUrl]);

  const handleError = () => {
    const currentIndex = LOGO_FALLBACKS.indexOf(currentSrc);
    if (currentIndex === -1) {
      if (LOGO_FALLBACKS.length > 0) {
        setCurrentSrc(LOGO_FALLBACKS[0]);
        return;
      }
    } else if (currentIndex < LOGO_FALLBACKS.length - 1) {
      setCurrentSrc(LOGO_FALLBACKS[currentIndex + 1]);
      return;
    }
    setHasError(true);
  };

  const sizes = sizeMap[size];
  
  const containerClasses = variant === 'white'
    ? 'bg-white/20 rounded-lg flex items-center justify-center'
    : 'bg-gray-900 rounded-lg flex items-center justify-center';

  const iconColor = 'text-white';
  const imgFilter = variant === 'dark' ? 'brightness-0 invert' : '';

  if (isLoading) {
    return (
      <div className={`${sizes.container} ${containerClasses} ${className}`}>
        <div className={`${sizes.icon} bg-gray-300 rounded animate-pulse`}></div>
      </div>
    );
  }

  if (hasError || !currentSrc) {
    if (showFallbackIcon) {
      return (
        <div className={`${sizes.container} ${containerClasses} ${className}`}>
          <Leaf className={`${sizes.icon} ${iconColor}`} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`${sizes.container} ${containerClasses} overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt="Site Logo"
        className={`${sizes.img} object-contain ${imgFilter}`}
        onError={handleError}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default SiteLogo;
