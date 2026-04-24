/**
 * Test script to verify uploaded_files table and image serving queries
 * Run with: node scripts/test-image-db.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

// Parse DATABASE_URL and configure SSL properly
const dbUrl = process.env.DATABASE_URL;
let poolConfig = {
  connectionString: dbUrl
};

// For Neon and other cloud databases, SSL is required
if (dbUrl && (dbUrl.includes('neon.tech') || dbUrl.includes('sslmode=require'))) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else if (dbUrl && dbUrl.includes('sslmode=disable')) {
  // Local development - no SSL
  poolConfig.ssl = false;
}

const pool = new Pool(poolConfig);

async function testDatabase() {
  console.log('🔍 Testing uploaded_files table...\n');

  try {
    // Test 1: Check if table exists
    console.log('Test 1: Checking if uploaded_files table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'uploaded_files'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table does not exist! Creating it...\n');
      await createTable();
    } else {
      console.log('✅ Table exists\n');
    }

    // Test 2: Check table structure
    console.log('Test 2: Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'uploaded_files'
      ORDER BY ordinal_position;
    `);
    
    console.log('Table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Test 3: Check for required columns
    const requiredColumns = ['id', 'filename', 'folder', 'mime_type', 'file_size', 'file_data', 'url_path'];
    const existingColumns = columns.rows.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('Fixing table structure...\n');
      await fixTableStructure(missingColumns);
    } else {
      console.log('✅ All required columns exist\n');
    }

    // Test 4: Check indexes
    console.log('Test 3: Checking indexes...');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' 
      AND tablename = 'uploaded_files';
    `);
    
    if (indexes.rows.length === 0) {
      console.log('⚠️  No indexes found. Creating indexes...\n');
      await createIndexes();
    } else {
      console.log('Existing indexes:');
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      console.log('');
    }

    // Test 5: Test image query (using a known image path)
    console.log('Test 4: Testing image query...');
    const testPath = '/uploads/categories/1765266336757-sbde0fhmzuk.jpg';
    const imageQuery = await pool.query(`
      SELECT file_data, mime_type, file_size, filename
      FROM public.uploaded_files 
      WHERE url_path = $1
      LIMIT 1;
    `, [testPath]);
    
    if (imageQuery.rows.length > 0) {
      const file = imageQuery.rows[0];
      console.log(`✅ Found image: ${file.filename}`);
      console.log(`   MIME type: ${file.mime_type}`);
      console.log(`   Size: ${file.file_size} bytes`);
      console.log(`   Data length: ${file.file_data ? file.file_data.length : 0} chars`);
      console.log(`   Data valid: ${file.file_data ? 'Yes' : 'No'}\n`);
      
      // Test base64 decoding
      try {
        const buffer = Buffer.from(file.file_data, 'base64');
        console.log(`   Buffer size: ${buffer.length} bytes`);
        console.log(`   Buffer matches file_size: ${buffer.length === file.file_size ? 'Yes' : 'No'}\n`);
      } catch (e) {
        console.log(`   ❌ Base64 decode error: ${e.message}\n`);
      }
    } else {
      console.log(`⚠️  No image found for path: ${testPath}\n`);
    }

    // Test 6: Count all images
    console.log('Test 5: Counting all uploaded images...');
    const count = await pool.query(`
      SELECT COUNT(*) as total, 
             SUM(file_size) as total_size,
             COUNT(DISTINCT folder) as folder_count
      FROM public.uploaded_files;
    `);
    
    const stats = count.rows[0];
    console.log(`   Total images: ${stats.total}`);
    console.log(`   Total size: ${(stats.total_size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Folders: ${stats.folder_count}\n`);

    // Test 7: List recent uploads
    console.log('Test 6: Recent uploads (last 5)...');
    const recent = await pool.query(`
      SELECT filename, folder, mime_type, file_size, url_path, created_at
      FROM public.uploaded_files
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    if (recent.rows.length > 0) {
      recent.rows.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file.filename} (${file.folder}) - ${(file.file_size / 1024).toFixed(2)} KB`);
        console.log(`      Path: ${file.url_path}`);
      });
    } else {
      console.log('   No uploads found');
    }
    console.log('');

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.uploaded_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename TEXT NOT NULL,
      folder TEXT NOT NULL DEFAULT 'uploads',
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_data TEXT NOT NULL,
      url_path TEXT NOT NULL,
      uploaded_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table created\n');
}

async function fixTableStructure(missingColumns) {
  // Add missing columns
  for (const col of missingColumns) {
    let alterQuery = '';
    switch (col) {
      case 'id':
        alterQuery = 'ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid()';
        break;
      case 'filename':
        alterQuery = 'ADD COLUMN filename TEXT NOT NULL';
        break;
      case 'folder':
        alterQuery = 'ADD COLUMN folder TEXT NOT NULL DEFAULT \'uploads\'';
        break;
      case 'mime_type':
        alterQuery = 'ADD COLUMN mime_type TEXT NOT NULL';
        break;
      case 'file_size':
        alterQuery = 'ADD COLUMN file_size INTEGER NOT NULL';
        break;
      case 'file_data':
        alterQuery = 'ADD COLUMN file_data TEXT NOT NULL';
        break;
      case 'url_path':
        alterQuery = 'ADD COLUMN url_path TEXT NOT NULL';
        break;
    }
    
    if (alterQuery) {
      try {
        await pool.query(`ALTER TABLE public.uploaded_files ${alterQuery};`);
        console.log(`✅ Added column: ${col}`);
      } catch (e) {
        console.log(`⚠️  Could not add ${col}: ${e.message}`);
      }
    }
  }
  console.log('');
}

async function createIndexes() {
  try {
    // Index on url_path for fast lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_url_path 
      ON public.uploaded_files(url_path);
    `);
    console.log('✅ Created index on url_path');

    // Index on folder for filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder 
      ON public.uploaded_files(folder);
    `);
    console.log('✅ Created index on folder');

    // Index on created_at for sorting
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at 
      ON public.uploaded_files(created_at DESC);
    `);
    console.log('✅ Created index on created_at\n');
  } catch (e) {
    console.log(`⚠️  Index creation error: ${e.message}\n`);
  }
}

// Run tests
testDatabase().catch(console.error);

