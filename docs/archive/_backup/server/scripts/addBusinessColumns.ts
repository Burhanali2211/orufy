import { query } from '../db/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function addBusinessColumns() {
  try {
    console.log('🔧 Adding business columns to profiles table...');

    // Add business columns if they don't exist
    await query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS business_name TEXT,
      ADD COLUMN IF NOT EXISTS business_address TEXT,
      ADD COLUMN IF NOT EXISTS business_phone TEXT,
      ADD COLUMN IF NOT EXISTS tax_id TEXT;
    `);

    console.log('✅ Business columns added successfully!');

    // Verify columns exist
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('business_name', 'business_address', 'business_phone', 'tax_id')
      ORDER BY column_name;
    `);

    console.log('📋 Verified columns:', result.rows.map(r => r.column_name).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding business columns:', error);
    process.exit(1);
  }
}

addBusinessColumns();

