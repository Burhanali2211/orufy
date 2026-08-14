import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

async function main() {
  try {
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'NONE' NOT NULL;`);
    await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS transfer_status;`);
    await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_transfer_id;`);
    await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS transferred_amount;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_transfers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        razorpay_transfer_id text UNIQUE NOT NULL,
        linked_account_id text NOT NULL,
        amount_paise integer NOT NULL,
        transfer_status text DEFAULT 'PENDING' NOT NULL,
        settlement_status text,
        amount_reversed_paise integer DEFAULT 0 NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        razorpay_event_id text UNIQUE NOT NULL,
        event_type text NOT NULL,
        payload jsonb,
        processing_status text DEFAULT 'PENDING' NOT NULL,
        received_at timestamp with time zone DEFAULT now(),
        processed_at timestamp with time zone
      );
    `);

    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}
main();
