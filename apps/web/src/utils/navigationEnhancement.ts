import { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { performanceMonitor } from './performance';

// Navigation item interface
export interface NavigationItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
  component?: React.ComponentType;
  children?: NavigationItem[];
  permissions?: string[];
  roles?: string[];
  preload?: boolean;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    breadcrumbLabel?: string;
    hideFromNav?: boolean;
    requiresAuth?: boolean;
    requiresRole?: string[];
    cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  };
}

// Route guard configuration
export interface RouteGuard {
  id: string;
  name: string;
  check: (route: NavigationItem, user?: any) => Promise<boolean> | boolean;
  redirectTo?: string;
  message?: string;
  priority: number; // Higher priority guards run first
}

// Navigation state
export interface NavigationState {
  currentRoute: NavigationItem | null;
  breadcrumbs: BreadcrumbItem[];
  history: NavigationItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  error: string | null;
}

// Breadcrumb item
export interface BreadcrumbItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Navigation analytics
export interface NavigationAnalytics {
  routeVisits: Record<string, number>;
  averageLoadTime: Record<string, number>;
  bounceRate: Record<string, number>;
  userFlow: Array<{
    from: string;
    to: string;
    timestamp: number;
    loadTime: number;
  }>;
}

export class NavigationManager {
  private routes: Map<string, NavigationItem> = new Map();
  private guards: RouteGuard[] = [];
  private analytics: NavigationAnalytics = {
    routeVisits: {},
    averageLoadTime: {},
    bounceRate: {},
    userFlow: []
  };
  private preloadedComponents: Set<string> = new Set();
  private navigationHistory: string[] = [];
  private currentIndex: number = -1;

  constructor() {
    this.setupPerformanceMonitoring();
  }

  /**
   * Register navigation routes
   */
  registerRoutes(routes: NavigationItem[]): void {
    const registerRoute = (route: NavigationItem, parent?: NavigationItem) => {
      // Set full path if nested
      if (parent) {
        route.path = `${parent.path}${route.path}`;
      }

      this.routes.set(route.path, route);

      // Register children recursively
      if (route.children) {
        route.children.forEach(child => registerRoute(child, route));
      }

      // Preload component if specified
      if (route.preload && route.component) {
        this.preloadComponent(route);
      }
    };

    routes.forEach(route => registerRoute(route));
  }

  /**
   * Register route guards
   */
  registerGuard(guard: RouteGuard): void {
    this.guards.push(guard);
    // Sort guards by priority (higher first)
    this.guards.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if navigation to route is allowed
   */
  async canNavigate(path: string, user?: any): Promise<{
    allowed: boolean;
    guard?: RouteGuard;
    redirectTo?: string;
    message?: string;
  }> {
    const route = this.routes.get(path);
    if (!route) {
      return { allowed: false, message: 'Route not found' };
    }

    // Run guards in priority order
    for (const guard of this.guards) {
      const allowed = await guard.check(route, user);
      if (!allowed) {
        return {
          allowed: false,
          guard,
          redirectTo: guard.redirectTo,
          message: guard.message
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Navigate to route with guards and analytics
   */
  async navigate(path: string, user?: any, options: {
    replace?: boolean;
    state?: any;
    skipGuards?: boolean;
  } = {}): Promise<{
    success: boolean;
    redirectTo?: string;
    message?: string;
  }> {
    const startTime = performance.now();
    
    // Check guards unless skipped
    if (!options.skipGuards) {
      const guardResult = await this.canNavigate(path, user);
      if (!guardResult.allowed) {
        return {
          success: false,
          redirectTo: guardResult.redirectTo,
          message: guardResult.message
        };
      }
    }

    // Update navigation history
    if (!options.replace) {
      this.navigationHistory = this.navigationHistory.slice(0, this.currentIndex + 1);
      this.navigationHistory.push(path);
      this.currentIndex = this.navigationHistory.length - 1;
    } else {
      this.navigationHistory[this.currentIndex] = path;
    }

    // Track analytics
    const loadTime = performance.now() - startTime;
    this.trackNavigation(path, loadTime);

    return { success: true };
  }

  /**
   * Generate breadcrumbs for current route
   */
  generateBreadcrumbs(path: string): BreadcrumbItem[] {
    const route = this.routes.get(path);
    if (!route) return [];

    const breadcrumbs: BreadcrumbItem[] = [];
    const pathSegments = path.split('/').filter(Boolean);
    
    // Always start with home
    breadcrumbs.push({
      id: 'home',
      label: 'Home',
      path: '/',
      isActive: false
    });

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const segmentRoute = this.routes.get(currentPath);
      const isLast = index === pathSegments.length - 1;

      if (segmentRoute) {
        breadcrumbs.push({
          id: segmentRoute.id,
          label: segmentRoute.metadata?.breadcrumbLabel || segmentRoute.name,
          path: isLast ? undefined : currentPath,
          icon: segmentRoute.icon,
          isActive: isLast,
          metadata: segmentRoute.metadata
        });
      } else {
        // Generate breadcrumb for unknown segments
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        breadcrumbs.push({
          id: segment,
          label,
          path: isLast ? undefined : currentPath,
          isActive: isLast
        });
      }
    });

    return breadcrumbs;
  }

  /**
   * Get navigation suggestions based on current route
   */
  getNavigationSuggestions(currentPath: string, limit: number = 5): NavigationItem[] {
    const currentRoute = this.routes.get(currentPath);
    if (!currentRoute) return [];

    const suggestions: NavigationItem[] = [];
    
    // Add sibling routes
    if (currentRoute.children) {
      suggestions.push(...currentRoute.children);
    }

    // Add frequently visited routes
    const frequentRoutes = Object.entries(this.analytics.routeVisits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path]) => this.routes.get(path))
      .filter(Boolean) as NavigationItem[];

    suggestions.push(...frequentRoutes);

    // Remove duplicates and current route
    const uniqueSuggestions = suggestions
      .filter((route, index, arr) => 
        arr.findIndex(r => r.id === route.id) === index &&
        route.path !== currentPath
      )
      .slice(0, limit);

    return uniqueSuggestions;
  }

  /**
   * Preload component for faster navigation
   */
  private async preloadComponent(route: NavigationItem): Promise<void> {
    if (this.preloadedComponents.has(route.id) || !route.component) {
      return;
    }

    try {
      // If component is lazy-loaded, trigger the import
      if (typeof route.component === 'function') {
        await route.component;
      }
      this.preloadedComponents.add(route.id);
    } catch (error) {
      console.warn(`Failed to preload component for route ${route.id}:`, error);
    }
  }

  /**
   * Preload routes based on user behavior
   */
  async preloadPredictedRoutes(currentPath: string): Promise<void> {
    const suggestions = this.getNavigationSuggestions(currentPath, 3);
    
    for (const route of suggestions) {
      if (route.preload !== false) {
        await this.preloadComponent(route);
      }
    }
  }

  /**
   * Track navigation analytics
   */
  private trackNavigation(path: string, loadTime: number): void {
    // Update visit count
    this.analytics.routeVisits[path] = (this.analytics.routeVisits[path] || 0) + 1;

    // Update average load time
    const currentAvg = this.analytics.averageLoadTime[path] || 0;
    const visitCount = this.analytics.routeVisits[path];
    this.analytics.averageLoadTime[path] = 
      (currentAvg * (visitCount - 1) + loadTime) / visitCount;

    // Track user flow
    const previousPath = this.navigationHistory[this.currentIndex - 1];
    if (previousPath) {
      this.analytics.userFlow.push({
        from: previousPath,
        to: path,
        timestamp: Date.now(),
        loadTime
      });

      // Keep only last 1000 flow entries
      if (this.analytics.userFlow.length > 1000) {
        this.analytics.userFlow = this.analytics.userFlow.slice(-1000);
      }
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor route changes
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        this.trackNavigation(path, 0); // No load time for back/forward
      });
    }
  }

  /**
   * Get navigation analytics
   */
  getAnalytics(): NavigationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get route by path
   */
  getRoute(path: string): NavigationItem | undefined {
    return this.routes.get(path);
  }

  /**
   * Get all routes
   */
  getAllRoutes(): NavigationItem[] {
    return Array.from(this.routes.values());
  }

  /**
   * Search routes
   */
  searchRoutes(query: string): NavigationItem[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.routes.values()).filter(route =>
      route.name.toLowerCase().includes(lowercaseQuery) ||
      route.path.toLowerCase().includes(lowercaseQuery) ||
      route.metadata?.keywords?.some(keyword => 
        keyword.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can go forward
   */
  canGoForward(): boolean {
    return this.currentIndex < this.navigationHistory.length - 1;
  }

  /**
   * Go back in navigation history
   */
  goBack(): string | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      return this.navigationHistory[this.currentIndex];
    }
    return null;
  }

  /**
   * Go forward in navigation history
   */
  goForward(): string | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      return this.navigationHistory[this.currentIndex];
    }
    return null;
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
    this.currentIndex = -1;
  }
}

// Global navigation manager instance
export const navigationManager = new NavigationManager();

// Default route guards
export const defaultGuards: RouteGuard[] = [
  {
    id: 'auth-guard',
    name: 'Authentication Guard',
    check: (route, user) => {
      if (route.metadata?.requiresAuth && !user) {
        return false;
      }
      return true;
    },
    redirectTo: '/auth',
    message: 'Authentication required',
    priority: 100
  },
  {
    id: 'role-guard',
    name: 'Role Guard',
    check: (route, user) => {
      if (route.metadata?.requiresRole && user) {
        const requiredRoles = route.metadata.requiresRole;
        const userRoles = user.roles || [];
        return requiredRoles.some((role: string) => userRoles.includes(role));
      }
      return true;
    },
    redirectTo: '/unauthorized',
    message: 'Insufficient permissions',
    priority: 90
  }
];

// Register default guards
defaultGuards.forEach(guard => navigationManager.registerGuard(guard));
