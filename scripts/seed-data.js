import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🌱 Starting Supabase Seeding...');

  // 1. Define Accounts
  const usersToCreate = [
    {
      email: 'admin@aligarhattarhouse.com',
      password: 'AdminPassword@123',
      fullName: 'YourCommerce Admin',
      role: 'admin',
      phone: '+91 98765 00000',
    },
    {
      email: 'tariq.khan@gmail.com',
      password: 'CustomerPassword@123',
      fullName: 'Tariq Khan',
      role: 'customer',
      phone: '+91 98765 43210',
      address: 'Medical Road, Aligarh, Uttar Pradesh - 202001',
    },
    {
      email: 'zara.ahmed@gmail.com',
      password: 'CustomerPassword@123',
      fullName: 'Zara Ahmed',
      role: 'customer',
      phone: '+91 98123 45678',
      address: 'South Extension Part 2, New Delhi - 110049',
    },
    {
      email: 'salman.shaikh@gmail.com',
      password: 'CustomerPassword@123',
      fullName: 'Mohammad Salman Shaikh',
      role: 'customer',
      phone: '+91 99887 76655',
      address: 'Hazratganj, Lucknow, Uttar Pradesh - 226001',
    },
    {
      email: 'fatima.noor@gmail.com',
      password: 'CustomerPassword@123',
      fullName: 'Fatima Noor',
      role: 'customer',
      phone: '+91 97654 32109',
      address: 'Bandra West, Mumbai, Maharashtra - 400050',
    },
  ];

  const createdUserMap = {};

  for (const u of usersToCreate) {
    console.log(`Creating user: ${u.email} (${u.role})...`);

    // Check if user already exists in auth
    const { data: existingList } = await supabase.auth.admin.listUsers();
    const existing = existingList?.users?.find(usr => usr.email?.toLowerCase() === u.email.toLowerCase());

    let userId;
    if (existing) {
      console.log(`  User ${u.email} already exists with ID: ${existing.id}`);
      userId = existing.id;
      // Update password & metadata
      await supabase.auth.admin.updateUserById(userId, {
        password: u.password,
        user_metadata: { full_name: u.fullName, role: u.role },
        email_confirm: true,
      });
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
        },
      });

      if (createError) {
        console.error(`  Error creating user ${u.email}:`, createError.message);
        continue;
      }
      userId = created.user.id;
      console.log(`  Successfully created user: ${u.email} ID: ${userId}`);
    }

    createdUserMap[u.email] = userId;

    // Upsert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        phone: u.phone || null,
        business_address: u.address || null,
        is_active: true,
        email_verified: true,
        password_hash: 'managed_by_supabase_auth',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  Error upserting profile for ${u.email}:`, profileError.message);
    } else {
      console.log(`  Profile updated for ${u.email}`);
    }
  }

  // 2. Fetch products to attach orders & reviews
  const { data: products } = await supabase.from('products').select('id, name, price');
  console.log(`Found ${products?.length || 0} products in database.`);

  if (products && products.length > 0) {
    const customerEmails = ['tariq.khan@gmail.com', 'zara.ahmed@gmail.com', 'salman.shaikh@gmail.com', 'fatima.noor@gmail.com'];

    // Seed Sample Orders
    console.log('Seeding sample orders...');
    const orderStatuses = ['delivered', 'shipped', 'pending', 'delivered'];

    for (let i = 0; i < customerEmails.length; i++) {
      const email = customerEmails[i];
      const customerId = createdUserMap[email];
      if (!customerId) continue;

      const product = products[i % products.length];
      const orderNumber = `AAH-ORD-2026-100${i + 1}`;
      const totalAmount = parseFloat(product.price || 499);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .upsert({
          user_id: customerId,
          order_number: orderNumber,
          subtotal: totalAmount,
          tax_amount: 0,
          shipping_amount: 0,
          discount_amount: 0,
          total_amount: totalAmount,
          status: orderStatuses[i % orderStatuses.length],
          payment_status: 'paid',
          payment_method: i % 2 === 0 ? 'UPI / Online' : 'Cash on Delivery',
          shipping_address: {
            address_line1: usersToCreate.find(u => u.email === email)?.address || 'Main Road',
            city: 'Aligarh',
            postal_code: '202001',
            country: 'India',
          },
          created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        }, { onConflict: 'order_number' })
        .select()
        .single();

      if (orderError) {
        console.error(`  Order creation error for ${orderNumber}:`, orderError.message);
      } else if (orderData) {
        console.log(`  Order created: ${orderNumber} for ${email}`);

        // Insert Order Items
        const { error: itemError } = await supabase.from('order_items').upsert({
          order_id: orderData.id,
          product_id: product.id,
          quantity: 1,
          unit_price: totalAmount,
          total_price: totalAmount,
        });
        if (itemError) {
          console.error(`  Order item insert error:`, itemError.message);
        }
      }

      // Seed Reviews
      const reviewComments = [
        'Exceptional authentic fragrance! Long lasting attar with amazing sillage.',
        'Smells regal and premium. Received quickly in great packaging.',
        'Very pleasing rose & sandalwood notes. Highly recommended for fragrance lovers!',
        'Pure alcohol-free attar. Perfect for daily wear and special occasions.',
      ];

      const { error: revError } = await supabase.from('reviews').upsert({
        user_id: customerId,
        product_id: product.id,
        rating: 5,
        comment: reviewComments[i % reviewComments.length],
        user_name: usersToCreate.find(u => u.email === email)?.fullName,
      });
      if (revError) {
        // ignore if constraint fails
      }
    }
  }

  console.log('\n🎉 Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔐 ADMIN LOGIN CREDENTIALS:');
  console.log('   Email:    admin@aligarhattarhouse.com');
  console.log('   Password: AdminPassword@123');
  console.log('----------------------------------------------------');
  console.log('👤 CUSTOMER LOGIN CREDENTIALS:');
  console.log('   Email:    tariq.khan@gmail.com');
  console.log('   Password: CustomerPassword@123');
  console.log('----------------------------------------------------');
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
