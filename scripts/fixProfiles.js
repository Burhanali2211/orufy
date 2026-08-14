/**
 * Fix profiles for existing Supabase Auth users
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  { email: 'admin@perfumes.com', role: 'admin', fullName: 'Admin User' },
  { email: 'seller@perfumes.com', role: 'seller', fullName: 'Premium Seller' },
  { email: 'customer@perfumes.com', role: 'customer', fullName: 'Test Customer' }
];

async function fixProfiles() {
  console.log('🔧 Fixing profiles...\n');
  
  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  
  for (const user of users) {
    const authUser = authData?.users?.find(u => u.email === user.email);
    
    if (!authUser) {
      console.log(`⚠️  User not found in auth: ${user.email}`);
      continue;
    }
    
    console.log(`Updating profile for: ${user.email} (ID: ${authUser.id})`);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        is_active: true,
        password_hash: 'supabase_auth_managed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Profile updated`);
    }
  }
  
  console.log('\n✅ Done!');
}

fixProfiles().catch(console.error);
