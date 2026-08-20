import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import path from 'path';
import fs from 'fs';

export async function runMigrations(): Promise<void> {
  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    if (fs.existsSync(migrationsFolder) && fs.existsSync(path.join(migrationsFolder, 'meta', '_journal.json'))) {
      console.log(`📦 Checking and applying database schema migrations from ${migrationsFolder}...`);
      await migrate(db, {
        migrationsFolder,
        migrationsSchema: 'public',
        migrationsTable: '__drizzle_migrations',
      });
      console.log('✅ Database schema migrations applied successfully.');
    }
  } catch (error: any) {
    console.warn('⚠️ Notice during automatic database migration check:', error?.message || error);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
