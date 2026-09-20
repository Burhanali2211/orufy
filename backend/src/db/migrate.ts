import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db.js';
import path from 'path';
import fs from 'fs';

export async function runMigrations(): Promise<void> {
  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    if (fs.existsSync(migrationsFolder) && fs.existsSync(path.join(migrationsFolder, 'meta', '_journal.json'))) {
      console.info(`📦 Checking and applying database schema migrations from ${migrationsFolder}...`);
      await migrate(db, {
        migrationsFolder,
        migrationsTable: '__drizzle_migrations',
      });
      console.info('✅ Database schema migrations applied successfully.');
    }

    const rlsFile = path.resolve(__dirname, 'apply-rls.sql');
    if (fs.existsSync(rlsFile)) {
      console.info('🔒 Applying Row Level Security (RLS) policies and functions...');
      const sqlContent = fs.readFileSync(rlsFile, 'utf8');
      const { pool } = await import('./db.js');
      await pool.query(sqlContent);
      console.info('✅ RLS policies and functions applied successfully.');
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.warn('⚠️ Notice during automatic database migration check:', err?.message || err);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.info('✅ Migration process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
