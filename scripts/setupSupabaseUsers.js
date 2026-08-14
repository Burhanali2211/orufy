/**
 * Supabase User Setup Script
 * 
 * This script creates test users in Supabase Auth.
 * 
 * Usage:
 *   Run: node scripts/setupSupabaseUsers.js
 * 
 * IMPORTANT: You need the SERVICE_ROLE_KEY (not the anon key) to create users.
 * Find it in Supabase Dashboard > Settings > API > service_role key
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL is not set in environment');
  console.log('\nPlease make sure you have a .env file with:');
  console.log('  VITE_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set in environment');
  console.log('\nTo get your service role key:');
  console.log('  1. Go to https://app.supabase.com');
  console.log('  2. Select your project');
  console.log('  3. Go to Settings > API');
  console.log('  4. Copy the "service_role" key (NOT the anon key)');
  console.log('\nAdd to your .env file:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to create
const users = [
  {
    email: 'admin@perfumes.com',
    password: 'Admin@123456',
    role: 'admin',
    fullName: 'Admin User'
  },
  {
    email: 'seller@perfumes.com',
    password: 'Seller@123456',
    role: 'seller',
    fullName: 'Premium Seller'
  },
  {
    email: 'customer@perfumes.com',
    password: 'Customer@123456',
    role: 'customer',
    fullName: 'Test Customer'
  }
];

async function createUser(userData) {
  const { email, password, role, fullName } = userData;
  
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log(`⚠️  User already exists: ${email}`);
      
      // Update the profile to ensure role is correct
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: existingUser.id,
          email: email,
          full_name: fullName,
          role: role,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.log(`   ⚠️  Could not update profile: ${profileError.message}`);
      } else {
        console.log(`   ✅ Profile updated with role: ${role}`);
      }
      return;
    }
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });
    
    if (error) {
      console.error(`❌ Failed to create ${email}:`, error.message);
      return;
    }
    
    console.log(`✅ Created user: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   ID: ${data.user.id}`);
    
    // Create/update profile in profiles table
    // Note: password_hash is required by the table, so we use a placeholder since Supabase Auth handles passwords
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: role,
        is_active: true,
        password_hash: 'supabase_auth_managed', // Placeholder - Supabase Auth manages the real password
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (profileError) {
      console.log(`   ⚠️  Could not create profile: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile created`);
    }
    
  } catch (err) {
    console.error(`❌ Error creating ${email}:`, err.message);
  }
}

async function main() {
  console.log('🚀 Supabase User Setup Script\n');
  console.log('━'.repeat(50));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('━'.repeat(50) + '\n');
  
  for (const user of users) {
    await createUser(user);
    console.log('');
  }
  
  console.log('━'.repeat(50));
  console.log('\n📋 Login Credentials:\n');
  console.log('🔐 ADMIN:');
  console.log('   Email:    admin@perfumes.com');
  console.log('   Password: Admin@123456');
  console.log('   URL:      http://localhost:5173/admin\n');
  
  console.log('🏪 SELLER:');
  console.log('   Email:    seller@perfumes.com');
  console.log('   Password: Seller@123456');
  console.log('   URL:      http://localhost:5173/dashboard\n');
  
  console.log('👤 CUSTOMER:');
  console.log('   Email:    customer@perfumes.com');
  console.log('   Password: Customer@123456');
  console.log('   URL:      http://localhost:5173/dashboard\n');
  
  console.log('━'.repeat(50));
  console.log('✅ Setup complete!\n');
}

main().catch(console.error);
