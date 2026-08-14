import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { Pool } from 'pg';
import { storeResolver, requireStore } from '../backend/src/middleware/storeResolver';

const adminDbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'platform_db',
  user: 'postgres',
  password: 'password',
};

describe('E2E Live HTTPS / Custom Domain Routing Suite', () => {
  let adminPool: Pool;
  let server: http.Server;
  let port: number;

  const storeAId = '00000000-0000-0000-0000-000000000001';
  const storeBId = '00000000-0000-0000-0000-000000000002';

  function makeRequest(path: string, hostHeader: string, extraHeaders: Record<string, string> = {}): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: 'GET',
        headers: {
          Host: hostHeader,
          ...extraHeaders
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const body = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  beforeAll(async () => {
    adminPool = new Pool(adminDbConfig);

    // Seed test stores and custom domains in database
    await adminPool.query('DELETE FROM custom_domains');

    await adminPool.query(`
      INSERT INTO stores (id, name, hostname)
      VALUES 
        ($1, 'Merchant Store A', 'store-a.platform.local'),
        ($2, 'Merchant Store B', 'store-b.platform.local')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, hostname = EXCLUDED.hostname;
    `, [storeAId, storeBId]);

    // Store A has active custom domain 'perfume-boutique.com'
    // Store B has active custom domain 'luxury-scents.com'
    // Store A has pending domain 'pending-store.com'
    await adminPool.query(`
      INSERT INTO custom_domains (id, store_id, hostname, domain_type, verification_token, verification_status, ssl_status, is_primary)
      VALUES 
        ('00000000-aaaa-0000-0000-000000000001', $1, 'perfume-boutique.com', 'apex', 'tokA', 'VERIFIED', 'ACTIVE', true),
        ('00000000-aaaa-0000-0000-000000000002', $1, 'pending-store.com', 'apex', 'tokPending', 'PENDING_VERIFICATION', 'PENDING', false),
        ('00000000-bbbb-0000-0000-000000000001', $2, 'luxury-scents.com', 'apex', 'tokB', 'VERIFIED', 'ACTIVE', true)
      ON CONFLICT (hostname) DO UPDATE SET verification_status = EXCLUDED.verification_status, ssl_status = EXCLUDED.ssl_status;
    `, [storeAId, storeBId]);

    // Create live express test application
    const app = express();
    app.use(express.json());
    app.use(storeResolver);

    app.get('/api/store-info', requireStore, (req, res) => {
      res.json({
        storeId: res.locals.storeId,
        storeName: res.locals.store.name,
        hostname: res.locals.store.hostname,
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

  it('1. Live HTTPS/Host Request to Store A custom domain resolves Store A context', async () => {
    const res = await makeRequest('/api/store-info', 'perfume-boutique.com');
    expect(res.status).toBe(200);
    expect(res.body.storeId).toBe(storeAId);
    expect(res.body.storeName).toBe('Merchant Store A');
  });

  it('2. Live HTTPS/Host Request to Store B custom domain resolves Store B context', async () => {
    const res = await makeRequest('/api/store-info', 'luxury-scents.com');
    expect(res.status).toBe(200);
    expect(res.body.storeId).toBe(storeBId);
    expect(res.body.storeName).toBe('Merchant Store B');
  });

  it('3. Live Request to Unverified / Pending custom domain fails closed (404)', async () => {
    const res = await makeRequest('/api/store-info', 'pending-store.com');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STORE_NOT_FOUND');
  });

  it('4. Live Request to Unknown domain fails closed (404)', async () => {
    const res = await makeRequest('/api/store-info', 'unregistered-domain.com');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('STORE_NOT_FOUND');
  });

  it('5. Live Request with Host Spoofing headers is ignored (resolves canonical Host header only)', async () => {
    const res = await makeRequest('/api/store-info', 'perfume-boutique.com', {
      'X-Store-ID': storeBId,
      'X-Store-Host': 'luxury-scents.com',
      'X-Tenant-ID': storeBId,
      'X-Forwarded-Host': 'luxury-scents.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.storeId).toBe(storeAId); // MUST resolve Store A, ignoring spoofed headers
    expect(res.body.storeName).toBe('Merchant Store A');
  });
});
