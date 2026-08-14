import React from 'react';

interface RecentlyViewedProps {
  maxItems?: number;
  showClearButton?: boolean;
  className?: string;
  layout?: 'horizontal' | 'grid';
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  maxItems = 6,
  showClearButton = true,
  className = '',
  layout = 'horizontal'
}) => {
  // Recently viewed feature coming soon
  return null;
};

export const RecentlyViewedCompact: React.FC<{
  maxItems?: number;
  className?: string;
}> = ({ maxItems = 3, className = '' }) => {
  // Recently viewed feature coming soon
  return null;
};

export default RecentlyViewed;
