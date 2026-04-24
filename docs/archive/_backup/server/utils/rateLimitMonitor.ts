import { logger } from './logger';

/**
 * Rate limit monitoring and tracking
 * Tracks violations and provides statistics for admin dashboard
 */

interface RateLimitViolation {
  ip: string;
  endpoint: string;
  timestamp: Date;
  userAgent?: string;
  userId?: string;
}

interface RateLimitStats {
  endpoint: string;
  violations: number;
  uniqueIPs: Set<string>;
  lastViolation?: Date;
}

class RateLimitMonitor {
  private violations: RateLimitViolation[] = [];
  private stats: Map<string, RateLimitStats> = new Map();
  private maxViolationsStored: number = 1000;

  /**
   * Record a rate limit violation
   */
  recordViolation(
    ip: string,
    endpoint: string,
    userAgent?: string,
    userId?: string
  ): void {
    const violation: RateLimitViolation = {
      ip,
      endpoint,
      timestamp: new Date(),
      userAgent,
      userId
    };

    // Add to violations list
    this.violations.push(violation);

    // Trim violations if exceeds max
    if (this.violations.length > this.maxViolationsStored) {
      this.violations = this.violations.slice(-this.maxViolationsStored);
    }

    // Update stats
    const stats = this.stats.get(endpoint) || {
      endpoint,
      violations: 0,
      uniqueIPs: new Set<string>(),
      lastViolation: undefined
    };

    stats.violations++;
    stats.uniqueIPs.add(ip);
    stats.lastViolation = violation.timestamp;
    this.stats.set(endpoint, stats);

    // Log violation
    logger.warn('Rate limit violation', {
      context: 'RateLimit',
      data: {
        ip,
        endpoint,
        userAgent,
        userId
      }
    });
  }

  /**
   * Get all violations
   */
  getViolations(limit: number = 100): RateLimitViolation[] {
    return this.violations.slice(-limit).reverse();
  }

  /**
   * Get violations by IP
   */
  getViolationsByIP(ip: string): RateLimitViolation[] {
    return this.violations.filter(v => v.ip === ip);
  }

  /**
   * Get violations by endpoint
   */
  getViolationsByEndpoint(endpoint: string): RateLimitViolation[] {
    return this.violations.filter(v => v.endpoint === endpoint);
  }

  /**
   * Get statistics for all endpoints
   */
  getStats() {
    const statsArray = Array.from(this.stats.values()).map(stat => ({
      endpoint: stat.endpoint,
      violations: stat.violations,
      uniqueIPs: stat.uniqueIPs.size,
      lastViolation: stat.lastViolation
    }));

    // Sort by violations (descending)
    return statsArray.sort((a, b) => b.violations - a.violations);
  }

  /**
   * Get top offending IPs
   */
  getTopOffendingIPs(limit: number = 10) {
    const ipCounts = new Map<string, number>();

    this.violations.forEach(v => {
      ipCounts.set(v.ip, (ipCounts.get(v.ip) || 0) + 1);
    });

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, violations: count }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, limit);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentViolations = this.violations.filter(v => v.timestamp > oneHourAgo);
    const dailyViolations = this.violations.filter(v => v.timestamp > oneDayAgo);

    const uniqueIPs = new Set(this.violations.map(v => v.ip));

    return {
      total: this.violations.length,
      lastHour: recentViolations.length,
      last24Hours: dailyViolations.length,
      uniqueIPs: uniqueIPs.size,
      endpoints: this.stats.size
    };
  }

  /**
   * Clear old violations (older than 7 days)
   */
  cleanup(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const before = this.violations.length;
    
    this.violations = this.violations.filter(v => v.timestamp > sevenDaysAgo);
    
    const removed = before - this.violations.length;
    if (removed > 0) {
      logger.info(`Cleaned up ${removed} old rate limit violations`, { context: 'RateLimit' });
    }
  }
}

// Export singleton instance
export const rateLimitMonitor = new RateLimitMonitor();

// Schedule cleanup every 24 hours
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    rateLimitMonitor.cleanup();
  }, 24 * 60 * 60 * 1000);
}

