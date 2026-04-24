import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './connection';
import { isTableEmpty } from './utils';
import { logger } from '../utils/logger';

// Get __dirname - handle both ES modules and serverless environments
let __dirname: string;
if (typeof import.meta !== 'undefined' && import.meta.url) {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // Fallback for serverless environments where import.meta.url is undefined
  __dirname = process.cwd();
}

/**
 * Initialize database schema
 */
export async function initializeSchema(): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    logger.info(`Executing ${statements.length} schema statements...`, { context: 'Database' });

    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          logger.error('Schema error: ' + error.message, error, { context: 'Database' });
          throw error;
        }
      }
    }

    // Run migrations for existing databases
    await runMigrations();

    logger.success('Database schema initialized successfully', { context: 'Database' });
  } catch (error) {
    logger.error('Failed to initialize schema', error, { context: 'Database' });
    throw error;
  }
}

/**
 * Run SQL migrations for existing databases
 */
async function runMigrations(): Promise<void> {
  try {
    const migrationsPath = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      logger.info('No migrations directory found', { context: 'Database' });
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .sort();

    logger.info(`Running ${migrationFiles.length} SQL migrations...`, { context: 'Database' });

    for (const file of migrationFiles) {
      try {
        const migrationPath = path.join(migrationsPath, file);
        const migration = fs.readFileSync(migrationPath, 'utf-8');
        
        // Split migration into individual statements, respecting $$ blocks
        const statements = splitSqlStatements(migration);

        for (const statement of statements) {
          try {
            await query(statement);
          } catch (error: any) {
            // Ignore common migration errors (column already exists, constraint already exists, etc.)
            const ignoredErrors = [
              'already exists',
              'does not exist',
              'duplicate key',
              'column already exists'
            ];
            
            const isIgnored = ignoredErrors.some(msg => 
              error.message.toLowerCase().includes(msg.toLowerCase())
            );
            
            if (!isIgnored) {
              logger.warn(`Migration warning in ${file}: ${error.message}`, { context: 'Database' });
            }
          }
        }
        
        logger.info(`Applied migration: ${file}`, { context: 'Database' });
      } catch (error: any) {
        logger.warn(`Migration file error ${file}: ${error.message}`, { context: 'Database' });
      }
    }
  } catch (error) {
    logger.warn('Migration runner encountered an error, continuing...', { context: 'Database' });
  }
}

/**
 * Split SQL into statements, respecting $$ blocks (PL/pgSQL)
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarBlock = false;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comment-only lines
    if (trimmedLine.startsWith('--') && !inDollarBlock) {
      continue;
    }
    
    current += line + '\n';
    
    // Check for $$ delimiters
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      for (const _ of dollarMatches) {
        inDollarBlock = !inDollarBlock;
      }
    }
    
    // If we're not in a $$ block and line ends with ;, it's end of statement
    if (!inDollarBlock && trimmedLine.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  // Handle any remaining content
  if (current.trim().length > 0 && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }
  
  return statements;
}

/**
 * Seed database with comprehensive sample data
 */
export async function seedDatabase(): Promise<void> {
  try {
    // Check if database is empty by checking if the profiles table is empty
    const isEmpty = await isTableEmpty('profiles');
    if (!isEmpty) {
      logger.info('Database already contains data, skipping seed', { context: 'Database' });
      return;
    }

    logger.info('Seeding database with comprehensive sample data...', { context: 'Database' });

    // Add sample categories
    await query(`
      INSERT INTO public.categories (name, slug, description, sort_order, is_active)
      VALUES 
        ('Perfumes', 'perfumes', 'Premium perfumes collection', 1, true),
        ('Colognes', 'colognes', 'Fresh colognes', 2, true),
        ('Fragrances', 'fragrances', 'Luxury fragrances', 3, true),
        ('Limited Edition', 'limited-edition', 'Exclusive limited edition scents', 4, true),
        ('Seasonal', 'seasonal', 'Scents for every season', 5, true)
      ON CONFLICT (slug) DO NOTHING
    `);

    // Add sample products
    await query(`
      INSERT INTO public.products (name, slug, description, short_description, price, original_price, stock, sku, is_active, is_featured, show_on_homepage, rating, review_count)
      VALUES 
        ('Midnight Oud', 'midnight-oud', 'A luxurious oud fragrance with hints of rose and amber', 'Luxurious oud fragrance', 120.00, 150.00, 50, 'PERF-MIDNIGHT-OUD', true, true, true, 4.8, 12),
        ('Citrus Burst', 'citrus-burst', 'Refreshing citrus blend with lemon, lime, and bergamot', 'Refreshing citrus blend', 85.00, 100.00, 30, 'COL-CITRUS-BURST', true, true, true, 4.5, 8),
        ('Ocean Mist', 'ocean-mist', 'Marine scent with sea salt and driftwood notes', 'Marine scent with sea salt', 95.00, 110.00, 25, 'FRAG-OCEAN-MIST', true, false, true, 4.3, 5),
        ('Vanilla Dream', 'vanilla-dream', 'Sweet vanilla with caramel and tonka bean', 'Sweet vanilla fragrance', 75.00, 85.00, 40, 'PERF-VANILLA-DREAM', true, true, true, 4.7, 15),
        ('Spice Route', 'spice-route', 'Warm spices including cinnamon, cardamom, and clove', 'Warm spicy fragrance', 110.00, 130.00, 20, 'COL-SPICE-ROUTE', true, false, true, 4.6, 9)
      ON CONFLICT (slug) DO NOTHING
    `);

    // SECURITY: Test accounts are NOT created by default in production
    // Use the createAdmin script to create admin accounts with secure passwords
    // Only create test accounts in development environment
    if (process.env.NODE_ENV === 'development' && process.env.CREATE_TEST_USERS === 'true') {
      await query(`
        INSERT INTO public.profiles (email, password_hash, full_name, role, is_active, email_verified)
        VALUES
          ('admin@example.com', '$2b$10$9R13Gw7iBHH12EOSvsV8GuUBT/I3.JlaXmk35rQk6anp.zXSyhj5e', 'Admin User', 'admin', true, true),
          ('seller@example.com', '$2b$10$n1YqZmfP5LxLhJVdDNRYVe/jlM0SbyBP71vS2YTC3b/MV/AMIGzjW', 'Seller User', 'seller', true, true),
          ('customer@example.com', '$2b$10$0ugxaAk7okuyiV6FHjFkp.eqNsfvpX/u.FSgtkfu5er2t0GuPKVy2', 'Customer User', 'customer', true, true)
        ON CONFLICT (email) DO NOTHING
      `);
    }

    logger.success('Database seeded successfully with sample data', { context: 'Database' });
  } catch (error) {
    logger.error('Failed to seed database', error, { context: 'Database' });
    throw error;
  }
}