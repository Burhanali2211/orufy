import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'platform_db',
  user: 'platform_app',
  password: 'password',
};

const adminDbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'platform_db',
  user: 'postgres',
  password: 'password',
};

describe('Custom Domains PostgreSQL Direct RLS & Tenant Isolation', () => {
  let pool: Pool;
  let adminPool: Pool;

  const storeId1 = '00000000-0000-0000-0000-000000000001';
  const storeId2 = '00000000-0000-0000-0000-000000000002';

  const merchant1Id = '00000000-0000-0000-0000-111111111111';
  const merchant2Id = '00000000-0000-0000-0000-222222222222';
  const customerId = '00000000-0000-0000-0000-333333333333';

  beforeAll(async () => {
    adminPool = new Pool(adminDbConfig);
    pool = new Pool(dbConfig); // platform_app non-superuser connection

    // Clean up previous test domains
    await adminPool.query('DELETE FROM custom_domains');

    // Ensure profiles and stores exist
    await adminPool.query(`
      INSERT INTO profiles (id, email, full_name, is_active)
      VALUES 
        ($1, 'merchantA@test.com', 'Merchant A', true),
        ($2, 'merchantB@test.com', 'Merchant B', true),
        ($3, 'customer@test.com', 'Customer', true)
      ON CONFLICT (id) DO NOTHING;
    `, [merchant1Id, merchant2Id, customerId]);

    await adminPool.query(`
      INSERT INTO stores (id, name, hostname)
      VALUES 
        ($1, 'Store 1', 'store1.platform.local'),
        ($2, 'Store 2', 'store2.platform.local')
      ON CONFLICT (id) DO NOTHING;
    `, [storeId1, storeId2]);

    await adminPool.query(`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES 
        ($1, $2, 'owner'),
        ($3, $4, 'owner')
      ON CONFLICT DO NOTHING;
    `, [storeId1, merchant1Id, storeId2, merchant2Id]);

    // Seed test custom domains via admin
    await adminPool.query(`
      INSERT INTO custom_domains (id, store_id, hostname, verification_token, verification_status, ssl_status)
      VALUES 
        ('00000000-dddd-0000-0000-000000000001', $1, 'store1-brand.com', 'tok1', 'VERIFIED', 'ACTIVE'),
        ('00000000-dddd-0000-0000-000000000002', $2, 'store2-brand.com', 'tok2', 'VERIFIED', 'ACTIVE')
      ON CONFLICT (hostname) DO NOTHING;
    `, [storeId1, storeId2]);
  });

  afterAll(async () => {
    await adminPool.end();
    await pool.end();
  });

  it('Store A merchant: SELECT custom domains for Store A -> ALLOW', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query('SELECT * FROM custom_domains');
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].hostname).toBe('store1-brand.com');

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: SELECT Store B custom domains -> DENY', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Merchant 1 context for Store 1
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      // Query by ID for Store B domain
      const res = await client.query('SELECT * FROM custom_domains WHERE hostname = $1', ['store2-brand.com']);
      expect(res.rows.length).toBe(0); // Blocked by RLS

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: UPDATE Store B custom domain -> DENY (0 rows affected)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query(`
        UPDATE custom_domains SET verification_status = 'SUSPENDED' WHERE hostname = $1
      `, ['store2-brand.com']);
      expect(res.rowCount).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: DELETE Store B custom domain -> DENY (0 rows affected)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query(`
        DELETE FROM custom_domains WHERE hostname = $1
      `, ['store2-brand.com']);
      expect(res.rowCount).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Customer: SELECT custom domains -> DENY (0 rows returned)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [customerId]);

      const res = await client.query('SELECT * FROM custom_domains');
      expect(res.rows.length).toBe(0); // Customers have no merchant access to domain management

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Cross-tenant INSERT with mismatched store_id is rejected by RLS WITH CHECK', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set session to Store 1
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      let threwError = false;
      try {
        // Attempt to insert domain for Store 2 while session is Store 1
        await client.query(`
          INSERT INTO custom_domains (store_id, hostname, verification_token)
          VALUES ($1, 'forged-store2-domain.com', 'tok_forge')
        `, [storeId2]);
      } catch (err: any) {
        threwError = true;
        expect(err.message).toMatch(/row-level security policy|violates/i);
      }
      expect(threwError).toBe(true);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
