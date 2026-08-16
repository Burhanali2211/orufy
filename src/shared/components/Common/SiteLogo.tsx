import React from 'react';

interface SiteLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  showFallbackIcon?: boolean;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

export const SiteLogo: React.FC<SiteLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'default',
}) => {
  const imgFilter = variant === 'dark' ? 'brightness-0 invert' : '';

  return (
    <img
      src="/logo.png"
      alt="Site Logo"
      className={`${sizeMap[size]} rounded-full object-cover border border-stone-200/40 shadow-2xs ${imgFilter} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export default SiteLogo;
