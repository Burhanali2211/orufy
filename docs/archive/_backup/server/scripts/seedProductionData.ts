import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const categories = [
  {
    name: 'Luxury Attars',
    slug: 'luxury-attars',
    description: 'Exclusive collection of pure, concentrated perfume oils.',
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    sort_order: 1
  },
  {
    name: 'Alcohol-Free Perfumes',
    slug: 'alcohol-free-perfumes',
    description: 'Refreshing fragrances crafted without alcohol for sensitive skin.',
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    sort_order: 2
  },
  {
    name: 'Oud Collection',
    slug: 'oud-collection',
    description: 'Deep, mysterious, and earthy scents featuring premium Agarwood.',
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    sort_order: 3
  },
  {
    name: 'Floral & Fresh',
    slug: 'floral-fresh',
    description: 'Light and airy scents inspired by blooming gardens.',
    image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80',
    sort_order: 4
  },
  {
    name: 'Spicy & Oriental',
    slug: 'spicy-oriental',
    description: 'Warm and exotic fragrances with notes of cardamom, cinnamon, and musk.',
    image_url: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80',
    sort_order: 5
  },
  {
    name: 'Gift Sets',
    slug: 'gift-sets',
    description: 'Perfectly curated fragrance collections for your loved ones.',
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
    sort_order: 6
  }
];

const products = [
  // Luxury Attars
  {
    name: 'Dehn Al Oud Hindi',
    slug: 'dehn-al-oud-hindi',
    description: 'A classic, aged Indian Oud oil with deep leathery and woody notes.',
    price: 149.99,
    original_price: 199.99,
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'],
    category_slug: 'luxury-attars',
    is_featured: true,
    show_on_homepage: true,
    rating: 4.9,
    review_count: 85,
    stock: 20,
    tags: ['oud', 'luxury', 'authentic']
  },
  {
    name: 'Royal Cambodian Oud',
    slug: 'royal-cambodian-oud',
    description: 'Sweet, fruity, and balsamic oud oil from the forests of Cambodia.',
    price: 129.99,
    original_price: 159.99,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    category_slug: 'luxury-attars',
    is_featured: true,
    show_on_homepage: true,
    rating: 4.8,
    review_count: 120,
    stock: 15,
    tags: ['oud', 'sweet', 'premium']
  },
  {
    name: 'White Musk Gazelle',
    slug: 'white-musk-gazelle',
    description: 'A clean, powdery, and long-lasting white musk with a hint of floral sweetness.',
    price: 45.00,
    original_price: 55.00,
    images: ['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800'],
    category_slug: 'luxury-attars',
    is_featured: false,
    show_on_homepage: true,
    rating: 4.7,
    review_count: 240,
    stock: 100,
    tags: ['musk', 'clean', 'daily']
  },
  
  // Alcohol-Free Perfumes
  {
    name: 'Oceanic Breeze Water-Based',
    slug: 'oceanic-breeze-water-based',
    description: 'A refreshing aquatic scent that feels like a cool sea breeze. 100% alcohol-free.',
    price: 35.00,
    original_price: 45.00,
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800'],
    category_slug: 'alcohol-free-perfumes',
    is_featured: true,
    show_on_homepage: true,
    rating: 4.6,
    review_count: 150,
    stock: 50,
    tags: ['fresh', 'aquatic', 'halal']
  },
  {
    name: 'Sandalwood Mist',
    slug: 'sandalwood-mist',
    description: 'Creamy and calming sandalwood fragrance in a water-based formula.',
    price: 39.99,
    original_price: 49.99,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    category_slug: 'alcohol-free-perfumes',
    is_featured: false,
    show_on_homepage: false,
    rating: 4.8,
    review_count: 95,
    stock: 40,
    tags: ['woody', 'calming']
  },

  // Oud Collection
  {
    name: 'Oud Al Malaki',
    slug: 'oud-al-malaki',
    description: 'The "Royal Oud" - a majestic blend of spices, leather, and intense agarwood.',
    price: 95.00,
    original_price: 120.00,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    category_slug: 'oud-collection',
    is_featured: true,
    show_on_homepage: true,
    rating: 4.9,
    review_count: 310,
    stock: 30,
    tags: ['royal', 'intense', 'oud']
  },
  {
    name: 'Midnight Oud',
    slug: 'midnight-oud',
    description: 'A mysterious night fragrance with dark oud and smoky incense.',
    price: 85.00,
    original_price: 105.00,
    images: ['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800'],
    category_slug: 'oud-collection',
    is_featured: false,
    show_on_homepage: true,
    rating: 4.7,
    review_count: 180,
    stock: 45,
    tags: ['smoky', 'night']
  },

  // Floral & Fresh
  {
    name: 'Rose Damascena',
    slug: 'rose-damascena',
    description: 'Pure essence of the Damask rose, handpicked at dawn.',
    price: 55.00,
    original_price: 75.00,
    images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800'],
    category_slug: 'floral-fresh',
    is_featured: true,
    show_on_homepage: true,
    rating: 4.9,
    review_count: 420,
    stock: 60,
    tags: ['rose', 'floral', 'classic']
  },
  {
    name: 'Jasmine Sambac',
    slug: 'jasmine-sambac',
    description: 'An intoxicating and sensual jasmine fragrance that blooms on your skin.',
    price: 49.99,
    original_price: 65.00,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    category_slug: 'floral-fresh',
    is_featured: false,
    show_on_homepage: true,
    rating: 4.8,
    review_count: 215,
    stock: 75,
    tags: ['jasmine', 'sweet']
  },

  // Spicy & Oriental
  {
    name: 'Golden Amber',
    slug: 'golden-amber',
    description: 'A warm, resinous, and inviting amber with hints of vanilla and spice.',
    price: 65.00,
    original_price: 80.00,
    images: ['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800'],
    category_slug: 'spicy-oriental',
    is_featured: false,
    show_on_homepage: true,
    rating: 4.7,
    review_count: 140,
    stock: 55,
    tags: ['amber', 'warm']
  },
  {
    name: 'Black Cardamom',
    slug: 'black-cardamom',
    description: 'A bold and spicy oriental fragrance with smokey cardamom and black pepper.',
    price: 59.99,
    original_price: 79.99,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    category_slug: 'spicy-oriental',
    is_featured: false,
    show_on_homepage: false,
    rating: 4.5,
    review_count: 60,
    stock: 35,
    tags: ['spicy', 'bold']
  }
];

const siteSettings = [
  { key: 'site_name', value: 'HimalayanSpicesExportss', type: 'text', category: 'general', description: 'Website name', is_public: true },
  { key: 'site_description', value: 'Premium perfumes, pure attars, and luxury fragrances from himalayanspicesexports. Discover the art of scent.', type: 'text', category: 'general', description: 'Website description', is_public: true },
  { key: 'contact_email', value: 'info@himalayanspicesexports.com', type: 'text', category: 'contact', description: 'Main contact email', is_public: true },
  { key: 'contact_phone', value: '+91-571-1234567', type: 'text', category: 'contact', description: 'Main contact phone', is_public: true },
  { key: 'address', value: 'Jama Masjid Road, himalayanspicesexports, Uttar Pradesh, India', type: 'text', category: 'contact', description: 'Physical address', is_public: true },
  { key: 'shipping_policy', value: 'Free shipping on orders above ₹1000. Delivery within 3-5 business days across India.', type: 'text', category: 'policy', description: 'Shipping policy text', is_public: true },
  { key: 'currency', value: 'INR', type: 'text', category: 'localization', description: 'Default currency code', is_public: true },
  { key: 'currency_symbol', value: '₹', type: 'text', category: 'localization', description: 'Default currency symbol', is_public: true }
];

async function seed() {
  const { query, closePool, initializeDatabase } = await import('../db/connection');

  try {
    await initializeDatabase();
    console.log('🌱 Starting production data seed...');

    // 1. Clean existing data
    console.log('🧹 Cleaning existing data...');
    await query('TRUNCATE public.products, public.categories, public.site_settings CASCADE');

    // 2. Seed Categories
    console.log('📂 Seeding categories...');
    const categoryIdMap = new Map();
    for (const cat of categories) {
      const res = await query(
        `INSERT INTO public.categories (name, slug, description, image_url, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id, slug`,
        [cat.name, cat.slug, cat.description, cat.image_url, cat.sort_order]
      );
      categoryIdMap.set(res.rows[0].slug, res.rows[0].id);
    }
    console.log(`✅ Seeded ${categories.length} categories.`);

    // 3. Seed Products
    console.log('🛍️ Seeding products...');
    for (const prod of products) {
      const categoryId = categoryIdMap.get(prod.category_slug);
      await query(
        `INSERT INTO public.products (
          name, slug, description, price, original_price, images,
          category_id, is_featured, show_on_homepage, rating, review_count, stock, tags, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)`,
        [
          prod.name, prod.slug, prod.description, prod.price, prod.original_price,
          prod.images, categoryId, prod.is_featured, prod.show_on_homepage,
          prod.rating, prod.review_count, prod.stock, prod.tags
        ]
      );
    }
    console.log(`✅ Seeded ${products.length} products.`);

    // 4. Seed Site Settings
    console.log('⚙️ Seeding site settings...');
    for (const setting of siteSettings) {
      await query(
        `INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, description, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [setting.key, setting.value, setting.type, setting.category, setting.description, setting.is_public]
      );
    }
    console.log(`✅ Seeded ${siteSettings.length} site settings.`);

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await closePool();
  }
}

seed();
