import { Router, Response } from 'express';
import { rateLimitMonitor } from '../../utils/rateLimitMonitor';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/admin/rate-limit/violations
 * Get recent rate limit violations
 */
router.get(
  '/violations',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const violations = rateLimitMonitor.getViolations(limit);

    res.json({
      violations,
      total: violations.length
    });
  })
);

/**
 * GET /api/admin/rate-limit/violations/ip/:ip
 * Get violations by specific IP
 */
router.get(
  '/violations/ip/:ip',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ip } = req.params;
    const violations = rateLimitMonitor.getViolationsByIP(ip);

    res.json({
      ip,
      violations,
      total: violations.length
    });
  })
);

/**
 * GET /api/admin/rate-limit/violations/endpoint
 * Get violations by endpoint
 */
router.get(
  '/violations/endpoint',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const endpoint = req.query.endpoint as string;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Endpoint parameter is required'
      });
    }

    const violations = rateLimitMonitor.getViolationsByEndpoint(endpoint);

    res.json({
      endpoint,
      violations,
      total: violations.length
    });
  })
);

/**
 * GET /api/admin/rate-limit/stats
 * Get rate limit statistics by endpoint
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = rateLimitMonitor.getStats();

    res.json({
      stats,
      total: stats.length
    });
  })
);

/**
 * GET /api/admin/rate-limit/top-offenders
 * Get top offending IPs
 */
router.get(
  '/top-offenders',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const topOffenders = rateLimitMonitor.getTopOffendingIPs(limit);

    res.json({
      topOffenders,
      total: topOffenders.length
    });
  })
);

/**
 * GET /api/admin/rate-limit/summary
 * Get summary statistics
 */
router.get(
  '/summary',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = rateLimitMonitor.getSummary();

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/admin/rate-limit/dashboard
 * Get complete dashboard data
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = rateLimitMonitor.getSummary();
    const stats = rateLimitMonitor.getStats();
    const topOffenders = rateLimitMonitor.getTopOffendingIPs(10);
    const recentViolations = rateLimitMonitor.getViolations(50);

    res.json({
      summary,
      stats,
      topOffenders,
      recentViolations,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;

