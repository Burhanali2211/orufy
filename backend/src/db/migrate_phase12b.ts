import { Client } from 'pg';

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'platform_db',
    user: 'postgres',
    password: 'password',
  });

  try {
    await client.connect();
    console.log('Running Phase 12B schema migrations with superuser...');

    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock integer DEFAULT 0 NOT NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status text DEFAULT 'UNFULFILLED' NOT NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier text;

      CREATE TABLE IF NOT EXISTS inventory_reservations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity integer DEFAULT 1 NOT NULL,
        status text DEFAULT 'RESERVED' NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS checkout_idempotency (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        idempotency_key text NOT NULL UNIQUE,
        store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
        order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
        response_payload jsonb,
        created_at timestamptz DEFAULT now()
      );

      -- Grant permissions to platform_app role
      GRANT ALL ON ALL TABLES IN SCHEMA public TO platform_app;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO platform_app;
    `);

    console.log('Phase 12B schema migrations applied successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
