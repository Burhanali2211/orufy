import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthRouter } from '../backend/src/routes/health';

const { mockDb } = vi.hoisted(() => {
  const mockDb: any = {
    execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
  return { mockDb };
});

vi.mock('../backend/src/db/db', () => ({
  db: mockDb,
}));

describe('Phase 13C — Tiered Production Health & Readiness Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getHandler = (path: string) => {
    const route = healthRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === path && layer.route.methods.get
    );
    return route.route.stack[0].handle;
  };

  it('GET /api/health returns lightweight liveness probe (200 OK)', async () => {
    const handler = getHandler('/');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        message: 'Platform Backend API is running',
      })
    );
  });

  it('GET /api/health/ready returns 200 when database connection is healthy', async () => {
    const handler = getHandler('/ready');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    mockDb.execute.mockResolvedValueOnce([{ '?column?': 1 }]);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ready',
        database: 'connected',
        latencyMs: expect.any(Number),
      })
    );
  });

  it('GET /api/health/ready returns 503 Service Unavailable when database connection fails', async () => {
    const handler = getHandler('/ready');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    mockDb.execute.mockRejectedValueOnce(new Error('Connection timeout to Postgres'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unready',
        database: 'disconnected',
        error: 'Database connection failed',
      })
    );
  });

  it('GET /api/health/detailed strictly redacts all credentials, URLs, and secret tokens', async () => {
    const handler = getHandler('/detailed');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    process.env.RAZORPAY_KEY_ID = 'rzp_test_secret_key_123';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_val_456';
    process.env.DATABASE_URL = 'postgresql://postgres:mysecretpassword@localhost:5432/mydb';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];

    // Verify sanitization: no credentials present in output
    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain('rzp_test_secret_val_456');
    expect(jsonString).not.toContain('mysecretpassword');
    expect(jsonString).not.toContain('localhost:5432');

    // Structural checks
    expect(data.dependencies.database.status).toBe('healthy');
    expect(data.dependencies.paymentProvider.configured).toBe(true);
  });
});
