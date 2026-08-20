import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.APP_DATABASE_URL || process.env.DATABASE_URL || 'postgres://platform_app:password@localhost:5433/platform_db',
});

export const db = drizzle(pool, { schema });
