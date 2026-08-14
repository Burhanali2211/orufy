import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function getRowCounts() {
  const tables = [
    'profiles',
    'categories',
    'products',
    'product_variants',
    'addresses',
    'cart_items',
    'wishlist_items',
    'orders',
    'order_items',
    'order_tracking',
    'payment_logs',
    'payment_methods',
    'reviews',
    'notification_preferences',
    'site_settings',
    'contact_information',
    'social_media_accounts',
    'uploaded_files'
  ];
  
  console.log('--- Database Row Counts Baseline ---');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.log(`${table}: Error - ${error.message}`);
    } else {
      console.log(`${table}: ${count}`);
    }
  }
}

getRowCounts();
