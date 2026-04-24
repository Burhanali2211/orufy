import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from URL if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Capitalize and format segment
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`bg-neutral-50 border-b border-neutral-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li
              key={index}
              className="flex items-center"
            >
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-neutral-400 mx-3" />
              )}

              {item.href ? (
                <Link
                  to={item.href}
                  className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors duration-200 font-medium"
                >
                  {index === 0 && <Home className="h-4 w-4 mr-2" />}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="flex items-center text-neutral-900 font-semibold"
                  aria-current="page"
                >
                  {index === 0 && <Home className="h-4 w-4 mr-2" />}
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

// Hook for custom breadcrumb management
export const useBreadcrumbs = () => {
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  const updateBreadcrumbs = (items: BreadcrumbItem[]) => {
    setBreadcrumbs(items);
  };

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => [...prev, item]);
  };

  const clearBreadcrumbs = () => {
    setBreadcrumbs([]);
  };

  return {
    breadcrumbs,
    updateBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs
  };
};