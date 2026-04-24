#!/usr/bin/env node
/**
 * Export Local PostgreSQL Database
 * 
 * This script exports all tables and data from your local PostgreSQL database
 * to a SQL file that can be used for backup or migration.
 * 
 * Usage:
 *   node scripts/export-local-db.js
 * 
 * Make sure your .env file has local database credentials:
 *   DB_HOST=localhost
 *   DB_PORT=5432
 *   DB_NAME=sufi_essences
 *   DB_USER=postgres
 *   DB_PASSWORD=your_password
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get local database connection
const localDbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sufi_essences',
  ssl: false,
};

if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD environment variable is not set!');
  console.error('');
  console.error('Please set your local database password in .env file:');
  console.error('  DB_PASSWORD=your_local_db_password');
  process.exit(1);
}

const pool = new Pool(localDbConfig);

// Define tables in dependency order (to preserve foreign keys)
const tables = [
  'profiles',
  'categories',
  'products',
  'product_variants',
  'cart_items',
  'wishlist_items',
  'orders',
  'order_items',
  'order_tracking',
  'reviews',
  'addresses',
  'payment_methods',
  'notification_preferences',
  'site_settings',
  'social_media_accounts',
  'contact_information',
  'business_hours',
  'footer_links',
];

async function exportDatabase() {
  console.log('🚀 Starting Local Database Export...\n');

  try {
    // Test connection
    console.log('1️⃣  Testing database connection...');
    const testResult = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log(`   ✓ Connected to: ${testResult.rows[0].db}`);
    console.log(`   ✓ Server time: ${testResult.rows[0].time}\n`);

    // Get table information
    console.log('2️⃣  Discovering tables...');
    const tableInfo = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tableInfo.rows.map(row => row.table_name);
    console.log(`   ✓ Found ${existingTables.length} tables\n`);

    // Create export directory
    const exportDir = path.resolve(__dirname, '../database-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const exportFile = path.join(exportDir, `database-export-${timestamp}.sql`);
    const dataFile = path.join(exportDir, `database-data-${timestamp}.json`);

    console.log('3️⃣  Exporting database schema and data...\n');

    // Export schema
    console.log('   📋 Exporting schema...');
    const schemaResult = await pool.query(`
      SELECT 
        'CREATE EXTENSION IF NOT EXISTS "' || extname || '";' as sql
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    let exportContent = '-- Database Export\n';
    exportContent += `-- Exported on: ${new Date().toISOString()}\n`;
    exportContent += `-- Database: ${localDbConfig.database}\n\n`;
    
    // Add extensions
    for (const row of schemaResult.rows) {
      exportContent += row.sql + '\n';
    }
    exportContent += '\n';

    // Get table schemas
    for (const table of existingTables) {
      const createTableResult = await pool.query(`
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || table_schema || '.' || table_name || ' (' || 
          string_agg(column_definition, ', ' ORDER BY ordinal_position) || 
          ');' as create_statement
        FROM (
          SELECT 
            table_schema,
            table_name,
            ordinal_position,
            column_name || ' ' || 
            CASE 
              WHEN data_type = 'ARRAY' THEN 
                udt_name || '[]'
              WHEN data_type = 'USER-DEFINED' THEN 
                udt_name
              ELSE 
                CASE 
                  WHEN character_maximum_length IS NOT NULL THEN 
                    data_type || '(' || character_maximum_length || ')'
                  WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN 
                    data_type || '(' || numeric_precision || ',' || numeric_scale || ')'
                  WHEN numeric_precision IS NOT NULL THEN 
                    data_type || '(' || numeric_precision || ')'
                  ELSE 
                    data_type
                END
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END as column_definition
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
        ) sub
        GROUP BY table_schema, table_name
      `, [table]);

      if (createTableResult.rows.length > 0) {
        exportContent += `-- Table: ${table}\n`;
        exportContent += createTableResult.rows[0].create_statement + '\n\n';
      }
    }

    // Write schema to file
    fs.writeFileSync(exportFile, exportContent);
    console.log(`   ✓ Schema exported to: ${path.basename(exportFile)}\n`);

    // Export data
    console.log('   📊 Exporting data...');
    const dataExport = {
      exported_at: new Date().toISOString(),
      database: localDbConfig.database,
      tables: {},
    };

    let dataContent = '\n-- Data Export\n\n';
    dataContent += '-- Disable foreign key checks temporarily\n';
    dataContent += 'SET session_replication_role = replica;\n\n';

    for (const table of existingTables) {
      if (!tables.includes(table)) {
        console.log(`   ⚠ Skipping table: ${table} (not in standard list)`);
        continue;
      }

      try {
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const rowCount = parseInt(countResult.rows[0].count);

        if (rowCount === 0) {
          console.log(`   ⚪ ${table}: 0 rows (skipped)`);
          continue;
        }

        // Get all data
        const dataResult = await pool.query(`SELECT * FROM ${table} ORDER BY created_at, id`);
        
        dataExport.tables[table] = {
          row_count: rowCount,
          data: dataResult.rows,
        };

        // Generate INSERT statements
        if (dataResult.rows.length > 0) {
          const columns = Object.keys(dataResult.rows[0]).join(', ');
          dataContent += `-- Table: ${table} (${rowCount} rows)\n`;
          dataContent += `INSERT INTO ${table} (${columns}) VALUES\n`;

          const values = dataResult.rows.map((row, idx) => {
            const rowValues = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') {
                // Escape single quotes
                const escaped = val.replace(/'/g, "''");
                return `'${escaped}'`;
              }
              if (val instanceof Date) {
                return `'${val.toISOString()}'`;
              }
              if (Array.isArray(val)) {
                return `'${JSON.stringify(val)}'::jsonb`;
              }
              if (typeof val === 'object') {
                return `'${JSON.stringify(val)}'::jsonb`;
              }
              return val;
            });
            const comma = idx < dataResult.rows.length - 1 ? ',' : ';';
            return `  (${rowValues.join(', ')})${comma}`;
          });

          dataContent += values.join('\n') + '\n\n';
        }

        console.log(`   ✓ ${table}: ${rowCount} rows exported`);
      } catch (error) {
        console.error(`   ✗ Error exporting ${table}: ${error.message}`);
      }
    }

    dataContent += '-- Re-enable foreign key checks\n';
    dataContent += 'SET session_replication_role = DEFAULT;\n';

    // Append data to export file
    fs.appendFileSync(exportFile, dataContent);

    // Write JSON data file
    fs.writeFileSync(dataFile, JSON.stringify(dataExport, null, 2));

    console.log(`\n   ✓ Data exported to: ${path.basename(exportFile)}`);
    console.log(`   ✓ JSON backup saved to: ${path.basename(dataFile)}\n`);

    // Summary
    console.log('4️⃣  Export Summary:');
    const totalRows = Object.values(dataExport.tables).reduce((sum, table) => sum + table.row_count, 0);
    console.log(`   ✓ Total tables exported: ${Object.keys(dataExport.tables).length}`);
    console.log(`   ✓ Total rows exported: ${totalRows}`);
    console.log(`   ✓ Export file: ${exportFile}`);
    console.log(`   ✓ Data file: ${dataFile}\n`);

    console.log('✅ Database export complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Review the exported files in the database-export/ directory');
    console.log('   2. Use scripts/migrate-to-neon.js to migrate data to Neon');
    console.log('');

  } catch (error) {
    console.error('\n❌ Database export failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportDatabase();

