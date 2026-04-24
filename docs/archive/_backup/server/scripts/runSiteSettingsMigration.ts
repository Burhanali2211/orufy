import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sufi_essences',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting site settings migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/create-site-settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration SQL...');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify the tables were created
    console.log('🔍 Verifying tables...');
    const tables = ['site_settings', 'social_media_accounts', 'contact_information', 'business_hours', 'footer_links'];
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*) FROM ${table}`
      );
      console.log(`   ✓ ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n🎉 All done! Site settings tables created and seeded with sample data.');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Login to admin dashboard');
    console.log('   3. Navigate to Settings page');
    console.log('   4. Manage your site settings, social media, and contact info\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

