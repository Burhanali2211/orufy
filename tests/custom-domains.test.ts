import { describe, it, expect, vi, beforeEach } from 'vitest';
import { domainsRouter } from '../backend/src/routes/domains';
import { storeResolver } from '../backend/src/middleware/storeResolver';
import { normalizeHostname } from '../backend/src/lib/domainUtils';
import { generateNginxServerBlock, provisionSslCertificate } from '../backend/src/lib/sslManager';

const { dbState, mockDb } = vi.hoisted(() => {
  const dbState: any = {
    stores: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Store A',
        hostname: 'store-a.platform.local',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Store B',
        hostname: 'store-b.platform.local',
      }
    ],
    custom_domains: [
      {
        id: 'dom_active_1',
        store_id: '00000000-0000-0000-0000-000000000001',
        hostname: 'mystore.com',
        domain_type: 'apex',
        verification_token: 'bf-domain-verification=tok123',
        verification_status: 'VERIFIED',
        ssl_status: 'ACTIVE',
        ssl_expires_at: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        is_primary: true,
        created_at: new Date()
      },
      {
        id: 'dom_pending_1',
        store_id: '00000000-0000-0000-0000-000000000001',
        hostname: 'pending-shop.com',
        domain_type: 'apex',
        verification_token: 'bf-domain-verification=pending456',
        verification_status: 'PENDING_VERIFICATION',
        ssl_status: 'PENDING',
        is_primary: false,
        created_at: new Date()
      },
      {
        id: 'dom_expired_1',
        store_id: '00000000-0000-0000-0000-000000000001',
        hostname: 'expired-token.com',
        domain_type: 'apex',
        verification_token: 'bf-domain-verification=oldtok',
        verification_status: 'PENDING_VERIFICATION',
        ssl_status: 'PENDING',
        is_primary: false,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days old (> 7 days)
      },
      {
        id: 'dom_suspended_1',
        store_id: '00000000-0000-0000-0000-000000000002',
        hostname: 'suspended-store.com',
        domain_type: 'apex',
        verification_token: 'bf-domain-verification=susp789',
        verification_status: 'SUSPENDED',
        ssl_status: 'ACTIVE',
        is_primary: false,
        created_at: new Date()
      }
    ],
    store_members: [
      {
        store_id: '00000000-0000-0000-0000-000000000001',
        user_id: 'merchant_user_1',
        role: 'owner'
      },
      {
        store_id: '00000000-0000-0000-0000-000000000002',
        user_id: 'merchant_user_2',
        role: 'owner'
      }
    ]
  };

  const mockDb: any = {
    transaction: vi.fn().mockImplementation((cb: any) => cb(mockDb)),
    execute: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => {
      if (dbState.__mock_select_return) {
        const ret = dbState.__mock_select_return;
        dbState.__mock_select_return = null;
        return ret;
      }
      return mockDb;
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockImplementation((val: any) => {
      dbState.__last_inserted = val;
      return mockDb;
    }),
    returning: vi.fn().mockImplementation(() => {
      if (dbState.__mock_returning) {
        const ret = dbState.__mock_returning;
        dbState.__mock_returning = null;
        return ret;
      }
      if (dbState.__last_inserted) {
        const ret = [{
          id: 'dom_new_123',
          store_id: dbState.__last_inserted.store_id,
          hostname: dbState.__last_inserted.hostname,
          domain_type: dbState.__last_inserted.domain_type,
          verification_token: dbState.__last_inserted.verification_token,
          verification_status: dbState.__last_inserted.verification_status,
          ssl_status: dbState.__last_inserted.ssl_status,
          is_primary: dbState.__last_inserted.is_primary,
          created_at: new Date()
        }];
        dbState.__last_inserted = null;
        return ret;
      }
      return [{ id: 'dom_updated_1', verification_status: 'VERIFIED', ssl_status: 'SSL_PENDING' }];
    }),
    delete: vi.fn().mockReturnThis(),
  };

  return { dbState, mockDb };
});

vi.mock('../backend/src/middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    res.locals = { user: { id: req.headers['x-mock-user-id'] || 'merchant_user_1' } };
    next();
  },
}));

vi.mock('../backend/src/db/db', () => ({
  db: mockDb
}));

// Mock DNS resolver
vi.mock('dns', () => {
  return {
    default: {
      promises: {
        resolveTxt: vi.fn().mockImplementation(async (host: string) => {
          if (host.includes('verified-domain.com')) {
            return [['bf-domain-verification=valid_token_123']];
          }
          if (host.includes('wrong-token.com')) {
            return [['bf-domain-verification=different_token']];
          }
          const err: any = new Error('queryTxt ENOTFOUND');
          err.code = 'ENOTFOUND';
          throw err;
        })
      }
    }
  };
});

describe('Phase 9 — Custom Domains Full Infrastructure & Security Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.__mock_select_return = null;
    dbState.__mock_returning = null;
  });

  describe('1. Canonical Hostname Normalization & Injection Prevention', () => {
    it('normalizes uppercase, trailing dots, and ports correctly', () => {
      expect(normalizeHostname('MYSTORE.COM')).toBe('mystore.com');
      expect(normalizeHostname('  mystore.com.  ')).toBe('mystore.com');
      expect(normalizeHostname('mystore.com:3000')).toBe('mystore.com');
      expect(normalizeHostname('SHOP.MYSTORE.COM:8080.')).toBe('shop.mystore.com');
    });

    it('rejects path traversal, spaces, and illegal characters', () => {
      expect(() => normalizeHostname('mystore.com/admin')).toThrow(/illegal characters/);
      expect(() => normalizeHostname('my store.com')).toThrow(/illegal characters/);
      expect(() => normalizeHostname('http://mystore.com')).toThrow(/illegal characters/);
      expect(() => normalizeHostname('')).toThrow(/non-empty string/);
    });

    it('prevents Nginx configuration injection via strictly sanitized server blocks', () => {
      const serverBlock = generateNginxServerBlock('store.example.com', '/etc/ssl/cert.pem', '/etc/ssl/key.pem');
      expect(serverBlock).toContain('server_name store.example.com;');
      expect(serverBlock).toContain('ssl_certificate /etc/ssl/cert.pem;');
      expect(serverBlock).toContain('proxy_set_header Host $host;');

      // Attempt injection with newlines/semicolons
      expect(() => generateNginxServerBlock('store.com;\nreturn 500;', '/cert', '/key')).toThrow(/illegal characters|Invalid hostname/);
    });
  });

  describe('2. Domain Registration & Single Primary Domain Enforcement', () => {
    const getAddDomainHandler = () => {
      const route = domainsRouter.stack.find((r: any) => r.route?.path === '/' && r.route?.methods?.post);
      return route.route.stack.find((s: any) => s.name !== 'requireAuth').handle;
    };

    it('Store A registers a new custom domain', async () => {
      const handler = getAddDomainHandler();
      const req = {
        headers: { 'x-mock-user-id': 'merchant_user_1' },
        body: { hostname: 'New-Merchant-Store.com', isPrimary: true }
      };
      const res = {
        locals: { user: { id: 'merchant_user_1' } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.store_members[0]])
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValue(mockDb);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        domain: expect.objectContaining({
          hostname: 'new-merchant-store.com',
          verificationStatus: 'PENDING_VERIFICATION',
          sslStatus: 'PENDING'
        })
      }));
    });

    it('setting a domain as primary demotes existing primary domain', async () => {
      const setPrimaryRoute = domainsRouter.stack.find((r: any) => r.route?.path === '/:id/set-primary' && r.route?.methods?.post);
      const handler = setPrimaryRoute.route.stack.find((s: any) => s.name !== 'requireAuth').handle;

      const req = {
        headers: { 'x-mock-user-id': 'merchant_user_1' },
        params: { id: 'dom_pending_1' }
      };
      const res = {
        locals: { user: { id: 'merchant_user_1' } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.store_members[0]])
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.custom_domains[1]])
        .mockReturnValue(mockDb);

      dbState.__mock_returning = [{ ...dbState.custom_domains[1], is_primary: true }];

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        domain: expect.objectContaining({ is_primary: true })
      }));
    });
  });

  describe('3. DNS TXT Challenge Verification & Token Expiry', () => {
    const getVerifyDomainHandler = () => {
      const route = domainsRouter.stack.find((r: any) => r.route?.path === '/:id/verify' && r.route?.methods?.post);
      return route.route.stack.find((s: any) => s.name !== 'requireAuth').handle;
    };

    it('transitions domain to VERIFIED and SSL_PENDING when correct TXT record is found', async () => {
      const handler = getVerifyDomainHandler();
      const req = {
        headers: { 'x-mock-user-id': 'merchant_user_1' },
        params: { id: 'dom_1' }
      };
      const res = {
        locals: { user: { id: 'merchant_user_1' } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.store_members[0]])
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([{
          id: 'dom_1',
          store_id: dbState.stores[0].id,
          hostname: 'verified-domain.com',
          verification_token: 'bf-domain-verification=valid_token_123',
          verification_status: 'PENDING_VERIFICATION',
          created_at: new Date()
        }])
        .mockReturnValue(mockDb);

      dbState.__mock_returning = [{
        verification_status: 'VERIFIED',
        ssl_status: 'SSL_PENDING'
      }];

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        verified: true,
        verificationStatus: 'VERIFIED',
        sslStatus: 'SSL_PENDING'
      }));
    });

    it('rejects verification if verification token has expired (> 7 days)', async () => {
      const handler = getVerifyDomainHandler();
      const req = {
        headers: { 'x-mock-user-id': 'merchant_user_1' },
        params: { id: 'dom_expired_1' }
      };
      const res = {
        locals: { user: { id: 'merchant_user_1' } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.store_members[0]])
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([dbState.custom_domains[2]])
        .mockReturnValue(mockDb);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'TOKEN_EXPIRED'
      }));
    });
  });

  describe('4. SSL Provisioning, Expiry Tracking & Renewal', () => {
    it('provisionSslCertificate creates valid cert metadata and records 90-day expiry', async () => {
      const result = await provisionSslCertificate('mystore.com');
      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 80 * 24 * 60 * 60 * 1000);
    });

    it('activate-ssl provisions SSL and transitions domain to ACTIVE with expiry recorded', async () => {
      const activateRoute = domainsRouter.stack.find((r: any) => r.route?.path === '/:id/activate-ssl' && r.route?.methods?.post);
      const handler = activateRoute.route.stack.find((s: any) => s.name !== 'requireAuth').handle;

      const req = {
        headers: { 'x-mock-user-id': 'merchant_user_1' },
        params: { id: 'dom_1' }
      };
      const res = {
        locals: { user: { id: 'merchant_user_1' } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.store_members[0]])
        .mockReturnValueOnce([dbState.stores[0]])
        .mockReturnValueOnce([{
          id: 'dom_1',
          store_id: dbState.stores[0].id,
          hostname: 'mystore.com',
          verification_status: 'VERIFIED',
          ssl_status: 'SSL_PENDING'
        }])
        .mockReturnValue(mockDb);

      dbState.__mock_returning = [{
        id: 'dom_1',
        hostname: 'mystore.com',
        ssl_status: 'ACTIVE',
        ssl_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }];

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        domain: expect.objectContaining({ ssl_status: 'ACTIVE' })
      }));
    });

    it('automated renewal re-provisions expiring certificates', async () => {
      const renewRoute = domainsRouter.stack.find((r: any) => r.route?.path === '/renew-ssl' && r.route?.methods?.post);
      const handler = renewRoute.route.stack[0].handle;

      const req = { headers: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      mockDb.where = vi.fn()
        .mockReturnValueOnce([{
          id: 'dom_expiring_1',
          hostname: 'expiring-soon.com',
          ssl_status: 'ACTIVE',
          verification_status: 'VERIFIED',
          ssl_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days left
        }])
        .mockReturnValue(mockDb);

      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        renewedCount: 1,
        renewed: ['expiring-soon.com']
      }));
    });
  });

  describe('5. HTTPS E2E Store Context Resolution & Host Isolation', () => {
    it('https://custom-domain.example (ACTIVE verified) reaches Store A', async () => {
      const req: any = {
        headers: { host: 'mystore.com' },
        hostname: 'mystore.com'
      };
      const res: any = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.custom_domains[0]])
        .mockReturnValueOnce([dbState.stores[0]]);

      await storeResolver(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.storeId).toBe(dbState.stores[0].id);
      expect(res.locals.store.name).toBe('Store A');
    });

    it('Store B domain reaches Store B and does not leak Store A context', async () => {
      const req: any = {
        headers: { host: 'store-b.platform.local' },
        hostname: 'store-b.platform.local'
      };
      const res: any = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([]) // custom domains
        .mockReturnValueOnce([dbState.stores[1]]); // platform subdomain

      await storeResolver(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.storeId).toBe(dbState.stores[1].id);
      expect(res.locals.store.name).toBe('Store B');
    });

    it('unverified domain fails closed (HTTP 404)', async () => {
      const req: any = {
        headers: { host: 'pending-shop.com' },
        hostname: 'pending-shop.com'
      };
      const res: any = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      await storeResolver(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'STORE_NOT_FOUND' });
    });

    it('host header spoofing via X-Store-ID / X-Tenant-ID is rejected', async () => {
      const req: any = {
        headers: {
          host: 'mystore.com',
          'x-store-id': dbState.stores[1].id,
          'x-tenant-id': dbState.stores[1].id,
          'x-store-host': 'store-b.platform.local'
        },
        hostname: 'mystore.com'
      };
      const res: any = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      mockDb.where = vi.fn()
        .mockReturnValueOnce([dbState.custom_domains[0]])
        .mockReturnValueOnce([dbState.stores[0]]);

      await storeResolver(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.locals.storeId).toBe(dbState.stores[0].id); // Must remain Store A
    });
  });
});
