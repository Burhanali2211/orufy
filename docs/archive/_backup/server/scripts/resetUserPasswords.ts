import { query, initializeDatabase } from '../db/connection';
import { hashPassword } from '../utils/auth';

/**
 * Script to reset passwords for admin, seller, and customer users
 */

interface UserPassword {
  email: string;
  password: string;
}

const users: UserPassword[] = [
  { email: 'admin@perfumes.com', password: 'Admin@123456' },
  { email: 'seller@perfumes.com', password: 'Seller@123456' },
  { email: 'seller2@perfumes.com', password: 'Seller@123456' },
  { email: 'customer@perfumes.com', password: 'Customer@123456' },
  { email: 'customer2@perfumes.com', password: 'Customer@123456' }
];

async function resetPasswords() {
  try {
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connected successfully!\n');

    console.log('🔐 Resetting user passwords...\n');
    console.log('━'.repeat(60));

    for (const user of users) {
      try {
        // Check if user exists
        const existingUser = await query(
          'SELECT id, email, role FROM public.profiles WHERE email = $1',
          [user.email]
        );

        if (existingUser.rows.length === 0) {
          console.log(`⚠️  User not found: ${user.email}`);
          continue;
        }

        // Hash new password
        const passwordHash = await hashPassword(user.password);

        // Update password
        await query(
          'UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE email = $2',
          [passwordHash, user.email]
        );

        const userInfo = existingUser.rows[0];
        console.log(`✅ Password reset for: ${user.email}`);
        console.log(`   Role: ${userInfo.role}`);
        console.log(`   New Password: ${user.password}`);
        console.log('');
      } catch (error: any) {
        console.error(`❌ Failed to reset password for ${user.email}:`, error.message);
      }
    }

    console.log('━'.repeat(60));
    console.log('\n✅ Password reset completed!\n');
    
    console.log('📋 Updated Credentials:');
    console.log('━'.repeat(60));
    console.log('\n🔐 ADMIN:');
    console.log('   Email:    admin@perfumes.com');
    console.log('   Password: Admin@123456');
    
    console.log('\n🏪 SELLER:');
    console.log('   Email:    seller@perfumes.com');
    console.log('   Password: Seller@123456');
    
    console.log('\n👤 CUSTOMER:');
    console.log('   Email:    customer@perfumes.com');
    console.log('   Password: Customer@123456');
    
    console.log('\n━'.repeat(60));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error resetting passwords:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
resetPasswords();

