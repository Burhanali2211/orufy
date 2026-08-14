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

describe('Domain Registrations PostgreSQL Direct RLS & Tenant Isolation', () => {
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

    // Clean up previous test registrations
    await adminPool.query('DELETE FROM domain_registrations');

    // Ensure profiles and stores exist
    await adminPool.query(`
      INSERT INTO profiles (id, email, full_name, is_active)
      VALUES 
        ($1, 'merchantA_reg@test.com', 'Merchant A', true),
        ($2, 'merchantB_reg@test.com', 'Merchant B', true),
        ($3, 'customer_reg@test.com', 'Customer', true)
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

    // Seed test domain registrations via admin
    await adminPool.query(`
      INSERT INTO domain_registrations (id, store_id, domain_name, provider, purchase_price_paise, registration_status)
      VALUES 
        ('00000000-0000-0000-0000-000000000001', $1, 'store1-purchased.in', 'HOSTINGER', 89900, 'ACTIVE'),
        ('00000000-0000-0000-0000-000000000002', $2, 'store2-purchased.shop', 'HOSTINGER', 129900, 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `, [storeId1, storeId2]);
  });

  afterAll(async () => {
    await adminPool.end();
    await pool.end();
  });

  it('Store A merchant: SELECT domain registrations for Store A -> ALLOW', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query('SELECT * FROM domain_registrations');
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].domain_name).toBe('store1-purchased.in');

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: SELECT Store B domain registrations -> DENY (0 rows returned)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query('SELECT * FROM domain_registrations WHERE domain_name = $1', ['store2-purchased.shop']);
      expect(res.rows.length).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: UPDATE Store B domain registration -> DENY (0 rows affected)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query(`
        UPDATE domain_registrations SET auto_renew = false WHERE domain_name = $1
      `, ['store2-purchased.shop']);
      expect(res.rowCount).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A merchant: DELETE Store B domain registration -> DENY (0 rows affected)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const res = await client.query(`
        DELETE FROM domain_registrations WHERE domain_name = $1
      `, ['store2-purchased.shop']);
      expect(res.rowCount).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Customer: SELECT domain registrations -> DENY (0 rows returned)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [customerId]);

      const res = await client.query('SELECT * FROM domain_registrations');
      expect(res.rows.length).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Cross-tenant INSERT with mismatched store_id is rejected by RLS WITH CHECK', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      let threwError = false;
      try {
        await client.query(`
          INSERT INTO domain_registrations (store_id, domain_name, purchase_price_paise)
          VALUES ($1, 'forged-store2-domain.in', 89900)
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
