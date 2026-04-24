import { Router, Request, Response } from 'express';
import { query, getPoolStats } from '../db/connection';
import { logger } from '../utils/logger';
import { hybridCache } from '../utils/hybridCache';
import { getPerformanceMetrics } from '../middleware/performanceMonitor';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Get pool statistics
    const poolStats = getPoolStats();

    // Calculate uptime
    const uptime = process.uptime();

    // Memory usage
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime)
      },
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`,
        pool: {
          total: poolStats.total,
          idle: poolStats.idle,
          waiting: poolStats.waiting,
          max: poolStats.max,
          utilization: `${Math.round((poolStats.total / poolStats.max) * 100)}%`
        }
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });
  } catch (error) {
    logger.error('Health check failed', error, { context: 'Health' });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/metrics
 * Prometheus-style metrics endpoint
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const poolStats = getPoolStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Prometheus format
    const metrics = [
      `# HELP nodejs_uptime_seconds Node.js process uptime in seconds`,
      `# TYPE nodejs_uptime_seconds gauge`,
      `nodejs_uptime_seconds ${uptime}`,
      ``,
      `# HELP nodejs_memory_heap_used_bytes Node.js heap memory used in bytes`,
      `# TYPE nodejs_memory_heap_used_bytes gauge`,
      `nodejs_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
      ``,
      `# HELP nodejs_memory_heap_total_bytes Node.js heap memory total in bytes`,
      `# TYPE nodejs_memory_heap_total_bytes gauge`,
      `nodejs_memory_heap_total_bytes ${memoryUsage.heapTotal}`,
      ``,
      `# HELP db_pool_total Total database connections in pool`,
      `# TYPE db_pool_total gauge`,
      `db_pool_total ${poolStats.total}`,
      ``,
      `# HELP db_pool_idle Idle database connections in pool`,
      `# TYPE db_pool_idle gauge`,
      `db_pool_idle ${poolStats.idle}`,
      ``,
      `# HELP db_pool_waiting Waiting database connection requests`,
      `# TYPE db_pool_waiting gauge`,
      `db_pool_waiting ${poolStats.waiting}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', error, { context: 'Health' });
    res.status(500).send('# Error generating metrics');
  }
});

/**
 * GET /health/cache
 * Cache statistics endpoint (shows both Redis and in-memory stats)
 */
router.get('/cache', (req: Request, res: Response) => {
  const stats = hybridCache.getStats();
  res.status(200).json({
    cache: stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /health/cache/clear
 * Clear cache (admin only - add auth middleware in production)
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    await hybridCache.clear();
    res.status(200).json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to clear cache', error, { context: 'Health' });
    res.status(500).json({
      error: 'Failed to clear cache',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/performance
 * Performance metrics endpoint
 */
router.get('/performance', (req: Request, res: Response) => {
  const metrics = getPerformanceMetrics();
  res.status(200).json({
    metrics,
    timestamp: new Date().toISOString()
  });
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;

