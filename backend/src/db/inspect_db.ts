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
    console.log('Inspecting columns on custom_domains and stores...');

    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `);

    console.log('Existing columns:', res.rows);

    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS razorpay_linked_account_id text UNIQUE;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_onboarding_status text DEFAULT 'NOT_STARTED' NOT NULL;
      
      ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'PENDING_VERIFICATION' NOT NULL;
      ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS ssl_status text DEFAULT 'PENDING' NOT NULL;
      ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS verification_token text DEFAULT '' NOT NULL;
      ALTER TABLE custom_domains ADD COLUMN IF NOT EXISTS dns_records jsonb;

      GRANT ALL ON ALL TABLES IN SCHEMA public TO platform_app;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO platform_app;
    `);

    console.log('Updated columns successfully.');
  } catch (err) {
    console.error('Inspection/Update error:', err);
  } finally {
    await client.end();
  }
}

run();
