import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentRouter } from '../backend/src/routes/payment';
import { expirePendingReservationsOnce } from '../backend/src/workers/reservationExpiryWorker';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    stores: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'YourCommerce',
        hostname: 'attar-house.platform.local',
        razorpay_linked_account_id: 'acc_store_A',
        tax_rate_percent: 12, // Custom 12% GST rate
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Heritage Textiles Co',
        hostname: 'textiles.platform.local',
        razorpay_linked_account_id: 'acc_store_B',
        tax_rate_percent: 5, // Custom 5% GST rate
      },
    ],
    products: [
      {
        id: 'prod_1',
        store_id: '00000000-0000-0000-0000-000000000001',
        name: 'Royal Oudh Attar',
        price: 185000, // 1850.00 INR in paise
        stock: 10,
        reserved_stock: 0,
      },
      {
        id: 'prod_2',
        store_id: '00000000-0000-0000-0000-000000000002',
        name: 'Oxford Silk Shirt',
        price: 249900, // 2499.00 INR in paise
        stock: 5,
        reserved_stock: 0,
      },
    ],
  };

  const mockDb: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => {
      return [dbState.products[0]];
    }),
    for: vi.fn().mockImplementation(() => {
      return [dbState.products[0]];
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => {
      return [
        {
          id: 'order_uuid_100',
          order_number: 'ORD-123456',
          total_amount: 207200, // 185000 + 12% GST (22200) = 207200 paise
          subtotal: 185000,
          tax_amount: 22200,
          shipping_amount: 0,
          currency: 'INR',
          status: 'ORDER_CREATED',
          payment_status: 'PAYMENT_PENDING',
          fulfillment_status: 'UNFULFILLED',
        },
      ];
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockResolvedValue(true),
    })),
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
    res.locals.user = { id: 'user_cust_1' };
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

describe('Phase 12B — Refined Atomic Commerce Checkout Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_mock';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
  });

  const getCheckoutHandler = () => {
    const route = paymentRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === '/checkout/orders' && layer.route.methods.post
    );
    return route.route.stack[route.route.stack.length - 1].handle;
  };

  describe('1. Server-Authoritative Pricing & Dynamic Tax Configuration', () => {
    it('calculates totals strictly from database price in paise and uses dynamic store tax_rate_percent (12%)', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: {},
        body: {
          items: [{ productId: 'prod_1', quantity: 1, price: 10, total: 10, tax: 0 }],
          shippingAddress: { city: 'Aligarh' },
          paymentMethod: 'cod',
        },
      };
      const res = {
        locals: { user: { id: 'user_1' }, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValue([
        { id: 'prod_1', store_id: dbState.stores[0].id, name: 'Royal Oudh Attar', price: 185000, stock: 10, reserved_stock: 0 },
      ]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            subtotal: 185000,
            taxAmount: 22200, // 185000 * 0.12 = 22200
            totalAmount: 207200, // ₹2,072.00 in paise
          }),
        })
      );
    });
  });

  describe('2. Atomic Inventory Lock & Reservations', () => {
    it('locks product row and increments reserved_stock atomically', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: {},
        body: {
          items: [{ productId: 'prod_1', quantity: 1 }],
          shippingAddress: {},
          paymentMethod: 'cod',
        },
      };
      const res = {
        locals: { user: { id: 'user_1' }, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValue([
        { id: 'prod_1', store_id: dbState.stores[0].id, name: 'Royal Oudh Attar', price: 185000, stock: 5, reserved_stock: 1 },
      ]);

      await handler(req as any, res as any);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          reserved_stock: 2, // 1 existing + 1 reserved
        })
      );
    });

    it('rejects checkout when requested quantity exceeds available stock (stock - reserved_stock)', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: {},
        body: {
          items: [{ productId: 'prod_1', quantity: 2 }],
          shippingAddress: {},
          paymentMethod: 'cod',
        },
      };
      const res = {
        locals: { user: { id: 'user_1' }, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValue([
        { id: 'prod_1', store_id: dbState.stores[0].id, name: 'Royal Oudh Attar', price: 185000, stock: 2, reserved_stock: 1 },
      ]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('out of stock or requested quantity exceeds available stock'),
        })
      );
    });

    it('rejects invalid or zero quantity', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: {},
        body: {
          items: [{ productId: 'prod_1', quantity: 0 }],
          shippingAddress: {},
        },
      };
      const res = {
        locals: { user: { id: 'user_1' }, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValue([
        { id: 'prod_1', store_id: dbState.stores[0].id, name: 'Royal Oudh Attar', price: 185000, stock: 10, reserved_stock: 0 },
      ]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid quantity'),
        })
      );
    });
  });

  describe('3. Guest Checkout Model', () => {
    it('permits unauthenticated guest checkout with null userId and guestEmail/guestPhone captured', async () => {
      const handler = getCheckoutHandler();
      const req = {
        headers: {},
        body: {
          items: [{ productId: 'prod_1', quantity: 1 }],
          guestEmail: 'guest.shopper@example.com',
          guestPhone: '+91 99999 88888',
          shippingAddress: { city: 'New Delhi' },
          paymentMethod: 'cod',
        },
      };
      const res = {
        locals: { user: null, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValue([
        { id: 'prod_1', store_id: dbState.stores[0].id, name: 'Royal Oudh Attar', price: 185000, stock: 10, reserved_stock: 0 },
      ]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
          guest_email: 'guest.shopper@example.com',
          guest_phone: '+91 99999 88888',
        })
      );
    });
  });

  describe('4. Database-Backed Checkout Idempotency', () => {
    it('returns existing cached order payload on duplicate Idempotency-Key submission', async () => {
      const handler = getCheckoutHandler();
      const idempotencyKey = 'idemp_key_9999';
      const cachedPayload = {
        success: true,
        order: { id: 'order_uuid_cached', orderNumber: 'ORD-CACHED', totalAmount: 207200 },
      };

      const req = {
        headers: { 'idempotency-key': idempotencyKey },
        body: {
          items: [{ productId: 'prod_1', quantity: 1 }],
          shippingAddress: {},
        },
      };
      const res = {
        locals: { user: { id: 'user_1' }, store: dbState.stores[0], storeId: dbState.stores[0].id },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValueOnce([
        { idempotency_key: idempotencyKey, response_payload: cachedPayload },
      ]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedPayload);
    });
  });

  describe('5. Background Reservation Expiry Worker', () => {
    it('finds expired reservations, releases reserved_stock, and marks orders as PAYMENT_EXPIRED', async () => {
      const fakeExpiredReservation = {
        id: 'res_expired_1',
        order_id: 'ord_stale_1',
        product_id: 'prod_1',
        quantity: 2,
        status: 'RESERVED',
        expires_at: new Date(Date.now() - 60000), // 1 min ago
      };

      let tableSelected = '';
      const mockWorkerDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockImplementation((table) => {
          tableSelected = table?._?.name || 'unknown';
          return mockWorkerDb;
        }),
        where: vi.fn().mockImplementation(() => {
          if (tableSelected === 'products') {
            return [{ id: 'prod_1', stock: 10, reserved_stock: 2 }];
          }
          return [fakeExpiredReservation];
        }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue(true),
        })),
        transaction: vi.fn().mockImplementation(async (cb) => {
          return cb(mockWorkerDb);
        }),
      };

      const count = await expirePendingReservationsOnce(mockWorkerDb);

      expect(count).toBe(1);
      expect(mockWorkerDb.update).toHaveBeenCalled();
      expect(mockWorkerDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          reserved_stock: 0,
        })
      );
      expect(mockWorkerDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'EXPIRED',
        })
      );
      expect(mockWorkerDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PAYMENT_EXPIRED',
          payment_status: 'PAYMENT_EXPIRED',
        })
      );
    });
  });
});
