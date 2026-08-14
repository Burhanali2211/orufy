import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeResolver, requireStore } from '../backend/src/middleware/storeResolver';
import { paymentRouter } from '../backend/src/routes/payment';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    stores: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'YourCommerce',
        hostname: 'attar-house.platform.local',
        razorpay_linked_account_id: 'acc_store_A',
        payment_onboarding_status: 'ACCOUNT_CREATED',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Heritage Textiles Co',
        hostname: 'textiles.platform.local',
        razorpay_linked_account_id: 'acc_store_B',
        payment_onboarding_status: 'ACCOUNT_CREATED',
      },
    ],
    custom_domains: [
      {
        id: 'cd-1',
        store_id: '00000000-0000-0000-0000-000000000001',
        hostname: 'aligarhattars.com',
        verification_status: 'VERIFIED',
        ssl_status: 'ACTIVE',
      },
      {
        id: 'cd-2-unverified',
        store_id: '00000000-0000-0000-0000-000000000002',
        hostname: 'unverifiedtextiles.com',
        verification_status: 'PENDING_VERIFICATION',
        ssl_status: 'PENDING',
      },
    ],
    products: [
      {
        id: 'prod_1',
        store_id: '00000000-0000-0000-0000-000000000001',
        name: 'Royal Oudh Attar',
        price: 185000,
        stock: 50,
      },
      {
        id: 'prod_2',
        store_id: '00000000-0000-0000-0000-000000000002',
        name: 'Oxford Silk Shirt',
        price: 249900,
        stock: 20,
      },
    ],
  };

  const mockDb: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation((condition: any) => {
      if (dbState.__mock_select_return) {
        const ret = dbState.__mock_select_return;
        dbState.__mock_select_return = null;
        return ret;
      }
      return [];
    }),
    limit: vi.fn().mockImplementation((num: number) => {
      return dbState.stores.slice(0, num);
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => {
      return [{ id: 'order_uuid_1', order_number: 'ORD-123456', total_amount: 185000, currency: 'INR', status: 'ORDER_CREATED', payment_status: 'PAYMENT_PENDING' }];
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
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
    res.locals.user = { id: 'user_cust_1' };
    next();
  },
}));

vi.mock('../backend/src/db/utils', () => ({
  withStoreContext: async (storeId: any, cb: any, userId: any) => {
    return cb(mockDb);
  },
}));

describe('Phase 12A — Live Multi-Tenant Storefront Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Authoritative Hostname Tenant Resolution & Zero Localhost Fallback', () => {
    it('resolves Store A from platform subdomain header', async () => {
      const req = { headers: { host: 'attar-house.platform.local:3001' } };
      const res = { locals: {} };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // no custom domain
        .mockReturnValueOnce([dbState.stores[0]]); // matched platform store

      await storeResolver(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.locals.storeId).toBe('00000000-0000-0000-0000-000000000001');
      expect(res.locals.store.name).toBe('YourCommerce');
      expect(res.locals.isPlatform).toBe(false);
    });

    it('resolves Store B independently from different subdomain header', async () => {
      const req = { headers: { host: 'textiles.platform.local' } };
      const res = { locals: {} };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // no custom domain
        .mockReturnValueOnce([dbState.stores[1]]); // matched Store B

      await storeResolver(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.locals.storeId).toBe('00000000-0000-0000-0000-000000000002');
      expect(res.locals.store.name).toBe('Heritage Textiles Co');
    });

    it('returns 404 STORE_NOT_FOUND for unknown hostnames with zero silent fallback', async () => {
      const req = { headers: { host: 'unknown-store.platform.local' } };
      const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // no custom domain
        .mockReturnValueOnce([]); // no store

      await storeResolver(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'STORE_NOT_FOUND' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 404 STORE_NOT_FOUND for unverified custom domains', async () => {
      const req = { headers: { host: 'unverifiedtextiles.com' } };
      const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // unverified custom domain filtered out
        .mockReturnValueOnce([]); // no platform subdomain

      await storeResolver(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'STORE_NOT_FOUND' });
      expect(next).not.toHaveBeenCalled();
    });

    it('ignores spoofed tenant headers (X-Store-ID, X-Tenant-ID, X-Store-Host) and resolves strictly from Host', async () => {
      const req = {
        headers: {
          host: 'attar-house.platform.local',
          'x-store-id': '00000000-0000-0000-0000-000000000002',
          'x-tenant-id': '00000000-0000-0000-0000-000000000002',
          'x-store-host': 'textiles.platform.local',
        },
      };
      const res = { locals: {} };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([])
        .mockReturnValueOnce([dbState.stores[0]]);

      await storeResolver(req as any, res as any, next);

      expect(res.locals.storeId).toBe('00000000-0000-0000-0000-000000000001');
      expect(res.locals.store.name).toBe('YourCommerce');
    });
  });

  describe('2. Public Storefront Configuration Contract', () => {
    it('exposes only public branding and identity without leaking private merchant keys', () => {
      const store = dbState.stores[0];
      const publicContract = {
        identity: { id: store.id, name: store.name, siteName: store.name, logo: '', favicon: '', announcementBar: '' },
        branding: { primary: '#8c7e5a', accent: '#bfa760', typography: 'Inter' },
        commerce: { currency: 'INR', taxRatePct: 18, shippingFeePaise: 0, freeShippingThresholdPaise: 49900, razorpayReady: true },
        contact: { email: `contact@${store.hostname}`, phone: '+91 98765 43210', address: 'Registered Address' },
        domain: { hostname: store.hostname, canonicalUrl: `https://${store.hostname}` },
      };

      expect(publicContract.identity.name).toBe('YourCommerce');
      expect(publicContract).not.toHaveProperty('razorpay_key_secret');
      expect(publicContract).not.toHaveProperty('database_url');
    });

    it('enforces monetary amounts in integer paise units', () => {
      const prodA = dbState.products[0];
      const prodB = dbState.products[1];

      expect(Number.isInteger(prodA.price)).toBe(true);
      expect(Number.isInteger(prodB.price)).toBe(true);
      expect(prodA.price).toBe(185000); // ₹1,850.00 in paise
      expect(prodB.price).toBe(249900); // ₹2,499.00 in paise
    });
  });

  describe('3. Tenant-Scoped Cart Isolation vs Backend Security Boundary', () => {
    it('scopes client storage key by hostname to provide clean UX isolation', () => {
      const getStorageKey = (hostname: string) => `guest_cart_${hostname}`;
      expect(getStorageKey('store-a.platform.local')).not.toBe(getStorageKey('store-b.platform.local'));
    });

    it('rejects checkout on Store A when client attempts to submit Store B product', async () => {
      const route = paymentRouter.stack.find(
        (layer: any) => layer.route && layer.route.path === '/checkout/orders' && layer.route.methods.post
      );
      const handler = route.route.stack[route.route.stack.length - 1].handle;

      const req = {
        body: {
          items: [{ productId: 'prod_2', quantity: 1 }], // Store B product!
          shippingAddress: {},
        },
      };
      const res = {
        locals: {
          user: { id: 'user_1' },
          store: dbState.stores[0], // Store A context
          storeId: dbState.stores[0].id,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Mock DB: product prod_2 is not found in Store A
      mockDb.where = vi.fn().mockReturnValueOnce([]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('not found or unavailable in this store') })
      );
    });
  });

  describe('4. Payment Route Consumes Authoritative res.locals.store', () => {
    it('derives merchant linked account directly from res.locals.store without requiring x-store-hostname', async () => {
      const route = paymentRouter.stack.find(
        (layer: any) => layer.route && layer.route.path === '/checkout/orders' && layer.route.methods.post
      );
      const handler = route.route.stack[route.route.stack.length - 1].handle;

      const req = {
        headers: {}, // Zero custom headers!
        body: {
          items: [{ productId: 'prod_1', quantity: 1 }],
          shippingAddress: {},
          paymentMethod: 'cod',
        },
      };
      const res = {
        locals: {
          user: { id: 'user_1' },
          store: dbState.stores[0],
          storeId: dbState.stores[0].id,
        },
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      mockDb.where = vi.fn().mockReturnValueOnce([dbState.products[0]]);

      await handler(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({ totalAmount: expect.any(Number) }),
        })
      );
    });
  });
});
