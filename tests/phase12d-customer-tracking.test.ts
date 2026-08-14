import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerOrdersRouter } from '../backend/src/routes/customerOrders';
import { CommunicationService } from '../backend/src/services/communicationService';
import { stores, orders, order_items, profiles, products, communications_log } from '../backend/src/db/schema';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    stores: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Store A Attar',
        hostname: 'store-a.platform.local',
        subdomain: 'attar',
        logo_url: '/logo-a.png',
        primary_color: '#000000',
        currency: 'INR',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Store B Textiles',
        hostname: 'store-b.platform.local',
        subdomain: 'textiles',
      },
    ],
    orders: [
      {
        id: '00000000-0000-0000-0000-000000000010',
        store_id: '00000000-0000-0000-0000-000000000001',
        user_id: 'customer_user_A',
        guest_email: null,
        guest_phone: null,
        order_number: 'ORD-1001',
        tracking_token: 'tok_auth_customer_a_secret_123',
        status: 'ORDER_CREATED',
        payment_status: 'PAYMENT_CAPTURED',
        fulfillment_status: 'UNFULFILLED',
        total_amount: 150000,
        subtotal: 150000,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        currency: 'INR',
        shipping_address: { name: 'Customer A', city: 'Mumbai', phone: '9876543210', email: 'customerA@test.local' },
        notes: 'INTERNAL_MERCHANT_PRIVATE_NOTE',
        carrier: null,
        tracking_number: null,
      },
      {
        id: '00000000-0000-0000-0000-000000000020',
        store_id: '00000000-0000-0000-0000-000000000001',
        user_id: null,
        guest_email: 'guest@example.com',
        guest_phone: '9123456780',
        order_number: 'ORD-GUEST-2002',
        tracking_token: 'tok_guest_secret_987654321',
        status: 'PROCESSING',
        payment_status: 'PAYMENT_CAPTURED',
        fulfillment_status: 'SHIPPED',
        total_amount: 250000,
        subtotal: 250000,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        currency: 'INR',
        shipping_address: { name: 'Guest User', city: 'Delhi', phone: '9123456780', email: 'guest@example.com' },
        notes: 'INTERNAL_SECRET_MERCHANT_COMMISSION',
        carrier: 'Delhivery',
        tracking_number: 'DLHV99887766',
        shipped_at: new Date('2026-08-14T06:00:00Z'),
      },
    ],
    items: [
      {
        id: 'item_1',
        order_id: '00000000-0000-0000-0000-000000000010',
        product_id: 'prod_1',
        product_snapshot: { name: 'Royal Oud 50ml', images: ['/img/oud.jpg'] },
        quantity: 1,
        unit_price: 150000,
        total_price: 150000,
      },
      {
        id: 'item_2',
        order_id: '00000000-0000-0000-0000-000000000020',
        product_id: 'prod_2',
        product_snapshot: { name: 'Rose Attar 100ml', images: ['/img/rose.jpg'] },
        quantity: 2,
        unit_price: 125000,
        total_price: 250000,
      },
    ],
    currentOrder: null,
    currentTable: '',
    communicationsLogs: [],
  };

  const getQueryResult = () => {
    if (dbState.currentTable === 'stores') {
      return [dbState.stores[0]];
    }
    if (dbState.currentTable === 'orders') {
      return dbState.currentOrder ? [dbState.currentOrder] : [];
    }
    if (dbState.currentTable === 'order_items') {
      return dbState.items.filter((i: any) => i.order_id === dbState.currentOrder?.id);
    }
    if (dbState.currentTable === 'communications_log') {
      return dbState.communicationsLogs;
    }
    return [];
  };

  const queryBuilder: any = {
    where: vi.fn().mockImplementation(() => queryBuilder),
    orderBy: vi.fn().mockImplementation(() => getQueryResult()),
    returning: vi.fn().mockImplementation(() => {
      if (dbState.currentTable === 'communications_log') {
        const item = { id: 'comm_log_1', ...dbState.lastCommEntry };
        dbState.communicationsLogs.push(item);
        return [item];
      }
      return getQueryResult();
    }),
    then: (resolve: any) => {
      return resolve(getQueryResult());
    },
  };

  const mockDb: any = {
    select: vi.fn().mockImplementation(() => mockDb),
    from: vi.fn().mockImplementation((table) => {
      if (table === stores || (table as any)?.hostname) {
        dbState.currentTable = 'stores';
      } else if (table === orders || (table as any)?.order_number) {
        dbState.currentTable = 'orders';
      } else if (table === order_items || (table as any)?.unit_price) {
        dbState.currentTable = 'order_items';
      } else if (table === communications_log || (table as any)?.event_type) {
        dbState.currentTable = 'communications_log';
      } else {
        dbState.currentTable = 'other';
      }
      return queryBuilder;
    }),
    where: vi.fn().mockImplementation(() => queryBuilder),
    insert: vi.fn().mockImplementation((table) => {
      if (table === communications_log || (table as any)?.event_type) {
        dbState.currentTable = 'communications_log';
      }
      return mockDb;
    }),
    values: vi.fn().mockImplementation((vals) => {
      dbState.lastCommEntry = vals;
      return queryBuilder;
    }),
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

describe('Phase 12D — Customer Order Tracking & Commerce Communications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.currentOrder = { ...dbState.orders[0] };
    dbState.currentTable = '';
    dbState.communicationsLogs = [];
  });

  const getRouteHandler = (path: string, method: string) => {
    const route = customerOrdersRouter.stack.find(
      (layer: any) => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]
    );
    return route.route.stack[route.route.stack.length - 1].handle;
  };

  describe('1. Authenticated & Tokenized Customer Access', () => {
    it('allows authenticated customer to view their own order in Store A', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: dbState.orders[0].id },
        query: {},
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'customer_user_A' },
          store: dbState.stores[0],
          storeId: dbState.stores[0].id,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({
            id: dbState.orders[0].id,
            order_number: 'ORD-1001',
            total_amount: 150000,
          }),
          store: expect.objectContaining({
            name: 'Store A Attar',
          }),
        })
      );
    });

    it('allows guest customer to view order when valid tracking token is provided', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: dbState.orders[1].id },
        query: { token: 'tok_guest_secret_987654321' },
        headers: {},
      };
      const res = {
        locals: {
          user: null, // Unauthenticated / Guest
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[1] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({
            order_number: 'ORD-GUEST-2002',
            fulfillment_status: 'SHIPPED',
            carrier: 'Delhivery',
            tracking_number: 'DLHV99887766',
          }),
        })
      );
    });

    it('rejects access when unauthenticated user provides known UUID without token (403)', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: dbState.orders[0].id },
        query: {}, // No token!
        headers: {},
      };
      const res = {
        locals: {
          user: null, // No session
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Access denied'),
        })
      );
    });

    it('rejects cross-customer access when Customer B tries to access Customer A order (403)', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: dbState.orders[0].id },
        query: {},
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'customer_user_B' }, // Different user!
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Access denied'),
        })
      );
    });

    it('returns 404 when order does not belong to the requested store tenant', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: 'nonexistent_or_other_store_order' },
        query: { token: 'some_token' },
        headers: {},
      };
      const res = {
        locals: {
          user: null,
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

  describe('2. Sanitization Boundary & Information Hiding', () => {
    it('strictly hides internal merchant notes, linked account details, and private platform data', async () => {
      const handler = getRouteHandler('/:id', 'get');
      const req = {
        params: { id: dbState.orders[0].id },
        query: { token: 'tok_auth_customer_a_secret_123' },
        headers: {},
      };
      const res = {
        locals: {
          user: { id: 'customer_user_A' },
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[0] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];

      // Sanitization invariants:
      expect(payload.order.notes).toBeUndefined();
      expect(payload.order.razorpay_order_id).toBeUndefined();
      expect(payload.order.razorpay_payment_id).toBeUndefined();
      expect(payload.store.razorpay_linked_account_id).toBeUndefined();
    });
  });

  describe('3. Customer Order Tracking Lookup Form', () => {
    it('successfully returns order tracking token when orderNumber and email match', async () => {
      const handler = getRouteHandler('/lookup', 'post');
      const req = {
        body: { orderNumber: 'ORD-GUEST-2002', emailOrPhone: 'guest@example.com' },
        headers: {},
      };
      const res = {
        locals: {
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[1] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-GUEST-2002',
          trackingToken: 'tok_guest_secret_987654321',
          fulfillmentStatus: 'SHIPPED',
          carrier: 'Delhivery',
          trackingNumber: 'DLHV99887766',
        })
      );
    });

    it('rejects lookup when email or phone does not match order records (404)', async () => {
      const handler = getRouteHandler('/lookup', 'post');
      const req = {
        body: { orderNumber: 'ORD-GUEST-2002', emailOrPhone: 'wrong_imposter@fake.com' },
        headers: {},
      };
      const res = {
        locals: {
          store: dbState.stores[0],
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      dbState.currentOrder = { ...dbState.orders[1] };

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('No matching order found'),
        })
      );
    });
  });

  describe('4. Central Communication Service Domain Events', () => {
    it('dispatches domain events and logs structured entry in communications_log', async () => {
      const result = await CommunicationService.dispatchEvent({
        eventType: 'ORDER_SHIPPED',
        storeId: dbState.stores[0].id,
        storeName: dbState.stores[0].name,
        orderId: dbState.orders[1].id,
        orderNumber: dbState.orders[1].order_number,
        recipientEmail: 'guest@example.com',
        carrier: 'Delhivery',
        trackingNumber: 'DLHV99887766',
      });

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          store_id: dbState.stores[0].id,
          order_id: dbState.orders[1].id,
          recipient: 'guest@example.com',
          event_type: 'ORDER_SHIPPED',
          subject: expect.stringContaining('Has Shipped'),
          content: expect.stringContaining('DLHV99887766'),
        })
      );
    });
  });
});
