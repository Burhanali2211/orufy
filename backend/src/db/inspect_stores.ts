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
    console.log('Adding missing columns to stores table in platform_db...');

    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug text;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url text;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;
      UPDATE stores SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
    `);

    console.log('Stores table updated successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
