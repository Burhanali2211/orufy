import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../db/connection';
import { initializeSchema, seedDatabase } from '../db/init';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  try {
    console.log('🚀 Starting database initialization...\n');

    // Step 1: Initialize connection
    console.log('1️⃣  Initializing database connection...');
    await initializeDatabase();
    console.log('✓ Database connection successful\n');

    // Step 2: Initialize schema
    console.log('2️⃣  Creating database schema...');
    await initializeSchema();
    console.log('✓ Schema created successfully\n');

    // Step 3: Seed database (optional)
    console.log('3️⃣  Seeding database with sample data...');
    await seedDatabase();
    console.log('✓ Database seeded successfully\n');

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();

