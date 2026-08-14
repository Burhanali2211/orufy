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

describe('Orders PostgreSQL Direct RLS & Tenant Isolation', () => {
  let pool: Pool;
  let adminPool: Pool; // Superuser to setup test data

  const storeId1 = '00000000-0000-0000-0000-000000000001';
  const storeId2 = '00000000-0000-0000-0000-000000000002';
  
  const merchant1Id = '00000000-0000-0000-0000-111111111111';
  const customer1Id = '00000000-0000-0000-0000-222222222222';
  const customer2Id = '00000000-0000-0000-0000-333333333333';

  beforeAll(async () => {
    adminPool = new Pool(adminDbConfig);
    pool = new Pool(dbConfig); // Simulated platform_app connection

    // Clean up previous test data to prevent unique constraint failures
    await adminPool.query('DELETE FROM payment_transfers');
    await adminPool.query('DELETE FROM order_items');
    await adminPool.query('DELETE FROM orders');

    // Ensure users and stores exist
    await adminPool.query(`
      INSERT INTO profiles (id, email, full_name, is_active)
      VALUES 
        ($1, 'merchant@test.com', 'Test Merchant', true),
        ($2, 'customer@test.com', 'Test Customer', true),
        ($3, 'customer2@test.com', 'Test Customer 2', true)
      ON CONFLICT (id) DO NOTHING;
    `, [merchant1Id, customer1Id, customer2Id]);

    await adminPool.query(`
      INSERT INTO stores (id, name, hostname)
      VALUES 
        ($1, 'Store 1', 'store1.test.local'),
        ($2, 'Store 2', 'store2.test.local')
      ON CONFLICT (id) DO NOTHING;
    `, [storeId1, storeId2]);

    await adminPool.query(`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES ($1, $2, 'owner')
      ON CONFLICT DO NOTHING;
    `, [storeId1, merchant1Id]);

    // Insert mock products
    await adminPool.query(`
      INSERT INTO products (id, store_id, name, price, stock)
      VALUES 
        ('00000000-1111-0000-0000-000000000001', $1, 'Product 1', 100, 10),
        ('00000000-2222-0000-0000-000000000001', $2, 'Product 2', 200, 10)
      ON CONFLICT (id) DO NOTHING;
    `, [storeId1, storeId2]);
  });

  afterAll(async () => {
    await adminPool.end();
    await pool.end();
  });

  it('Store A customer: SELECT own Store A order -> ALLOW', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [customer1Id]);

      // Insert Order
      const resOrder = await client.query(`
        INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
        VALUES ($1, $2, 'TEST-ORD-1', 100, 100, '{}', '{}')
        RETURNING id;
      `, [storeId1, customer1Id]);
      
      const orderId = resOrder.rows[0].id;

      // View Order
      const resView = await client.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      expect(resView.rows.length).toBe(1);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Store A customer: SELECT another customer order in Store A -> DENY', async () => {
    const adminClient = await adminPool.connect();
    let orderId = '';
    try {
      const res = await adminClient.query(`
        INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
        VALUES ($1, $2, 'TEST-ORD-2', 100, 100, '{}', '{}')
        RETURNING id;
      `, [storeId1, customer2Id]);
      orderId = res.rows[0].id;
    } finally {
      adminClient.release();
    }

    // Now test as Customer 1
    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      await testClient.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await testClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [customer1Id]);

      const resView = await testClient.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      expect(resView.rows.length).toBe(0); // Invisible

      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  });

  it('Store A customer: SELECT and UPDATE Store B order -> DENY', async () => {
    const adminClient = await adminPool.connect();
    let storeBOrderId = '';
    try {
      const res = await adminClient.query(`
        INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
        VALUES ($1, $2, 'TEST-ORD-STORE-B', 200, 200, '{}', '{}')
        RETURNING id;
      `, [storeId2, customer1Id]);
      storeBOrderId = res.rows[0].id;
    } finally {
      adminClient.release();
    }

    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      // Set context to Store 1
      await testClient.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await testClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [customer1Id]);

      // Attempt SELECT
      const resView = await testClient.query(`SELECT * FROM orders WHERE id = $1`, [storeBOrderId]);
      expect(resView.rows.length).toBe(0);

      // Attempt UPDATE
      const resUpdate = await testClient.query(`UPDATE orders SET notes = 'hacked' WHERE id = $1`, [storeBOrderId]);
      expect(resUpdate.rowCount).toBe(0);

      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  });

  it('Store A merchant: SELECT Store A orders -> ALLOW', async () => {
    const adminClient = await adminPool.connect(); 
    let orderId = '';
    try {
      const res = await adminClient.query(`
        INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
        VALUES ($1, $2, 'TEST-ORD-3', 100, 100, '{}', '{}')
        RETURNING id;
      `, [storeId1, customer1Id]);
      orderId = res.rows[0].id;
    } finally {
      adminClient.release();
    }

    // Now test as Merchant 1 for Store 1
    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      await testClient.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await testClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      const resView = await testClient.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      expect(resView.rows.length).toBe(1); // Visible

      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  });

  it('Store A merchant: SELECT, UPDATE, DELETE Store B orders -> DENY', async () => {
    const adminClient = await adminPool.connect(); 
    let storeBOrderId = '';
    try {
      const res = await adminClient.query(`
        INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
        VALUES ($1, $2, 'TEST-ORD-4', 100, 100, '{}', '{}')
        RETURNING id;
      `, [storeId2, customer1Id]); // Order belongs to Store 2
      storeBOrderId = res.rows[0].id;
    } finally {
      adminClient.release();
    }

    // Test as Merchant 1 trying to access Store 2
    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      await testClient.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId2]);
      await testClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [merchant1Id]);

      // SELECT denied
      const resView = await testClient.query(`SELECT * FROM orders WHERE id = $1`, [storeBOrderId]);
      expect(resView.rows.length).toBe(0);

      // UPDATE denied
      const resUpdate = await testClient.query(`UPDATE orders SET status = 'CANCELLED' WHERE id = $1`, [storeBOrderId]);
      expect(resUpdate.rowCount).toBe(0);

      // DELETE denied
      const resDelete = await testClient.query(`DELETE FROM orders WHERE id = $1`, [storeBOrderId]);
      expect(resDelete.rowCount).toBe(0);

      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  });

  it('Cross-store INSERT with mismatched store_id is rejected by RLS WITH CHECK', async () => {
    const testClient = await pool.connect();
    try {
      await testClient.query('BEGIN');
      // Set session to Store 1
      await testClient.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId1]);
      await testClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [customer1Id]);

      // Attempt to INSERT order with store_id = Store 2
      let threwError = false;
      try {
        await testClient.query(`
          INSERT INTO orders (store_id, user_id, order_number, total_amount, subtotal, shipping_address, billing_address)
          VALUES ($1, $2, 'TEST-ORD-FORGE', 100, 100, '{}', '{}')
        `, [storeId2, customer1Id]);
      } catch (err: any) {
        threwError = true;
        expect(err.message).toMatch(/row-level security policy|violates/i);
      }
      expect(threwError).toBe(true);

      await testClient.query('ROLLBACK');
    } finally {
      testClient.release();
    }
  });
});
