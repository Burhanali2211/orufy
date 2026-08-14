import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, TrendingUp, Filter, ChevronDown, ChevronRight, MoreHorizontal, Pulse } from 'lucide-react';
import {
  useEnhancedNavigation,
  useNavigationAnalytics,
  useNavigationPerformance
} from '../../hooks/useEnhancedNavigation';
import { NavigationItem } from '../../utils/navigationEnhancement';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdvancedNavigationSidebarProps {
  routes: NavigationItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  showAnalytics?: boolean;
  showFavorites?: boolean;
  showRecent?: boolean;
  showSearch?: boolean;
  maxRecentItems?: number;
  maxFavoriteItems?: number;
}

export const AdvancedNavigationSidebar: React.FC<AdvancedNavigationSidebarProps> = ({
  routes,
  collapsed = false,
  onToggleCollapse,
  className = '',
  showAnalytics = true,
  showFavorites = true,
  showRecent = true,
  showSearch = true,
  maxRecentItems = 5,
  maxFavoriteItems = 8
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { analytics, getPopularRoutes, getRouteMetrics } = useNavigationAnalytics();
  const { preloadRoute } = useNavigationPerformance();

  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentRoutes, setRecentRoutes] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'recent' | 'popular'>('all');

  // Load favorites and recent routes from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('nav_favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }

      const savedRecent = localStorage.getItem('nav_recent');
      if (savedRecent) {
        setRecentRoutes(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.warn('Failed to load navigation preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem('nav_favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, []);

  const saveRecentRoutes = useCallback((newRecent: string[]) => {
    try {
      localStorage.setItem('nav_recent', JSON.stringify(newRecent));
    } catch (error) {
      console.warn('Failed to save recent routes:', error);
    }
  }, []);

  // Update recent routes when current path changes
  useEffect(() => {
    if (currentPath && currentPath !== '/') {
      setRecentRoutes(prev => {
        const updated = [currentPath, ...prev.filter(path => path !== currentPath)]
          .slice(0, maxRecentItems);
        saveRecentRoutes(updated);
        return updated;
      });
    }
  }, [currentPath, maxRecentItems, saveRecentRoutes]);

  // Toggle favorite
  const toggleFavorite = useCallback((path: string) => {
    setFavorites(prev => {
      const updated = new Set(prev);
      if (updated.has(path)) {
        updated.delete(path);
      } else {
        updated.add(path);
      }
      saveFavorites(updated);
      return updated;
    });
  }, [saveFavorites]);

  // Search routes function
  const searchRoutes = useCallback((query: string): NavigationItem[] => {
    const searchTerm = query.toLowerCase();
    const searchInRoutes = (routeList: NavigationItem[]): NavigationItem[] => {
      const results: NavigationItem[] = [];
      for (const route of routeList) {
        if (
          route.name.toLowerCase().includes(searchTerm) ||
          route.path.toLowerCase().includes(searchTerm)
        ) {
          results.push(route);
        }
        if (route.children) {
          results.push(...searchInRoutes(route.children));
        }
      }
      return results;
    };
    return searchInRoutes(routes);
  }, [routes]);

  // Get navigation suggestions
  const getNavigationSuggestions = useCallback((limit: number): NavigationItem[] => {
    try {
      // Get popular routes from analytics
      const popularRoutes = getPopularRoutes(limit) || [];
      // Get recent routes
      const recentRouteItems = routes.filter(route => recentRoutes.includes(route.path));
      // Combine and return unique routes
      const combined = [...popularRoutes, ...recentRouteItems];
      return combined
        .filter((route, index, arr) => arr.findIndex(r => r.path === route.path) === index)
        .slice(0, limit);
    } catch (error) {
      console.warn('Failed to get navigation suggestions:', error);
      return [];
    }
  }, [routes, recentRoutes, getPopularRoutes]);

  // Filter and search routes
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    // Apply search filter
    if (searchQuery) {
      filtered = searchRoutes(searchQuery);
    }

    // Apply category filter
    switch (filterBy) {
      case 'favorites':
        filtered = filtered.filter(route => favorites.has(route.path));
        break;
      case 'recent':
        filtered = filtered.filter(route => recentRoutes.includes(route.path));
        break;
      case 'popular':
        const popularPaths = getPopularRoutes(10).map(r => r.path);
        filtered = filtered.filter(route => popularPaths.includes(route.path));
        break;
    }

    return filtered;
  }, [routes, searchQuery, filterBy, favorites, recentRoutes, searchRoutes, getPopularRoutes, getNavigationSuggestions]);

  // Get route suggestions
  const suggestions = useMemo(() => {
    return getNavigationSuggestions(3);
  }, [getNavigationSuggestions]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const updated = new Set(prev);
      if (updated.has(sectionId)) {
        updated.delete(sectionId);
      } else {
        updated.add(sectionId);
      }
      return updated;
    });
  }, []);

  // Handle navigation with preloading
  const handleNavigate = useCallback(async (path: string) => {
    await preloadRoute(path);
    navigate(path);
  }, [navigate, preloadRoute]);

  // Render navigation item
  const renderNavigationItem = useCallback((route: NavigationItem, level: number = 0) => {
    const isActive = currentPath === route.path;
    const isFavorite = favorites.has(route.path);
    const metrics = getRouteMetrics(route.path);
    const hasChildren = route.children && route.children.length > 0;
    const isExpanded = expandedSections.has(route.id);

    return (
      <motion.div
        key={route.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${level > 0 ? 'ml-4' : ''}`}
      >
        <div className="group relative">
          <button
            onClick={() => hasChildren ? toggleSection(route.id) : handleNavigate(route.path)}
            onMouseEnter={() => preloadRoute(route.path)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            title={collapsed ? route.name : undefined}
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Icon */}
              {route.icon && (
                <span className="flex-shrink-0">
                  {route.icon}
                </span>
              )}

              {/* Name and metadata */}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="truncate">{route.name}</span>

                    {/* Badges */}
                    <div className="flex items-center space-x-1">
                      {isFavorite && (
                        <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                      )}

                      {metrics && metrics.visits > 10 && (
                        <div className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          {metrics.visits}
                        </div>
                      )}

                      {route.metadata?.requiresAuth && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" title="Requires authentication" />
                      )}
                    </div>
                  </div>

                  {/* Performance metrics */}
                  {showAnalytics && metrics && metrics.averageLoadTime > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {metrics.averageLoadTime.toFixed(0)}ms avg
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {!collapsed && (
              <div className="flex items-center space-x-1">
                {/* Expand/collapse for children */}
                {hasChildren && (
                  <span className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                )}

                {/* Favorite toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(route.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                >
                  <Star
                    className={`w-3 h-3 ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            )}
          </button>

          {/* Children */}
          <AnimatePresence>
            {hasChildren && isExpanded && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 space-y-1"
              >
                {route.children!.map(child => renderNavigationItem(child, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }, [
    currentPath,
    favorites,
    collapsed,
    expandedSections,
    showAnalytics,
    getRouteMetrics,
    toggleSection,
    handleNavigate,
    preloadRoute,
    toggleFavorite
  ]);

  return (
    <div className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 ${className}`} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 50
    }}>
      {/* Header */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && !collapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 mt-3">
            {['all', 'favorites', 'recent', 'popular'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterBy(filter as any)}
                className={`px-2 py-1 text-xs rounded transition-colors ${filterBy === filter
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredRoutes.map(route => renderNavigationItem(route))}

        {/* Suggestions */}
        {!searchQuery && suggestions.length > 0 && !collapsed && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Suggested
            </h3>
            <div className="space-y-1">
              {suggestions.map(route => renderNavigationItem(route))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      {showAnalytics && !collapsed && analytics && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Pulse className="w-3 h-3 text-blue-500" />
              <span className="text-gray-600">
                {Object.keys(analytics.routeVisits).length} routes
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-gray-600">
                {favorites.size} favorites
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-green-500" />
              <span className="text-gray-600">
                {recentRoutes.length} recent
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-purple-500" />
              <span className="text-gray-600">
                {getPopularRoutes(5).length} popular
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};