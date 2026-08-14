import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const { Client } = pg;

// We connect as platform_app to test RLS isolation directly at the database layer.
// This proves the database itself enforces the boundaries, preventing leakage even if the backend is flawed.
const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'platform_db',
  user: 'platform_app',
  password: 'password',
};

describe('PostgreSQL RLS Direct Test (platform_app)', () => {
  let client: pg.Client;
  let adminUserId = '11111111-1111-1111-1111-111111111111';
  let userAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  let userBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  let storeAId = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
  let storeBId = 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb';

  beforeAll(async () => {
    // Setup initial data using superuser or platform_app (if it has permissions to bypass RLS initially by not setting context)
    // Wait, platform_app does NOT have BYPASSRLS. So if we don't set context, we can't see/insert anything!
    // Actually, we must use a superuser to seed the test data if RLS is enabled and strictly scoped.
    const suClient = new Client({ ...dbConfig, user: 'postgres', password: 'password' });
    await suClient.connect();

    // Clean up
    await suClient.query('DELETE FROM store_members WHERE user_id IN ($1, $2, $3)', [userAId, userBId, adminUserId]);
    await suClient.query('DELETE FROM products WHERE store_id IN ($1, $2)', [storeAId, storeBId]);
    await suClient.query('DELETE FROM stores WHERE id IN ($1, $2)', [storeAId, storeBId]);
    await suClient.query('DELETE FROM profiles WHERE id IN ($1, $2, $3)', [userAId, userBId, adminUserId]);

    // Insert Users
    await suClient.query(`INSERT INTO profiles (id, role, full_name, email) VALUES ($1, 'customer', 'User A', 'usera@test.com'), ($2, 'customer', 'User B', 'userb@test.com'), ($3, 'admin', 'Admin', 'admin@test.com')`, [userAId, userBId, adminUserId]);
    
    // Insert Stores
    await suClient.query(`INSERT INTO stores (id, name, hostname) VALUES ($1, 'Store A', 'store-a.local'), ($2, 'Store B', 'store-b.local')`, [storeAId, storeBId]);
    
    // Insert Memberships: User A owns Store A, User B is seller in Store A. No one owns Store B yet (for isolation test).
    await suClient.query(`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`, [storeAId, userAId]);
    await suClient.query(`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'seller')`, [storeAId, userBId]);
    await suClient.query(`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`, [storeBId, adminUserId]); // Just to have an owner

    // Insert Products
    await suClient.query(`INSERT INTO products (id, store_id, name, price, stock) VALUES ('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', $1, 'Product A1', 10, 100)`, [storeAId]);
    await suClient.query(`INSERT INTO products (id, store_id, name, price, stock) VALUES ('bbbbbbbb-4444-4444-4444-bbbbbbbbbbbb', $1, 'Product B1', 20, 100)`, [storeBId]);

    await suClient.end();

    // Now connect as the restricted platform_app for tests
    client = new Client(dbConfig);
    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });

  const setContext = async (userId: string, storeId: string) => {
    await client.query(`SELECT set_config('app.current_user_id', $1::text, false)`, [userId]);
    await client.query(`SELECT set_config('app.current_store_id', $1::text, false)`, [storeId]);
  };

  it('verifies platform_app cannot bypass RLS', async () => {
    const res = await client.query(`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'platform_app'`);
    expect(res.rows[0].rolsuper).toBe(false);
    expect(res.rows[0].rolbypassrls).toBe(false);
  });

  it('Owner of Store A can read Store A products', async () => {
    await setContext(userAId, storeAId);
    const res = await client.query('SELECT * FROM products WHERE store_id = $1', [storeAId]);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.rows[0].name).toBe('Product A1');
  });

  it('Owner of Store A cannot read Store B products', async () => {
    await setContext(userAId, storeAId);
    const res = await client.query('SELECT * FROM products WHERE store_id = $1', [storeBId]);
    expect(res.rows.length).toBe(0);
  });

  it('Owner of Store A cannot insert product into Store B', async () => {
    await setContext(userAId, storeBId); // They try to set their context to Store B
    try {
      await client.query(`INSERT INTO products (id, store_id, name, price, stock) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', $1, 'Evil', 10, 10)`, [storeBId]);
      throw new Error('Should have failed');
    } catch (err: any) {
      expect(err.message).toContain('new row violates row-level security policy');
    }
  });

  it('Owner of Store A cannot update Store B products', async () => {
    await setContext(userAId, storeBId);
    
    // Debug: check is_store_merchant()
    const debugRes = await client.query('SELECT public.is_store_merchant() as is_merchant, public.app_user_id() as uid, public.app_store_id() as sid');
    console.log('DEBUG UPDATE:', debugRes.rows[0]);

    const res = await client.query(`UPDATE products SET name = 'Hacked' WHERE store_id = $1`, [storeBId]);
    // UPDATE returns rowCount = 0 if RLS blocks it (it doesn't throw, it just filters out the row from the UPDATE scan)
    expect(res.rowCount).toBe(0);
  });

  it('Owner of Store A cannot delete Store B products', async () => {
    await setContext(userAId, storeBId);
    const res = await client.query(`DELETE FROM products WHERE store_id = $1`, [storeBId]);
    expect(res.rowCount).toBe(0);
  });

  // 1. Owner cannot manufacture another owner membership
  it('Owner of Store A cannot manufacture an owner membership for Store B', async () => {
    await setContext(userAId, storeBId); // Try context as Store B
    try {
      await client.query(`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`, [storeBId, userAId]);
      throw new Error('Should have failed');
    } catch (err: any) {
      expect(err.message).toContain('new row violates row-level security policy');
    }
  });

  // 2. Seller escalation
  it('Seller in Store A cannot escalate own role to owner', async () => {
    await setContext(userBId, storeAId); // User B is seller in Store A
    const res = await client.query(`UPDATE store_members SET role = 'owner' WHERE store_id = $1 AND user_id = $2`, [storeAId, userBId]);
    // The policy "Merchants can update members" uses is_store_merchant(), but wait! 
    // is_store_merchant() checks if user is ('owner', 'admin', 'seller', 'staff').
    // If a seller is a merchant, the UPDATE policy allows them to update! 
    // We need to ensure that the RLS policy for store_members prevents sellers from modifying roles, 
    // or restricts it to 'owner'/'admin'.
    // Let's assert what currently happens.
    // Wait, the user specifically requested: "Seller escalation... Expected: DENIED".
    // If our current RLS policy allows it, this test will fail and I'll need to fix the RLS policy!
    // I'll leave the test to assert it fails. If it doesn't, I must fix the SQL policy.
    expect(res.rowCount).toBe(0);
  });

  // 3. Cross-store membership manipulation
  it('Owner of Store A cannot modify Store B membership', async () => {
    await setContext(userAId, storeBId);
    const res = await client.query(`UPDATE store_members SET role = 'admin' WHERE store_id = $1 AND user_id = $2`, [storeBId, adminUserId]);
    expect(res.rowCount).toBe(0);
  });
});

