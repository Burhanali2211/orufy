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
    console.log('Connected to PostgreSQL database');

    console.log('1. Updating products reserved_stock...');
    await client.query(`
      UPDATE products SET reserved_stock = 0 WHERE reserved_stock IS NULL OR reserved_stock < 0;
      UPDATE products SET reserved_stock = stock WHERE reserved_stock > stock;
    `);

    console.log('2. Adding check constraints on products...');
    await client.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_reserved_stock_non_negative;
      ALTER TABLE products ADD CONSTRAINT chk_products_reserved_stock_non_negative CHECK (reserved_stock >= 0);
      ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_reserved_stock_le_stock;
      ALTER TABLE products ADD CONSTRAINT chk_products_reserved_stock_le_stock CHECK (reserved_stock <= stock);
    `);

    console.log('3. Updating orders table for guest checkout...');
    await client.query(`
      ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email text;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone text;
    `);

    console.log('4. Adding tax_rate_percent to stores...');
    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS tax_rate_percent integer DEFAULT 18 NOT NULL;
    `);

    console.log('5. Updating checkout_idempotency unique constraint...');
    await client.query(`
      ALTER TABLE checkout_idempotency DROP CONSTRAINT IF EXISTS checkout_idempotency_idempotency_key_key;
      ALTER TABLE checkout_idempotency DROP CONSTRAINT IF EXISTS checkout_idempotency_store_id_idempotency_key_key;
      ALTER TABLE checkout_idempotency ADD CONSTRAINT checkout_idempotency_store_id_idempotency_key_key UNIQUE (store_id, idempotency_key);
    `);

    console.log('6. Granting permissions...');
    await client.query(`
      GRANT ALL ON ALL TABLES IN SCHEMA public TO platform_app;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO platform_app;
    `);

    console.log('All migrations executed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
