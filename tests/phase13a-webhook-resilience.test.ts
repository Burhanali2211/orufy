import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentRouter, processWebhookBusinessEvent } from '../backend/src/routes/payment';
import { WebhookRetryWorker } from '../backend/src/workers/webhookRetryWorker';
import { payment_webhook_events, orders } from '../backend/src/db/schema';
import crypto from 'crypto';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    events: [],
    orders: [
      {
        id: 'order_1',
        store_id: 'store_1',
        order_number: 'ORD-1001',
        total_amount: 100000,
        razorpay_order_id: 'order_rzp_1001',
        status: 'ORDER_CREATED',
        payment_status: 'PAYMENT_PENDING',
      },
    ],
    currentTable: '',
  };

  const queryBuilder: any = {
    where: vi.fn().mockImplementation(() => queryBuilder),
    orderBy: vi.fn().mockImplementation(() => dbState.events),
    returning: vi.fn().mockImplementation(() => dbState.events),
    then: (resolve: any) => {
      if (dbState.currentTable === 'payment_webhook_events') {
        return resolve(dbState.events);
      }
      if (dbState.currentTable === 'orders') {
        return resolve(dbState.orders);
      }
      return resolve([]);
    },
  };

  const mockDb: any = {
    select: vi.fn().mockImplementation(() => mockDb),
    from: vi.fn().mockImplementation((table) => {
      if (table === payment_webhook_events || (table as any)?.event_type) {
        dbState.currentTable = 'payment_webhook_events';
      } else if (table === orders || (table as any)?.order_number) {
        dbState.currentTable = 'orders';
      } else {
        dbState.currentTable = 'other';
      }
      return queryBuilder;
    }),
    where: vi.fn().mockImplementation(() => queryBuilder),
    insert: vi.fn().mockImplementation((table) => {
      dbState.currentTable = 'payment_webhook_events';
      return mockDb;
    }),
    values: vi.fn().mockImplementation((vals) => {
      dbState.events.push({ id: 'evt_db_1', ...vals });
      return queryBuilder;
    }),
    update: vi.fn().mockImplementation((table) => {
      dbState.currentTable = 'payment_webhook_events';
      return mockDb;
    }),
    set: vi.fn().mockImplementation((updates) => {
      if (dbState.events[0]) {
        Object.assign(dbState.events[0], updates);
      }
      return queryBuilder;
    }),
    execute: vi.fn().mockResolvedValue([{ acquired: true }]),
    transaction: vi.fn().mockImplementation(async (cb: any) => {
      return cb(mockDb);
    }),
  };

  return { dbState, mockDb };
});

vi.mock('../backend/src/db/db', () => ({
  db: mockDb,
}));

vi.mock('../backend/src/middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    next();
  },
}));

vi.mock('../backend/src/db/utils', () => ({
  withStoreContext: async (storeId: any, cb: any, userId: any) => {
    return cb(mockDb);
  },
}));

describe('Phase 13A — Webhook Reliability, Retries & Dead-Letter Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.events = [];
    dbState.currentTable = '';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
  });

  const getWebhookHandler = () => {
    const route = paymentRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === '/webhook' && layer.route.methods.post
    );
    return route.route.stack[0].handle;
  };

  const getReplayHandler = () => {
    const route = paymentRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === '/webhooks/:id/replay' && layer.route.methods.post
    );
    return route.route.stack[route.route.stack.length - 1].handle;
  };

  it('marks transient transaction failure as RETRY with exponential backoff next_retry_at', async () => {
    const handler = getWebhookHandler();
    const payload = {
      event: 'payment.captured',
      event_id: 'evt_retry_101',
      payload: { payment: { entity: { id: 'pay_retry_1', order_id: 'order_rzp_1001' } } }
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(rawBody)
      .digest('hex');

    const req = {
      headers: { 'x-razorpay-signature': signature },
      body: payload,
      rawBody,
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    // Force failure inside transaction
    mockDb.transaction.mockRejectedValueOnce(new Error('Simulated transient DB deadlock'));

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        processing_status: 'RETRY',
        attempt_count: 1,
        next_retry_at: expect.any(Date),
        error_message: expect.stringContaining('Simulated transient DB deadlock'),
      })
    );
  });

  it('WebhookRetryWorker transitions event to DEAD_LETTER after max_attempts exceeded', async () => {
    const eventToDeadLetter = {
      id: 'evt_dl_1',
      razorpay_event_id: 'evt_dl_rzp_1',
      event_type: 'payment.captured',
      payload: { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_rzp_1' } } } },
      processing_status: 'RETRY',
      attempt_count: 5,
      max_attempts: 5,
      next_retry_at: new Date(Date.now() - 1000), // In the past
    };

    dbState.events = [eventToDeadLetter];

    const result = await WebhookRetryWorker.runSweep();

    expect(result.deadLettered).toBe(1);
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        processing_status: 'DEAD_LETTER',
        error_message: expect.stringContaining('Exhausted all 5 retry attempts'),
      })
    );
  });

  it('admin manual replay endpoint successfully and idempotently recovers a dead-lettered event', async () => {
    const handler = getReplayHandler();
    const deadLetterEvent = {
      id: 'evt_dl_1',
      razorpay_event_id: 'evt_dl_rzp_1',
      event_type: 'payment.captured',
      payload: {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_replay_1', order_id: 'order_rzp_1001' } } }
      },
      processing_status: 'DEAD_LETTER',
      attempt_count: 5,
    };

    dbState.events = [deadLetterEvent];

    const req = {
      params: { id: 'evt_dl_1' },
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('replayed successfully'),
      })
    );
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        processing_status: 'PROCESSED',
      })
    );
  });
});
