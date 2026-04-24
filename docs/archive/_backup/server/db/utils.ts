import { query } from './connection';

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = $1
       )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Check if a table is empty
 */
export async function isTableEmpty(tableName: string): Promise<boolean> {
  try {
    const result = await query(`SELECT COUNT(*) FROM ${tableName}`);
    return result.rows[0].count === '0';
  } catch (error) {
    // If table doesn't exist or query fails, consider it empty
    return true;
  }
}

/**
 * Check if the database has been initialized by checking for essential tables
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Check if essential tables exist
    const essentialTables = ['profiles', 'categories', 'products'];
    for (const table of essentialTables) {
      const exists = await tableExists(table);
      if (!exists) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking database initialization status:', error);
    return false;
  }
}