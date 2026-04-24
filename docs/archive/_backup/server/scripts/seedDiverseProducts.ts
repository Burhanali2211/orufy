import { query } from '../db/connection.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const categories = [
  { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets, smartphones, and laptops', sort_order: 1 },
  { name: 'Fashion', slug: 'fashion', description: 'Trendy apparel and accessories', sort_order: 2 },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Essential home decor and kitchenware', sort_order: 3 },
  { name: 'Books', slug: 'books', description: 'Bestsellers across all genres', sort_order: 4 },
  { name: 'Personal Care', slug: 'personal-care', description: 'Skincare, haircare, and wellness products', sort_order: 5 }
];

const products = [
  // Electronics
  {
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'The latest iPhone with Titanium design and A17 Pro chip.',
    price: 999.99,
    original_price: 1099.99,
    category_slug: 'electronics',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d256e?w=800'],
    stock: 50,
    is_featured: true,
    show_on_homepage: true,
    rating: 4.9,
    review_count: 1240,
    tags: ['apple', 'smartphone', 'electronics']
  },
  {
    name: 'MacBook Air M2',
    slug: 'macbook-air-m2',
    description: 'Supercharged by M2, incredibly thin and fast.',
    price: 1199.00,
    original_price: 1299.00,
    category_slug: 'electronics',
    images: ['https://images.unsplash.com/photo-1661961111184-11317b40adb2?w=800'],
    stock: 30,
    is_featured: true,
    show_on_homepage: true,
    rating: 4.8,
    review_count: 850,
    tags: ['laptop', 'apple', 'productivity']
  },
  // Fashion
  {
    name: 'Premium Leather Jacket',
    slug: 'premium-leather-jacket',
    description: 'Classic black leather jacket made from 100% genuine leather.',
    price: 199.99,
    original_price: 249.99,
    category_slug: 'fashion',
    images: ['https://images.unsplash.com/photo-1551028711-031c9a818973?w=800'],
    stock: 45,
    is_featured: true,
    show_on_homepage: true,
    rating: 4.7,
    review_count: 320,
    tags: ['fashion', 'apparel', 'winter']
  },
  {
    name: 'Minimalist White Sneakers',
    slug: 'minimalist-white-sneakers',
    description: 'Clean and versatile sneakers for everyday wear.',
    price: 79.99,
    original_price: 99.99,
    category_slug: 'fashion',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
    stock: 100,
    is_featured: false,
    show_on_homepage: true,
    rating: 4.5,
    review_count: 540,
    tags: ['shoes', 'fashion', 'casual']
  },
  // Home & Kitchen
  {
    name: 'Modern Ceramic Vase Set',
    slug: 'modern-ceramic-vase-set',
    description: 'Set of 3 minimalist ceramic vases for your living room.',
    price: 45.00,
    original_price: 60.00,
    category_slug: 'home-kitchen',
    images: ['https://images.unsplash.com/photo-1581781870027-04212e231e96?w=800'],
    stock: 60,
    is_featured: true,
    show_on_homepage: true,
    rating: 4.8,
    review_count: 150,
    tags: ['home', 'decor', 'interior']
  }
];

async function seed() {
  try {
    console.log('🌱 Starting diverse seeding...');

    for (const cat of categories) {
      await query(
        `INSERT INTO categories (name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE SET 
         name = EXCLUDED.name, 
         description = EXCLUDED.description, 
         sort_order = EXCLUDED.sort_order;`,
        [cat.name, cat.slug, cat.description, cat.sort_order]
      );
    }
    console.log('✅ Categories seeded');

    for (const prod of products) {
      const catResult = await query('SELECT id FROM categories WHERE slug = $1', [prod.category_slug]);
      const category_id = catResult.rows[0]?.id;

      if (category_id) {
        await query(
          `INSERT INTO products (name, slug, description, price, original_price, category_id, images, stock, is_featured, show_on_homepage, rating, review_count, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (slug) DO UPDATE SET
           price = EXCLUDED.price,
           original_price = EXCLUDED.original_price,
           stock = EXCLUDED.stock,
           is_featured = EXCLUDED.is_featured,
           show_on_homepage = EXCLUDED.show_on_homepage;`,
          [
            prod.name, prod.slug, prod.description, prod.price, prod.original_price,
            category_id, prod.images, prod.stock, prod.is_featured,
            prod.show_on_homepage, prod.rating, prod.review_count, prod.tags
          ]
        );
      }
    }
    console.log('✅ Products seeded');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
