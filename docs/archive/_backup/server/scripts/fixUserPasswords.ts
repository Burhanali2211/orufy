import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, initializeDatabase } from '../db/connection';
import { hashPassword } from '../utils/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Fix user passwords by generating proper bcrypt hashes
 */
async function fixUserPasswords() {
  try {
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();

    const password = 'admin123';
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(password);

    console.log('👥 Updating user passwords...');

    // Update admin user
    await query(
      `UPDATE public.profiles 
       SET password_hash = $1 
       WHERE email = $2`,
      [passwordHash, 'admin@example.com']
    );
    console.log('   ✓ Updated admin@example.com');

    // Update seller user
    await query(
      `UPDATE public.profiles 
       SET password_hash = $1 
       WHERE email = $2`,
      [passwordHash, 'seller@example.com']
    );
    console.log('   ✓ Updated seller@example.com');

    // Update customer user
    await query(
      `UPDATE public.profiles 
       SET password_hash = $1 
       WHERE email = $2`,
      [passwordHash, 'customer@example.com']
    );
    console.log('   ✓ Updated customer@example.com');

    // Update admin@perfumes.com if exists
    const adminPerfumes = await query(
      'SELECT id FROM public.profiles WHERE email = $1',
      ['admin@perfumes.com']
    );

    if (adminPerfumes.rows.length > 0) {
      await query(
        `UPDATE public.profiles 
         SET password_hash = $1 
         WHERE email = $2`,
        [passwordHash, 'admin@perfumes.com']
      );
      console.log('   ✓ Updated admin@perfumes.com');
    }

    console.log('\n✅ All user passwords updated successfully!');
    console.log('📝 You can now login with:');
    console.log('   • Email: admin@example.com');
    console.log('   • Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix user passwords:', error);
    process.exit(1);
  }
}

fixUserPasswords();

