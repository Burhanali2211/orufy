/**
 * Analytics utility for detailed performance tracking and user behavior analysis
 */
import { performanceMonitor } from './performance';

interface UserInteractionEvent {
  type: string;
  element: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PageViewEvent {
  url: string;
  referrer: string;
  timestamp: number;
  loadTime?: number;
}

interface ConversionEvent {
  type: string;
  value?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class Analytics {
  private userInteractions: UserInteractionEvent[] = [];
  private pageViews: PageViewEvent[] = [];
  private conversions: ConversionEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') {
      this.isEnabled = false;
      return;
    }

    // Track page views
    this.trackPageView();

    // Set up event listeners for user interactions
    this.setupEventListeners();
  }

  private trackPageView() {
    if (!this.isEnabled) return;

    const pageView: PageViewEvent = {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    };

    // Get page load time if available
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      pageView.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    }

    this.pageViews.push(pageView);
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserInteraction('click', target.tagName, {
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50)
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      this.trackUserInteraction('form_submit', target.tagName, {
        id: target.id,
        className: target.className
      });
    });

    // Track scrolls
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        this.trackUserInteraction('scroll', 'document', {
          percent: scrollPercent
        });
      }, 1000);
    });
  }

  trackUserInteraction(type: string, element: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const interaction: UserInteractionEvent = {
      type,
      element,
      timestamp: Date.now(),
      metadata
    };

    this.userInteractions.push(interaction);
  }

  trackConversion(type: string, value?: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const conversion: ConversionEvent = {
      type,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.conversions.push(conversion);
  }

  trackCustomEvent(name: string, value: number, type: 'timing' | 'counter' | 'gauge' = 'timing') {
    if (!this.isEnabled) return;

    performanceMonitor.recordMetric(name, value, type);
  }

  // Get analytics data for reporting
  getAnalyticsData() {
    return {
      userInteractions: this.userInteractions,
      pageViews: this.pageViews,
      conversions: this.conversions,
      summary: this.getSummary()
    };
  }

  // Get summary statistics
  private getSummary() {
    const totalInteractions = this.userInteractions.length;
    const totalPageViews = this.pageViews.length;
    const totalConversions = this.conversions.length;
    
    // Calculate bounce rate (single page views)
    const bounceRate = totalPageViews > 0 ? 
      Math.round((this.pageViews.filter(pv => pv.loadTime && pv.loadTime < 1000).length / totalPageViews) * 100) : 0;

    // Calculate average session duration
    let avgSessionDuration = 0;
    if (this.pageViews.length > 1) {
      const durations = this.pageViews.slice(1).map((pv, i) => 
        pv.timestamp - this.pageViews[i].timestamp
      );
      avgSessionDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    }

    return {
      totalInteractions,
      totalPageViews,
      totalConversions,
      bounceRate,
      avgSessionDuration: Math.round(avgSessionDuration / 1000) // in seconds
    };
  }

  // Clear data (useful for testing)
  clearData() {
    this.userInteractions = [];
    this.pageViews = [];
    this.conversions = [];
  }
}

// Create singleton instance
export const analytics = new Analytics();

export default analytics;