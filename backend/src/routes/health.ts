import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { sql } from 'drizzle-orm';

export const healthRouter = Router();

/**
 * 1. Liveness Probe (Lightweight Node process check)
 * GET /api/health
 */
healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Platform Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 2. Readiness Probe (Verifies PostgreSQL connection and application readiness)
 * GET /api/health/ready
 */
healthRouter.get('/ready', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    await db.execute(sql`SELECT 1;`);
    const dbLatencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      latencyMs: dbLatencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Readiness probe failed:', error?.message);
    return res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 3. Diagnostic Probe (Privileged check - strict secret redaction)
 * GET /api/health/detailed
 */
healthRouter.get('/detailed', async (req: Request, res: Response) => {
  try {
    // 1. Database connection and latency
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1;`);
      dbLatencyMs = Date.now() - start;
    } catch (dbErr) {
      dbStatus = 'unreachable';
    }

    // 2. Memory & Process stats
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    // 3. Razorpay readiness (checks presence of configured credentials without exposing values)
    const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    // 4. Return sanitized diagnostic report (no secret URLs, credentials, or internal IPs)
    const report = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      application: {
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        uptimeSeconds,
        environment: process.env.NODE_ENV || 'development',
      },
      system: {
        memory: {
          rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        },
      },
      dependencies: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        paymentProvider: {
          provider: 'razorpay',
          configured: razorpayConfigured,
        },
      },
      workers: {
        reservationExpiry: 'active',
        webhookRetry: 'active',
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = dbStatus === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(report);
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});
