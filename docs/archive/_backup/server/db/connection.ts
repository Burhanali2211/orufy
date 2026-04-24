import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

// Get __dirname equivalent in ES modules - handle serverless environments
let __dirname: string;
if (typeof import.meta !== 'undefined' && import.meta.url) {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // Fallback for serverless environments
  __dirname = process.cwd();
}

// Load environment variables from project root if not in serverless mode
const isServerless = process.env.IS_SERVERLESS === 'true';

if (!isServerless) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

/**
 * Optimized connection pool configuration
 *
 * Pool size recommendations:
 * - Development: 10 connections
 * - Production (small): 20 connections
 * - Production (medium): 50 connections
 * - Production (large): 100 connections
 *
 * Formula: connections = ((core_count * 2) + effective_spindle_count)
 * For cloud databases, use provider recommendations
 */

// Get optimal pool size based on environment
function getOptimalPoolSize(): number {
  if (process.env.DB_POOL_SIZE) {
    return parseInt(process.env.DB_POOL_SIZE);
  }

  // Default pool sizes by environment
  if (process.env.NODE_ENV === 'production') {
    return 50; // Production default
  } else if (process.env.NODE_ENV === 'test') {
    return 5; // Test environment
  } else {
    return 10; // Development default
  }
}

// Create connection pool
// Supports both Neon connection string and individual env vars
let pool: Pool;

const poolConfig = {

  max: isServerless ? 3 : getOptimalPoolSize(),
  min: 0,
  idleTimeoutMillis: isServerless ? 1000 : 10000,
  connectionTimeoutMillis: isServerless ? 30000 : 10000,
  allowExitOnIdle: true,
};

// Check for database URL (Supabase or other PostgreSQL services)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  logger.error('Missing DATABASE_URL environment variable');
  logger.error('Please set DATABASE_URL to your Supabase PostgreSQL connection string');
  logger.error('Format: postgresql://user:password@host:port/database');
  
  // Don't exit in serverless mode - allow app to be exported
  if (!process.env.IS_SERVERLESS) {
    process.exit(1);
  }
}

// Create pool with Supabase or other PostgreSQL connection string
pool = new Pool({
  ...poolConfig,
  connectionString: databaseUrl || '',
  ssl: { rejectUnauthorized: false },
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err, { context: 'Database' });
});

// Pool event monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    logger.debug('New client connected to pool', { context: 'Database' });
  });

  pool.on('acquire', () => {
    logger.debug('Client acquired from pool', { context: 'Database' });
  });

  pool.on('remove', () => {
    logger.debug('Client removed from pool', { context: 'Database' });
  });
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: getOptimalPoolSize(),
  };
}

/**
 * Log pool statistics (useful for debugging connection issues)
 */
export function logPoolStats() {
  const stats = getPoolStats();
  logger.info('Database pool statistics', {
    context: 'Database',
    data: {
      total: stats.total,
      idle: stats.idle,
      waiting: stats.waiting,
      max: stats.max,
      utilization: `${Math.round((stats.total / stats.max) * 100)}%`
    }
  });
}

/**
 * Initialize database connection and verify connectivity
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Attempting to connect to database...', { context: 'Database' });
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.success('Database connection successful', { context: 'Database', data: result.rows[0] });
  } catch (error) {
    logger.error('Database connection failed', error, { context: 'Database' });
    // Log additional connection info for debugging
    if (process.env.DATABASE_URL) {
      logger.debug('Using DATABASE_URL connection string', { context: 'Database' });
    } else {
      logger.debug('Using individual environment variables', { context: 'Database' });
      logger.debug(`Host: ${process.env.DB_HOST || 'localhost'}`, { context: 'Database' });
      logger.debug(`Database: ${process.env.DB_NAME || 'sufi_essences'}`, { context: 'Database' });
    }
    throw error;
  }
}

/**
 * Execute a query with connection pooling
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.query(text, duration);
    return result;
  } catch (error) {
    logger.error('Query error', error, { context: 'Database' });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };