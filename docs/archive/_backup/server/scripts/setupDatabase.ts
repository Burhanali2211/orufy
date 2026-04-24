import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, query } from '../db/connection';
import { initializeSchema } from '../db/init';
import { hashPassword } from '../utils/auth';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Complete Database Setup Script
 * This script will:
 * 1. Create all database tables
 * 2. Create admin user (admin@perfumes.com / admin123)
 * 3. Seed categories
 * 4. Seed 3 sample products
 * 5. Create site settings
 */

async function setupDatabase() {
  try {
    console.log('🚀 Starting Complete Database Setup...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Initialize connection
    console.log('1️⃣  Connecting to database...');
    await initializeDatabase();
    console.log('   ✓ Database connection successful\n');

    // Step 2: Create schema (all tables)
    console.log('2️⃣  Creating database schema (all tables)...');
    await initializeSchema();
    console.log('   ✓ Schema created successfully\n');

    // Step 3: Run site settings migration
    console.log('3️⃣  Creating site settings tables...');
    const migrationPath = path.join(__dirname, '../db/migrations/create-site-settings.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('   ✓ Site settings tables created\n');
    } else {
      console.log('   ⚠ Site settings migration not found, skipping\n');
    }

    // Step 4: Create admin user
    console.log('4️⃣  Creating admin user...');
    const adminEmail = 'admin@perfumes.com';
    const adminPassword = 'admin123';
    const passwordHash = await hashPassword(adminPassword);

    // Check if admin exists
    const existingAdmin = await query(
      'SELECT id FROM public.profiles WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      await query(
        `INSERT INTO public.profiles (email, password_hash, full_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [adminEmail, passwordHash, 'Admin User', 'admin', true, true]
      );
      console.log('   ✓ Admin user created');
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}\n`);
    } else {
      console.log('   ℹ Admin user already exists\n');
    }

    // Step 5: Seed categories
    console.log('5️⃣  Seeding categories...');
    const categories = [
      { name: 'Perfumes', slug: 'perfumes', description: 'Luxurious perfumes for every occasion', sort_order: 1 },
      { name: 'Colognes', slug: 'colognes', description: 'Fresh and invigorating colognes', sort_order: 2 },
      { name: 'Fragrances', slug: 'fragrances', description: 'Signature fragrances that define you', sort_order: 3 },
      { name: 'Attars', slug: 'attars', description: 'Traditional alcohol-free attars', sort_order: 4 },
      { name: 'Essential Oils', slug: 'essential-oils', description: 'Pure essential oils', sort_order: 5 },
    ];

    for (const category of categories) {
      await query(
        `INSERT INTO public.categories (name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [category.name, category.slug, category.description, category.sort_order, true]
      );
    }
    console.log(`   ✓ ${categories.length} categories seeded\n`);

    // Step 6: Get category IDs for products
    console.log('6️⃣  Seeding sample products...');
    const perfumeCategoryResult = await query(
      "SELECT id FROM public.categories WHERE slug = 'perfumes' LIMIT 1"
    );
    const cologneCategoryResult = await query(
      "SELECT id FROM public.categories WHERE slug = 'colognes' LIMIT 1"
    );
    const fragranceCategoryResult = await query(
      "SELECT id FROM public.categories WHERE slug = 'fragrances' LIMIT 1"
    );

    const perfumeCategoryId = perfumeCategoryResult.rows[0]?.id;
    const cologneCategoryId = cologneCategoryResult.rows[0]?.id;
    const fragranceCategoryId = fragranceCategoryResult.rows[0]?.id;

    // Step 7: Seed 3 sample products
    const products = [
      {
        name: 'Royal Oud Attar',
        slug: 'royal-oud-attar',
        description: 'A luxurious blend of aged oud wood with hints of rose and amber. Perfect for special occasions and evening wear.',
        short_description: 'Luxurious oud blend with rose and amber',
        price: 89.99,
        original_price: 129.99,
        category_id: perfumeCategoryId,
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'],
        stock: 50,
        sku: 'PERF-001',
        tags: ['oud', 'luxury', 'featured'],
        is_featured: true,
        rating: 4.8,
        review_count: 127
      },
      {
        name: 'Jasmine Night Perfume',
        slug: 'jasmine-night-perfume',
        description: 'Enchanting jasmine essence captured at midnight. A floral masterpiece that lasts all day long.',
        short_description: 'Enchanting midnight jasmine essence',
        price: 64.99,
        original_price: 84.99,
        category_id: cologneCategoryId,
        images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500'],
        stock: 75,
        sku: 'PERF-002',
        tags: ['floral', 'jasmine', 'featured'],
        is_featured: true,
        rating: 4.9,
        review_count: 203
      },
      {
        name: 'Amber Musk Essence',
        slug: 'amber-musk-essence',
        description: 'Warm amber combined with soft musk creates an irresistible, long-lasting fragrance for any occasion.',
        short_description: 'Warm amber and soft musk blend',
        price: 74.99,
        original_price: 99.99,
        category_id: fragranceCategoryId,
        images: ['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=500'],
        stock: 60,
        sku: 'PERF-003',
        tags: ['amber', 'musk', 'featured'],
        is_featured: true,
        rating: 4.7,
        review_count: 156
      }
    ];

    for (const product of products) {
      await query(
        `INSERT INTO public.products (
          name, slug, description, short_description, price, original_price,
          category_id, images, stock, sku, tags, is_featured, rating, review_count, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (slug) DO NOTHING`,
        [
          product.name,
          product.slug,
          product.description,
          product.short_description,
          product.price,
          product.original_price,
          product.category_id,
          product.images,
          product.stock,
          product.sku,
          product.tags,
          product.is_featured,
          product.rating,
          product.review_count,
          true
        ]
      );
    }
    console.log(`   ✓ ${products.length} sample products seeded\n`);

    // Step 8: Create default site settings
    console.log('7️⃣  Creating default site settings...');
    try {
      const defaultSettings = [
        { key: 'site_name', value: 'HimalayanSpicesExports', type: 'text', category: 'general', description: 'Website name', is_public: true },
        { key: 'site_description', value: 'Premium Kashmir Perfumes & Attars', type: 'text', category: 'general', description: 'Website description', is_public: true },
        { key: 'site_logo', value: '/logo.png', type: 'text', category: 'general', description: 'Website logo URL', is_public: true },
        { key: 'site_favicon', value: '/favicon.ico', type: 'text', category: 'general', description: 'Website favicon URL', is_public: true },
        { key: 'contact_email', value: 'admin@perfumes.com', type: 'email', category: 'contact', description: 'Contact email address', is_public: true },
        { key: 'contact_phone', value: '+91-XXXXXXXXXX', type: 'text', category: 'contact', description: 'Contact phone number', is_public: true },
        { key: 'currency', value: 'INR', type: 'text', category: 'general', description: 'Default currency', is_public: true },
        { key: 'timezone', value: 'Asia/Kolkata', type: 'text', category: 'general', description: 'Default timezone', is_public: false },
        { key: 'free_shipping_threshold', value: '2000', type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true },
        { key: 'tax_rate', value: '18', type: 'number', category: 'pricing', description: 'GST tax rate percentage', is_public: false },
      ];

      for (const setting of defaultSettings) {
        await query(
          `INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, description, is_public)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (setting_key) DO NOTHING`,
          [setting.key, setting.value, setting.type, setting.category, setting.description, setting.is_public]
        );
      }
      console.log(`   ✓ ${defaultSettings.length} site settings created\n`);
    } catch (error) {
      console.log('   ⚠ Error creating site settings:', error);
    }

    // Step 9: Seed social media accounts
    console.log('8️⃣  Seeding social media accounts...');
    try {
      const socialMediaAccounts = [
        { platform: 'facebook', platform_name: 'Facebook', url: 'https://facebook.com/himalayanspicesexports', username: '@himalayanspicesexports', icon_name: 'Facebook', is_active: true, display_order: 1, follower_count: 0 },
        { platform: 'instagram', platform_name: 'Instagram', url: 'https://instagram.com/himalayanspicesexports', username: '@himalayanspicesexports', icon_name: 'Instagram', is_active: true, display_order: 2, follower_count: 0 },
        { platform: 'twitter', platform_name: 'Twitter', url: 'https://twitter.com/himalayanspicesexports', username: '@himalayanspicesexports', icon_name: 'Twitter', is_active: true, display_order: 3, follower_count: 0 },
        { platform: 'youtube', platform_name: 'YouTube', url: 'https://youtube.com/@himalayanspicesexports', username: '@himalayanspicesexports', icon_name: 'Youtube', is_active: true, display_order: 4, follower_count: 0 },
      ];

      for (const account of socialMediaAccounts) {
        await query(
          `INSERT INTO public.social_media_accounts (platform, platform_name, url, username, icon_name, is_active, display_order, follower_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [account.platform, account.platform_name, account.url, account.username, account.icon_name, account.is_active, account.display_order, account.follower_count]
        );
      }
      console.log(`   ✓ ${socialMediaAccounts.length} social media accounts seeded\n`);
    } catch (error) {
      console.log('   ⚠ Error seeding social media accounts:', error);
    }

    // Step 10: Seed contact information
    console.log('9️⃣  Seeding contact information...');
    try {
      const contactInfo = [
        { contact_type: 'phone', label: 'Customer Support', value: '+91-XXXXXXXXXX', is_primary: true, is_active: true, display_order: 1, icon_name: 'Phone', additional_info: JSON.stringify({ department: 'support', hours: 'Mon-Sat 10AM-6PM' }) },
        { contact_type: 'email', label: 'General Inquiries', value: 'info@himalayanspicesexports.com', is_primary: true, is_active: true, display_order: 2, icon_name: 'Mail', additional_info: JSON.stringify({ department: 'general' }) },
        { contact_type: 'whatsapp', label: 'WhatsApp', value: '+91-XXXXXXXXXX', is_primary: false, is_active: true, display_order: 3, icon_name: 'MessageCircle', additional_info: JSON.stringify({ department: 'support' }) },
        { contact_type: 'address', label: 'Main Office', value: 'himalayanspicesexports, Uttar Pradesh, India', is_primary: true, is_active: true, display_order: 4, icon_name: 'MapPin', additional_info: JSON.stringify({ type: 'office' }) },
      ];

      for (const contact of contactInfo) {
        await query(
          `INSERT INTO public.contact_information (contact_type, label, value, is_primary, is_active, display_order, icon_name, additional_info)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
           ON CONFLICT DO NOTHING`,
          [contact.contact_type, contact.label, contact.value, contact.is_primary, contact.is_active, contact.display_order, contact.icon_name, contact.additional_info]
        );
      }
      console.log(`   ✓ ${contactInfo.length} contact information entries seeded\n`);
    } catch (error) {
      console.log('   ⚠ Error seeding contact information:', error);
    }

    // Step 11: Seed business hours
    console.log('🔟 Seeding business hours...');
    try {
      const businessHours = [
        { day_of_week: 1, is_open: true, open_time: '10:00', close_time: '18:00', is_24_hours: false, notes: 'Monday' },
        { day_of_week: 2, is_open: true, open_time: '10:00', close_time: '18:00', is_24_hours: false, notes: 'Tuesday' },
        { day_of_week: 3, is_open: true, open_time: '10:00', close_time: '18:00', is_24_hours: false, notes: 'Wednesday' },
        { day_of_week: 4, is_open: true, open_time: '10:00', close_time: '18:00', is_24_hours: false, notes: 'Thursday' },
        { day_of_week: 5, is_open: true, open_time: '10:00', close_time: '18:00', is_24_hours: false, notes: 'Friday' },
        { day_of_week: 6, is_open: true, open_time: '10:00', close_time: '16:00', is_24_hours: false, notes: 'Saturday' },
        { day_of_week: 0, is_open: false, open_time: null, close_time: null, is_24_hours: false, notes: 'Sunday - Closed' },
      ];

      for (const hours of businessHours) {
        await query(
          `INSERT INTO public.business_hours (day_of_week, is_open, open_time, close_time, is_24_hours, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (day_of_week) DO NOTHING`,
          [hours.day_of_week, hours.is_open, hours.open_time, hours.close_time, hours.is_24_hours, hours.notes]
        );
      }
      console.log(`   ✓ ${businessHours.length} business hours entries seeded\n`);
    } catch (error) {
      console.log('   ⚠ Error seeding business hours:', error);
    }

    // Step 12: Seed footer links
    console.log('1️⃣1️⃣  Seeding footer links...');
    try {
      const footerLinks = [
        // Shop section
        { section_name: 'Shop', link_text: 'All Products', link_url: '/products', display_order: 1, is_active: true, opens_new_tab: false },
        { section_name: 'Shop', link_text: 'Categories', link_url: '/categories', display_order: 2, is_active: true, opens_new_tab: false },
        { section_name: 'Shop', link_text: 'New Arrivals', link_url: '/new-arrivals', display_order: 3, is_active: true, opens_new_tab: false },
        { section_name: 'Shop', link_text: 'Best Sellers', link_url: '/deals', display_order: 4, is_active: true, opens_new_tab: false },
        // Customer Care section
        { section_name: 'Customer Care', link_text: 'Contact Us', link_url: '/about', display_order: 1, is_active: true, opens_new_tab: false },
        { section_name: 'Customer Care', link_text: 'Shipping Policy', link_url: '/shipping-policy', display_order: 2, is_active: true, opens_new_tab: false },
        { section_name: 'Customer Care', link_text: 'Refund Policy', link_url: '/refund-policy', display_order: 3, is_active: true, opens_new_tab: false },
        { section_name: 'Customer Care', link_text: 'Track Order', link_url: '/orders', display_order: 4, is_active: true, opens_new_tab: false },
        // Company section
        { section_name: 'Company', link_text: 'About Us', link_url: '/about', display_order: 1, is_active: true, opens_new_tab: false },
        { section_name: 'Company', link_text: 'Privacy Policy', link_url: '/privacy-policy', display_order: 2, is_active: true, opens_new_tab: false },
        { section_name: 'Company', link_text: 'Terms of Service', link_url: '/terms-of-service', display_order: 3, is_active: true, opens_new_tab: false },
      ];

      for (const link of footerLinks) {
        await query(
          `INSERT INTO public.footer_links (section_name, link_text, link_url, display_order, is_active, opens_new_tab)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [link.section_name, link.link_text, link.link_url, link.display_order, link.is_active, link.opens_new_tab]
        );
      }
      console.log(`   ✓ ${footerLinks.length} footer links seeded\n`);
    } catch (error) {
      console.log('   ⚠ Error seeding footer links:', error);
    }

    // Success summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Summary:');
    console.log('   ✓ All database tables created');
    console.log('   ✓ Admin user created');
    console.log('   ✓ 5 categories seeded');
    console.log('   ✓ 3 sample products seeded');
    console.log('   ✓ 10 site settings configured');
    console.log('   ✓ 4 social media accounts seeded');
    console.log('   ✓ 4 contact information entries seeded');
    console.log('   ✓ 7 business hours entries seeded');
    console.log('   ✓ 11 footer links seeded\n');

    console.log('🔐 Admin Credentials:');
    console.log('   📧 Email:    admin@perfumes.com');
    console.log('   🔑 Password: admin123');
    console.log('   🌐 Login at: http://localhost:5173/admin\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   • Change admin password after first login');
    console.log('   • Update site settings in admin panel');
    console.log('   • Add more products as needed\n');

    console.log('🚀 Ready to start the application!');
    console.log('   Run: npm run dev:all\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.error('\nPlease check:');
    console.error('   • DATABASE_URL is set correctly in .env');
    console.error('   • Database server is running');
    console.error('   • Database credentials are correct\n');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();

