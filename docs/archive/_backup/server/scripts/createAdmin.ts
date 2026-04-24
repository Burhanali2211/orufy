import { query, initializeDatabase } from '../db/connection';
import { hashPassword } from '../utils/auth';

/**
 * Script to create an admin user
 * Email: admin@perfumes.com
 * Password: Admin@123456
 */
async function createAdminUser() {
  try {
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();

    const adminEmail = 'admin@perfumes.com';
    const adminPassword = 'Admin@123456';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id, email, role FROM public.profiles WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      const admin = existingAdmin.rows[0];
      if (admin.role === 'admin') {
        console.log('✅ Admin user already exists:');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   ID: ${admin.id}`);
        process.exit(0);
      } else {
        // Update existing user to admin
        await query(
          'UPDATE public.profiles SET role = $1 WHERE email = $2',
          ['admin', adminEmail]
        );
        console.log('✅ Updated existing user to admin role');
        console.log(`   Email: ${adminEmail}`);
        process.exit(0);
      }
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    console.log('👤 Creating admin user...');
    const result = await query(
      `INSERT INTO public.profiles (email, password_hash, full_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, created_at`,
      [adminEmail, passwordHash, adminName, 'admin', true, true]
    );

    const admin = result.rows[0];

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', adminEmail);
    console.log('🔑 Password: ', adminPassword);
    console.log('👤 Name:     ', admin.full_name);
    console.log('🎭 Role:     ', admin.role);
    console.log('🆔 ID:       ', admin.id);
    console.log('📅 Created:  ', admin.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🚀 You can now login to the admin dashboard at:');
    console.log('   http://localhost:5173/admin');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

