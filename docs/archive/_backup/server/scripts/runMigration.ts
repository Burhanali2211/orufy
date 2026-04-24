import { initializeDatabase } from '../db/connection';
import { up as addPreferredLanguageColumn } from '../db/migrations/001_add_preferred_language_column';

/**
 * Script to run the preferred_language column migration
 */
async function runMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await initializeDatabase();
    
    console.log('🔄 Running migration to add preferred_language column...');
    await addPreferredLanguageColumn();
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();