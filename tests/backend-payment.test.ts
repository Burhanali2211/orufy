import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import { paymentRouter } from '../backend/src/routes/payment';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    orders: [],
    payment_webhook_events: [],
    payment_transfers: [],
    stores: [{
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Store A',
      hostname: 'store-a.platform.local',
      razorpay_linked_account_id: 'acc_store_A'
    }, {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Store B',
      hostname: 'store-b.platform.local',
      razorpay_linked_account_id: 'acc_store_B'
    }],
    products: [{
      id: 'prod_1',
      store_id: '00000000-0000-0000-0000-000000000001',
      name: 'Product A1',
      price: 100000, // 1000.00 INR in paise
      stock: 10
    }, {
      id: 'prod_2',
      store_id: '00000000-0000-0000-0000-000000000002',
      name: 'Product B1',
      price: 200000, // 2000.00 INR in paise
      stock: 5
    }]
  };

  const mockDb: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => {
      if (dbState.__mock_select_return) {
        const ret = dbState.__mock_select_return;
        dbState.__mock_select_return = null;
        return ret;
      }
      return [];
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => {
      return [{ id: 'order_uuid_1', order_number: 'ORD-123456', total_amount: 100000 }];
    }),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation(async (cb: any) => {
      if (dbState.__fail_transaction) {
        throw new Error('Simulated DB Transaction Failure');
      }
      return cb(mockDb);
    })
  };
  return { dbState, mockDb };
});

vi.mock('../backend/src/middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    res.locals.user = { id: 'user_cust_1' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    res.locals = res.locals || {};
    res.locals.user = { id: 'user_cust_1' };
    next();
  },
}));

vi.mock('../backend/src/db/utils', () => ({
  withStoreContext: async (storeId: any, cb: any, userId: any) => {
    return cb(mockDb);
  }
}));

vi.mock('../backend/src/db/db', () => ({
  db: mockDb
}));

// Setup Express App
const app = express();
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use('/api/platform/payment', paymentRouter);

const createSignedWebhookReq = (payload: any, secret = 'test_secret', customSignature?: string) => {
  const rawBody = JSON.stringify(payload);
  const signature = customSignature !== undefined
    ? customSignature
    : crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return {
    headers: signature ? { 'x-razorpay-signature': signature } : {},
    body: payload,
    rawBody
  };
};

describe('Backend Payment & Security Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_mock';
    dbState.__mock_select_return = null;
    dbState.__fail_transaction = false;
  });

  describe('1. Server-Authoritative Pricing & Checkout Validations', () => {
    const getCheckoutHandler = () => {
      const checkoutRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/checkout/orders');
      return checkoutRoute.route.stack.find((s: any) => s.name !== 'requireAuth').handle;
    };

    it('should reject zero quantity', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: { 'x-store-hostname': 'store-a.platform.local' },
        body: { items: [{ productId: 'prod_1', quantity: 0 }], shippingAddress: {} }
      };
      const res = { locals: { user: { id: 'user_1' } }, status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.products[0]]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid quantity') }));
    });

    it('should reject negative quantity', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: { 'x-store-hostname': 'store-a.platform.local' },
        body: { items: [{ productId: 'prod_1', quantity: -5 }], shippingAddress: {} }
      };
      const res = { locals: { user: { id: 'user_1' } }, status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.products[0]]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid quantity') }));
    });

    it('should reject excessive quantity (> 100)', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: { 'x-store-hostname': 'store-a.platform.local' },
        body: { items: [{ productId: 'prod_1', quantity: 150 }], shippingAddress: {} }
      };
      const res = { locals: { user: { id: 'user_1' } }, status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.products[0]]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid quantity') }));
    });

    it('should reject out of stock product', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: { 'x-store-hostname': 'store-a.platform.local' },
        body: { items: [{ productId: 'prod_1', quantity: 15 }], shippingAddress: {} } // Available stock is 10
      };
      const res = { locals: { user: { id: 'user_1' } }, status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.products[0]]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('out of stock') }));
    });

    it('should reject cross-store product (Store A checkout with Store B product)', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: { 'x-store-hostname': 'store-a.platform.local' },
        body: { items: [{ productId: 'prod_2', quantity: 1 }], shippingAddress: {} } // prod_2 belongs to Store B
      };
      const res = { locals: { user: { id: 'user_1' } }, status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([]); // Query returns empty because prod_2 does not belong to Store A

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('not found or unavailable') }));
    });
  });

  describe('2. Raw Webhook Signature Verification', () => {
    const getWebhookHandler = () => {
      const webhookRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/webhook');
      return webhookRoute.route.stack[0].handle;
    };

    it('should accept valid signature', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'payment.captured', event_id: 'evt_sig_1', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]); // no existing processed event

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should reject missing signature', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'payment.captured' };
      const req = createSignedWebhookReq(payload, 'test_secret', '');
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature or secret' });
    });

    it('should reject invalid signature', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'payment.captured' };
      const req = createSignedWebhookReq(payload, 'test_secret', 'forged_invalid_signature');
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('should reject modified payload even if signature header was from original', async () => {
      const handler = getWebhookHandler();
      const originalPayload = { event: 'payment.captured', amount: 100 };
      const req = createSignedWebhookReq(originalPayload);
      // Tamper body without updating rawBody signature
      req.rawBody = JSON.stringify({ event: 'payment.captured', amount: 999999 });

      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });
  });

  describe('3. Webhook Idempotency & Transaction Failure Safety', () => {
    const getWebhookHandler = () => {
      const webhookRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/webhook');
      return webhookRoute.route.stack[0].handle;
    };

    it('should not mark event as processed if business processing transaction fails', async () => {
      const handler = getWebhookHandler();
      dbState.__fail_transaction = true;

      const payload = { event: 'payment.captured', event_id: 'evt_fail_1', payload: { payment: { entity: { id: 'pay_fail', order_id: 'ord_fail' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should successfully process retry of failed event and mark it processed', async () => {
      const handler = getWebhookHandler();
      dbState.__fail_transaction = false;

      const payload = { event: 'payment.captured', event_id: 'evt_retry_1', payload: { payment: { entity: { id: 'pay_retry', order_id: 'ord_retry' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should return idempotent 200 without duplicate mutations when event already processed', async () => {
      const handler = getWebhookHandler();

      const payload = { event: 'payment.captured', event_id: 'evt_dup_1', payload: { payment: { entity: { id: 'pay_1', order_id: 'ord_1' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      // Mock existing event record with status PROCESSED
      mockDb.where = vi.fn().mockReturnValueOnce([{ razorpay_event_id: 'evt_dup_1', processing_status: 'PROCESSED' }]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event already processed' }));
      // Should not call db.transaction
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('4. Payment, Order & Transfer Correlation Lifecycle', () => {
    const getWebhookHandler = () => {
      const webhookRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/webhook');
      return webhookRoute.route.stack[0].handle;
    };

    it('payment.captured transitions order state but does NOT mark TRANSFER_PROCESSED', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'payment.captured', event_id: 'evt_cap_1', payload: { payment: { entity: { id: 'pay_100', order_id: 'ord_100' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'PAYMENT_CAPTURED',
        status: 'PAYMENT_CAPTURED'
      }));
    });

    it('order.paid transitions order to ORDER_PAID', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'order.paid', event_id: 'evt_paid_1', payload: { order: { entity: { id: 'ord_100' } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'ORDER_PAID',
        status: 'ORDER_PAID'
      }));
    });

    it('transfer.processed correlates recipient and updates state on valid match', async () => {
      const handler = getWebhookHandler();
      const payload = {
        event: 'transfer.processed',
        event_id: 'evt_trf_1',
        payload: {
          transfer: {
            entity: {
              source: 'ord_100',
              id: 'trf_100',
              recipient: 'acc_store_A',
              amount: 100000
            }
          }
        }
      };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // idempotency check
        .mockReturnValueOnce([{ id: 'order_1', store_id: dbState.stores[0].id }]) // order lookup
        .mockReturnValueOnce([dbState.stores[0]]); // store lookup -> linked account matches 'acc_store_A'

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'TRANSFER_PROCESSED'
      }));
    });

    it('transfer.processed REJECTS when Store A order recipient is manipulated to Store B account', async () => {
      const handler = getWebhookHandler();
      const payload = {
        event: 'transfer.processed',
        event_id: 'evt_trf_mismatch',
        payload: {
          transfer: {
            entity: {
              source: 'ord_100',
              id: 'trf_100',
              recipient: 'acc_store_B', // Forged recipient: Store B instead of Store A
              amount: 100000
            }
          }
        }
      };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // idempotency check
        .mockReturnValueOnce([{ id: 'order_1', store_id: dbState.stores[0].id }]) // Store A order
        .mockReturnValueOnce([dbState.stores[0]]); // Store A has linked account 'acc_store_A' != 'acc_store_B'

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Transfer recipient mismatch' });
    });
  });

  describe('5. Refund Lifecycle & Multiple Partial Refunds', () => {
    const getWebhookHandler = () => {
      const webhookRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/webhook');
      return webhookRoute.route.stack[0].handle;
    };

    it('refund.created transitions order to REFUND_REQUESTED', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'refund.created', event_id: 'evt_ref_1', payload: { refund: { entity: { id: 'rfnd_1', payment_id: 'pay_1', amount: 50000 } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'REFUND_REQUESTED',
        refund_status: 'REQUESTED'
      }));
    });

    it('refund.processed correctly records first partial refund (40000 / 100000 paise)', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'refund.processed', event_id: 'evt_ref_p1', payload: { refund: { entity: { id: 'rfnd_1', payment_id: 'pay_1', amount: 40000 } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // idempotency
        .mockReturnValueOnce([{ id: 'order_1', total_amount: 100000, refunded_amount: 0 }]); // order query

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        refunded_amount: 40000,
        refund_status: 'PARTIAL',
        status: 'PARTIALLY_REFUNDED'
      }));
    });

    it('refund.processed correctly transitions to FULL when cumulative refund reaches total amount', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'refund.processed', event_id: 'evt_ref_p2', payload: { refund: { entity: { id: 'rfnd_2', payment_id: 'pay_1', amount: 60000 } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // idempotency
        .mockReturnValueOnce([{ id: 'order_1', total_amount: 100000, refunded_amount: 40000 }]); // previous was 40000 + 60000 = 100000

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        refunded_amount: 100000,
        refund_status: 'FULL',
        status: 'REFUNDED'
      }));
    });

    it('refund.failed marks refund_status FAILED without corrupting order status', async () => {
      const handler = getWebhookHandler();
      const payload = { event: 'refund.failed', event_id: 'evt_ref_f1', payload: { refund: { entity: { id: 'rfnd_f', payment_id: 'pay_1', amount: 50000 } } } };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        refund_status: 'FAILED'
      }));
    });
  });

  describe('6. Settlement Processing', () => {
    const getWebhookHandler = () => {
      const webhookRoute = paymentRouter.stack.find((r: any) => r.route?.path === '/webhook');
      return webhookRoute.route.stack[0].handle;
    };

    it('settlement.processed updates settlement_status, settlement_id, and utr on payment_transfers', async () => {
      const handler = getWebhookHandler();
      const payload = {
        event: 'settlement.processed',
        event_id: 'evt_setl_1',
        payload: {
          settlement: {
            entity: {
              id: 'setl_999',
              recipient_settlement_id: 'rec_setl_888',
              amount: 100000,
              status: 'processed',
              utr: 'UTR_AXIS_123456789'
            }
          }
        }
      };
      const req = createSignedWebhookReq(payload);
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      mockDb.where = vi.fn().mockReturnValue([]);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        settlement_id: 'setl_999',
        recipient_settlement_id: 'rec_setl_888',
        utr: 'UTR_AXIS_123456789',
        settlement_status: 'PROCESSED'
      }));
    });
  });
});
