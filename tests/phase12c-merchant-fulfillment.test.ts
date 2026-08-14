import { describe, it, expect, vi, beforeEach } from 'vitest';
import { merchantOrdersRouter } from '../backend/src/routes/merchantOrders';
import { store_members, orders, products, order_items } from '../backend/src/db/schema';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    stores: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Store A Attar',
        hostname: 'store-a.platform.local',
      },
    ],
    members: [
      {
        store_id: '00000000-0000-0000-0000-000000000001',
        user_id: 'merchant_user_A',
        role: 'owner',
      },
    ],
    orders: [
      {
        id: 'order_A1',
        store_id: '00000000-0000-0000-0000-000000000001',
        order_number: 'ORD-A100',
        status: 'ORDER_CREATED',
        payment_status: 'PAYMENT_CAPTURED',
        fulfillment_status: 'UNFULFILLED',
        total_amount: 150000,
        subtotal: 150000,
        tax_amount: 0,
        shipping_amount: 0,
        carrier: null,
        tracking_number: null,
      },
    ],
    currentOrder: null,
    isOwner: true,
    currentTable: '',
  };

  const getQueryResult = () => {
    if (!dbState.isOwner) {
      return [];
    }
    if (dbState.currentTable === 'store_members') {
      return [dbState.members[0]];
    }
    if (dbState.currentTable === 'orders') {
      return dbState.currentOrder ? [dbState.currentOrder] : [];
    }
    return [];
  };

  const queryBuilder: any = {
    where: vi.fn().mockImplementation(() => queryBuilder),
    orderBy: vi.fn().mockImplementation(() => getQueryResult()),
    returning: vi.fn().mockImplementation(() => getQueryResult()),
    then: (resolve: any) => {
      return resolve(getQueryResult());
    },
  };

  const mockDb: any = {
    select: vi.fn().mockImplementation(() => mockDb),
    from: vi.fn().mockImplementation((table) => {
      if (table === store_members || (table as any)?.role) {
        dbState.currentTable = 'store_members';
      } else if (table === orders || (table as any)?.order_number) {
        dbState.currentTable = 'orders';
      } else if (table === order_items || (table as any)?.unit_price) {
        dbState.currentTable = 'order_items';
      } else if (table === products || (table as any)?.sku) {
        dbState.currentTable = 'products';
      } else {
        dbState.currentTable = 'other';
      }
      return queryBuilder;
    }),
    where: vi.fn().mockImplementation(() => queryBuilder),
    insert: vi.fn().mockImplementation(() => mockDb),
    values: vi.fn().mockImplementation(() => queryBuilder),
    update: vi.fn().mockImplementation(() => mockDb),
    set: vi.fn().mockImplementation(() => queryBuilder),
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
  withUserContext: async (userId: any, cb: any) => {
    return cb(mockDb);
  },
}));

describe('Phase 12C — Merchant Fulfillment & Order Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.currentOrder = { ...dbState.orders[0] };
    dbState.isOwner = true;
    dbState.currentTable = '';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_mock';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret';
  });

  const getRouteHandler = (path: string, method: string) => {
    const route = merchantOrdersRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]
    );
    return route.route.stack[route.route.stack.length - 1].handle;
  };

  describe('1. Tenant Isolation & Attention Queue Metrics', () => {
    it('returns orders and computed attention queue for Store A merchant', async () => {
      const handler = getRouteHandler('/', 'get');
      const req = { headers: {} };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
          storeId: dbState.stores[0].id,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          attentionQueue: expect.objectContaining({
            newOrdersCount: 1,
            toPackCount: 1,
            needTrackingCount: 0,
          }),
        })
      );
    });

    it('rejects access when user is not an owner or admin of the store (403)', async () => {
      const handler = getRouteHandler('/', 'get');
      const req = { headers: {} };
      const res = {
        locals: {
          user: { id: 'unauthorized_user_X' },
          store: dbState.stores[0],
          storeId: dbState.stores[0].id,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.isOwner = false;

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Merchant access required'),
        })
      );
    });

    it('returns 404 when order does not exist in this store', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = { params: { id: 'order_nonexistent' }, headers: {} };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = null;

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Order not found in this store'),
        })
      );
    });
  });

  describe('2. Fulfillment State Machine Progression', () => {
    it('transitions UNFULFILLED order to PACKED (POST /:id/pack)', async () => {
      const handler = getRouteHandler('/:id/pack', 'post');
      const req = { params: { id: 'order_A1' }, headers: {} };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0], fulfillment_status: 'UNFULFILLED' };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          fulfillment_status: 'PACKED',
          status: 'PROCESSING',
        })
      );
    });

    it('requires carrier and tracking number when marking as SHIPPED (POST /:id/ship)', async () => {
      const handler = getRouteHandler('/:id/ship', 'post');
      const req = {
        params: { id: 'order_A1' },
        body: { carrier: '', trackingNumber: '' }, // Empty!
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Carrier and Tracking Number are required'),
        })
      );
    });

    it('successfully transitions PACKED order to SHIPPED with carrier and tracking number', async () => {
      const handler = getRouteHandler('/:id/ship', 'post');
      const req = {
        params: { id: 'order_A1' },
        body: { carrier: 'Delhivery', trackingNumber: 'DLHV123456789' },
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0], fulfillment_status: 'PACKED' };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          fulfillment_status: 'SHIPPED',
          status: 'SHIPPED',
          carrier: 'Delhivery',
          tracking_number: 'DLHV123456789',
        })
      );
    });

    it('transitions SHIPPED order to DELIVERED (POST /:id/deliver)', async () => {
      const handler = getRouteHandler('/:id/deliver', 'post');
      const req = { params: { id: 'order_A1' }, headers: {} };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0], fulfillment_status: 'SHIPPED' };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          fulfillment_status: 'DELIVERED',
          status: 'DELIVERED',
        })
      );
    });

    it('rejects reverting a DELIVERED order back to packed (400)', async () => {
      const handler = getRouteHandler('/:id/pack', 'post');
      const req = { params: { id: 'order_A1' }, headers: {} };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0], fulfillment_status: 'DELIVERED' };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Cannot revert delivered order to packed'),
        })
      );
    });

    it('rejects shipping a CANCELLED order (400)', async () => {
      const handler = getRouteHandler('/:id/ship', 'post');
      const req = {
        params: { id: 'order_A1' },
        body: { carrier: 'BlueDart', trackingNumber: 'BD123' },
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'merchant_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0], status: 'CANCELLED' };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Cannot ship a cancelled order'),
        })
      );
    });
  });
});
