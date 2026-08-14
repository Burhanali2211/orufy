import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import http from 'http';
import { Pool } from 'pg';

vi.mock('../backend/src/middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const userId = req.headers['x-test-user-id'] || '00000000-0000-0000-0000-111111111111';
    res.locals.user = {
      id: userId,
      email: 'storeowner@test.com',
      full_name: 'Store Owner',
    };
    next();
  },
}));

import { storeResolver, requireStore } from '../backend/src/middleware/storeResolver';
import { domainPurchasingRouter } from '../backend/src/routes/domainPurchasing';

const adminDbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'platform_db',
  user: 'postgres',
  password: 'password',
};

describe('Phase 10 — End-to-End Domain Purchasing & Automated DNS Flow', () => {
  let adminPool: Pool;
  let server: http.Server;
  let port: number;

  const storeAId = '00000000-0000-0000-0000-000000000001';
  const merchantAId = '00000000-0000-0000-0000-111111111111';

  function makeRequest(
    method: 'GET' | 'POST',
    path: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : '';
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      });

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  beforeAll(async () => {
    adminPool = new Pool(adminDbConfig);

    // Clean up previous test registrations
    await adminPool.query('DELETE FROM domain_registrations');
    await adminPool.query('DELETE FROM custom_domains');

    await adminPool.query(`
      INSERT INTO profiles (id, email, full_name, is_active)
      VALUES ($1, 'storeowner@test.com', 'Store Owner', true)
      ON CONFLICT (id) DO NOTHING;
    `, [merchantAId]);

    await adminPool.query(`
      INSERT INTO stores (id, name, hostname)
      VALUES ($1, 'Store A Attar', 'store-a.platform.local')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, hostname = EXCLUDED.hostname;
    `, [storeAId]);

    await adminPool.query(`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES ($1, $2, 'owner')
      ON CONFLICT DO NOTHING;
    `, [storeAId, merchantAId]);

    // Create live express test application
    const app = express();
    app.use(express.json());

    // Mock auth injection for test requests
    app.use((req, res, next) => {
      if (req.headers['x-test-user-id']) {
        res.locals.user = {
          id: req.headers['x-test-user-id'] as string,
          email: 'storeowner@test.com',
          full_name: 'Store Owner',
        };
      }
      next();
    });

    app.use(storeResolver);
    app.use('/api/platform/domains/purchase', domainPurchasingRouter);

    app.get('/api/store-info', requireStore, (req, res) => {
      res.json({
        storeId: res.locals.storeId,
        storeName: res.locals.store.name,
      });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address: any = server.address();
        port = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await adminPool.end();
  });

  it('Step 1: Merchant searches for domain name across TLDs', async () => {
    const res = await makeRequest('GET', '/api/platform/domains/purchase/search?query=royalattar', {
      Host: 'app.platform.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results.length).toBe(5); // in, shop, store, com, online
    const inDomain = res.body.results.find((r: any) => r.tld === 'in');
    expect(inDomain.domain).toBe('royalattar.in');
    expect(inDomain.available).toBe(true);
    expect(inDomain.pricePaise).toBe(89900); // ₹899
  });

  it('Step 2: Merchant initiates domain purchase order', async () => {
    const res = await makeRequest('POST', '/api/platform/domains/purchase/order', {
      Host: 'app.platform.com',
      'x-test-user-id': merchantAId,
    }, {
      domain: 'royalattar.in',
      periodYears: 1,
      isPrimary: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.domain).toBe('royalattar.in');
    expect(res.body.registrationId).toBeDefined();
    expect(res.body.amountPaise).toBe(89900);
    expect(res.body.currency).toBe('INR');
  });

  it('Step 3: Merchant confirms payment -> Auto-registers, configures Hostinger DNS, provisions SSL & launches store', async () => {
    // 1. Get registration ID
    const listRes = await makeRequest('GET', '/api/platform/domains/purchase/registrations', {
      Host: 'app.platform.com',
      'x-test-user-id': merchantAId,
    });

    expect(listRes.status).toBe(200);
    const registrationId = listRes.body.registrations[0].id;

    // 2. Confirm purchase
    const confirmRes = await makeRequest('POST', '/api/platform/domains/purchase/confirm', {
      Host: 'app.platform.com',
      'x-test-user-id': merchantAId,
    }, {
      registrationId,
      razorpayPaymentId: 'pay_test_dom_123',
      razorpayOrderId: 'order_test_dom_123',
      razorpaySignature: 'sig_test_123',
    });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.domain).toBe('royalattar.in');
    expect(confirmRes.body.registrationStatus).toBe('ACTIVE');
    expect(confirmRes.body.dnsConfigured).toBe(true);
    expect(confirmRes.body.sslActive).toBe(true);
    expect(confirmRes.body.storeLive).toBe(true);
  });

  it('Step 4: Live HTTPS request with new purchased domain reaches Store A immediately', async () => {
    const storeRes = await makeRequest('GET', '/api/store-info', {
      Host: 'royalattar.in',
    });

    expect(storeRes.status).toBe(200);
    expect(storeRes.body.storeId).toBe(storeAId);
    expect(storeRes.body.storeName).toBe('Store A Attar');
  });
});
