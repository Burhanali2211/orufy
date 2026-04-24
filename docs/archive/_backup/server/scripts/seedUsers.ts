import { query, initializeDatabase } from '../db/connection';
import { hashPassword } from '../utils/auth';

/**
 * Seed script to create admin and seller users
 * 
 * Admin User:
 *   Email: admin@perfumes.com
 *   Password: Admin@123456
 * 
 * Seller User:
 *   Email: seller@perfumes.com
 *   Password: Seller@123456
 * 
 * Customer User:
 *   Email: customer@perfumes.com
 *   Password: Customer@123456
 */

interface UserSeed {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'seller' | 'customer';
  phone?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxId?: string;
}

const users: UserSeed[] = [
  {
    email: 'admin@perfumes.com',
    password: 'Admin@123456',
    fullName: 'Admin User',
    role: 'admin',
    phone: '+91 9876543210'
  },
  {
    email: 'seller@perfumes.com',
    password: 'Seller@123456',
    fullName: 'Premium Seller',
    role: 'seller',
    phone: '+91 9876543211',
    businessName: 'Premium Attars & Fragrances',
    businessAddress: 'Shop No. 15, Attar Market, himalayanspicesexports, UP 202001',
    businessPhone: '+91 9876543211',
    taxId: '27XXXXX1234X1Z5'
  },
  {
    email: 'seller2@perfumes.com',
    password: 'Seller@123456',
    fullName: 'Royal Fragrances',
    role: 'seller',
    phone: '+91 9876543212',
    businessName: 'Royal Fragrances Co.',
    businessAddress: 'Shop No. 25, Main Market, himalayanspicesexports, UP 202001',
    businessPhone: '+91 9876543212',
    taxId: '27XXXXX5678X2Z6'
  },
  {
    email: 'customer@perfumes.com',
    password: 'Customer@123456',
    fullName: 'Test Customer',
    role: 'customer',
    phone: '+91 9876543213'
  },
  {
    email: 'customer2@perfumes.com',
    password: 'Customer@123456',
    fullName: 'Rahul Sharma',
    role: 'customer',
    phone: '+91 9876543214'
  }
];

async function seedUsers() {
  try {
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connected successfully!\n');

    console.log('👥 Starting user seeding process...\n');
    console.log('━'.repeat(60));

    for (const user of users) {
      try {
        // Check if user already exists
        const existingUser = await query(
          'SELECT id, email, role FROM public.profiles WHERE email = $1',
          [user.email]
        );

        if (existingUser.rows.length > 0) {
          const existing = existingUser.rows[0];
          console.log(`⚠️  User already exists: ${user.email}`);
          console.log(`   Role: ${existing.role}`);
          console.log(`   ID: ${existing.id}`);
          
          // Update role if different
          if (existing.role !== user.role) {
            await query(
              'UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE email = $2',
              [user.role, user.email]
            );
            console.log(`   ✓ Role updated to: ${user.role}`);
          }
          console.log('');
          continue;
        }

        // Hash password
        const passwordHash = await hashPassword(user.password);

        // Create user
        const result = await query(
          `INSERT INTO public.profiles (
            email, password_hash, full_name, role, phone, is_active, email_verified,
            business_name, business_address, business_phone, tax_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, email, full_name, role, created_at`,
          [
            user.email,
            passwordHash,
            user.fullName,
            user.role,
            user.phone || null,
            true,
            true,
            user.businessName || null,
            user.businessAddress || null,
            user.businessPhone || null,
            user.taxId || null
          ]
        );

        const createdUser = result.rows[0];
        console.log(`✅ Created ${user.role.toUpperCase()}: ${user.email}`);
        console.log(`   Name: ${createdUser.full_name}`);
        console.log(`   Role: ${createdUser.role}`);
        console.log(`   ID: ${createdUser.id}`);
        if (user.businessName) {
          console.log(`   Business: ${user.businessName}`);
        }
        console.log('');
      } catch (error: any) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }

    console.log('━'.repeat(60));
    console.log('\n✅ User seeding completed!\n');
    
    console.log('📋 User Credentials Summary:');
    console.log('━'.repeat(60));
    console.log('\n🔐 ADMIN LOGIN:');
    console.log('   Email:    admin@perfumes.com');
    console.log('   Password: Admin@123456');
    console.log('   URL:      http://localhost:5173/admin');
    
    console.log('\n🏪 SELLER LOGIN:');
    console.log('   Email:    seller@perfumes.com');
    console.log('   Password: Seller@123456');
    console.log('   URL:      http://localhost:5173/dashboard');
    
    console.log('\n🏪 SELLER 2 LOGIN:');
    console.log('   Email:    seller2@perfumes.com');
    console.log('   Password: Seller@123456');
    console.log('   URL:      http://localhost:5173/dashboard');
    
    console.log('\n👤 CUSTOMER LOGIN:');
    console.log('   Email:    customer@perfumes.com');
    console.log('   Password: Customer@123456');
    console.log('   URL:      http://localhost:5173/dashboard');
    
    console.log('\n👤 CUSTOMER 2 LOGIN:');
    console.log('   Email:    customer2@perfumes.com');
    console.log('   Password: Customer@123456');
    console.log('   URL:      http://localhost:5173/dashboard');
    
    console.log('\n━'.repeat(60));
    console.log('⚠️  IMPORTANT: Change passwords after first login!');
    console.log('━'.repeat(60));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
seedUsers();

