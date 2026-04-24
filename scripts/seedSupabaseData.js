// DEPRECATED: This script was for the old Supabase setup.
// Do not run. Kept for migration reference only.

/**
 * Seed Supabase with Islamic lifestyle store data.
 * Clears old dummy data (spices) and inserts:
 *   - Categories: Attars, Perfumes, Oud & Agarwood, Hijabs, Gift Items, Islamic Books, Kids Clothes, Toys
 *   - Sample products for each category
 *   - Site settings for the store
 *
 * Run: node scripts/seedSupabaseData.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------
const categories = [
  { name: 'Attars', slug: 'attars', description: 'Pure concentrated perfume oils — the heart of our collection.', image_url: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80', sort_order: 1, is_active: true },
  { name: 'Perfumes', slug: 'perfumes', description: 'Exquisite alcohol-based and long-lasting perfumes.', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80', sort_order: 2, is_active: true },
  { name: 'Oud & Agarwood', slug: 'oud-agarwood', description: 'Rich, woody fragrances derived from the prized oud tree.', image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', sort_order: 3, is_active: true },
  { name: 'Hijabs', slug: 'hijabs', description: 'Beautiful, modest hijabs and scarves for every occasion.', image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80', sort_order: 4, is_active: true },
  { name: 'Gift Items', slug: 'gift-items', description: 'Thoughtfully curated gift sets for weddings, Eid and celebrations.', image_url: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80', sort_order: 5, is_active: true },
  { name: 'Islamic Books', slug: 'islamic-books', description: 'Qurans, Islamic literature and educational books.', image_url: 'https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80', sort_order: 6, is_active: true },
  { name: 'Kids Clothes', slug: 'kids-clothes', description: 'Adorable and modest clothing for children.', image_url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80', sort_order: 7, is_active: true },
  { name: 'Toys', slug: 'toys', description: 'Fun, educational and Islamic-themed toys for children.', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', sort_order: 8, is_active: true },
];

// ---------------------------------------------------------------------------
// PRODUCTS  (category_slug links to the categories array above)
// ---------------------------------------------------------------------------
const products = [
  // ── Attars ───────────────────────────────────────────────────────────────
  {
    name: 'Rose Attar (10ml)',
    slug: 'rose-attar-10ml',
    description: 'A timeless Damask rose attar distilled using traditional deg-bhapka method. Light, floral and long-lasting — perfect for daily wear and prayer.',
    short_description: 'Pure Damask rose attar, 10ml',
    price: 299,
    original_price: 399,
    category_slug: 'attars',
    images: ['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    stock: 120,
    sku: 'ATT-ROSE-10',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 312,
    tags: ['attar', 'rose', 'floral', 'alcohol-free'],
  },
  {
    name: 'Musk Malaki Attar (6ml)',
    slug: 'musk-malaki-attar-6ml',
    description: 'A warm, rich musk attar with hints of sandalwood and amber. Long-lasting sillage ideal for special occasions and gifting.',
    short_description: 'Rich musk & sandalwood attar, 6ml',
    price: 249,
    original_price: 349,
    category_slug: 'attars',
    images: ['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    stock: 90,
    sku: 'ATT-MUSK-06',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 198,
    tags: ['attar', 'musk', 'sandalwood', 'alcohol-free'],
  },
  {
    name: 'Shamama Attar (12ml)',
    slug: 'shamama-attar-12ml',
    description: 'The legendary Shamama — a complex blend of over 40 botanicals including herbs, flowers and spices. A signature of Aligarh\'s attar craft.',
    short_description: 'Traditional Shamama blend, 12ml',
    price: 549,
    original_price: 699,
    category_slug: 'attars',
    images: ['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    stock: 60,
    sku: 'ATT-SHAM-12',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 275,
    tags: ['attar', 'shamama', 'traditional', 'alcohol-free'],
  },

  // ── Perfumes ─────────────────────────────────────────────────────────────
  {
    name: 'Oud Al Layl EDP (50ml)',
    slug: 'oud-al-layl-edp-50ml',
    description: 'An opulent Eau de Parfum blending oud, rose and amber. Intense and sophisticated — made without alcohol for a pure halal experience.',
    short_description: 'Oud, rose & amber EDP, 50ml',
    price: 1299,
    original_price: 1599,
    category_slug: 'perfumes',
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80'],
    stock: 45,
    sku: 'PER-OUD-50',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 143,
    tags: ['perfume', 'oud', 'edp', 'halal'],
  },
  {
    name: 'Jasmine Mist EDP (30ml)',
    slug: 'jasmine-mist-edp-30ml',
    description: 'A delicate jasmine and white musk perfume. Fresh, feminine and long-lasting — ideal for everyday and office wear.',
    short_description: 'Jasmine & white musk EDP, 30ml',
    price: 799,
    original_price: 999,
    category_slug: 'perfumes',
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80'],
    stock: 70,
    sku: 'PER-JAS-30',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.7,
    review_count: 89,
    tags: ['perfume', 'jasmine', 'floral', 'feminine'],
  },

  // ── Oud & Agarwood ───────────────────────────────────────────────────────
  {
    name: 'Pure Oud Chips (5g)',
    slug: 'pure-oud-chips-5g',
    description: 'Genuine agarwood chips for burning on charcoal. Produces a rich, deep smoke fragrance that fills the home. Sourced from South-East Asia.',
    short_description: 'Genuine agarwood chips for burning',
    price: 1499,
    original_price: 1899,
    category_slug: 'oud-agarwood',
    images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'],
    stock: 35,
    sku: 'OUD-CHIPS-5G',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 167,
    tags: ['oud', 'agarwood', 'bakhoor', 'incense'],
  },
  {
    name: 'Oud Bakhoor (50g)',
    slug: 'oud-bakhoor-50g',
    description: 'Premium bakhoor blended with oud, rose water and natural resins. Burn on charcoal to fill your home with a warm, welcoming fragrance.',
    short_description: 'Premium oud bakhoor, 50g',
    price: 699,
    original_price: 849,
    category_slug: 'oud-agarwood',
    images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'],
    stock: 55,
    sku: 'OUD-BAK-50G',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.7,
    review_count: 112,
    tags: ['bakhoor', 'oud', 'incense', 'home fragrance'],
  },

  // ── Hijabs ───────────────────────────────────────────────────────────────
  {
    name: 'Chiffon Hijab – Dusty Rose',
    slug: 'chiffon-hijab-dusty-rose',
    description: 'Lightweight, breathable chiffon hijab in a soft dusty rose shade. Non-slip, wrinkle-resistant and suitable for all-day wear.',
    short_description: 'Lightweight chiffon hijab, dusty rose',
    price: 299,
    original_price: 399,
    category_slug: 'hijabs',
    images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    stock: 200,
    sku: 'HIJ-CHIF-ROSE',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 421,
    tags: ['hijab', 'chiffon', 'modest fashion', 'scarf'],
  },
  {
    name: 'Jersey Hijab – Black',
    slug: 'jersey-hijab-black',
    description: 'Soft, stretchy jersey hijab in classic black. Easy to style, no pins needed. Machine washable and comfortable for daily use.',
    short_description: 'Stretchy jersey hijab, black',
    price: 249,
    original_price: 299,
    category_slug: 'hijabs',
    images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    stock: 300,
    sku: 'HIJ-JER-BLK',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.7,
    review_count: 584,
    tags: ['hijab', 'jersey', 'modest fashion', 'everyday'],
  },
  {
    name: 'Premium Silk Hijab – Emerald',
    slug: 'premium-silk-hijab-emerald',
    description: 'Luxurious silk-blend hijab in rich emerald green. Perfect for weddings, Eid and special occasions. Comes in a beautiful gift box.',
    short_description: 'Silk-blend hijab, emerald green',
    price: 649,
    original_price: 799,
    category_slug: 'hijabs',
    images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    stock: 80,
    sku: 'HIJ-SILK-EMR',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 203,
    tags: ['hijab', 'silk', 'wedding', 'eid', 'gift'],
  },

  // ── Gift Items ───────────────────────────────────────────────────────────
  {
    name: 'Eid Gift Hamper – Attar & Bakhoor',
    slug: 'eid-gift-hamper-attar-bakhoor',
    description: 'A beautifully presented Eid gift hamper containing two premium attars (rose & musk) and a 50g bakhoor, packaged in a luxury gift box with ribbon.',
    short_description: 'Eid hamper: 2 attars + bakhoor',
    price: 999,
    original_price: 1299,
    category_slug: 'gift-items',
    images: ['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80'],
    stock: 50,
    sku: 'GIFT-EID-01',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 178,
    tags: ['gift', 'eid', 'hamper', 'attar', 'bakhoor'],
  },
  {
    name: 'Nikah Gift Box – Luxury Set',
    slug: 'nikah-gift-box-luxury',
    description: 'An elegant nikah gift box with a silk hijab, rose attar, Quran bookmark set and luxury wrapping. A perfect gift for the bride.',
    short_description: 'Nikah luxury gift set for bride',
    price: 1499,
    original_price: 1899,
    category_slug: 'gift-items',
    images: ['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80'],
    stock: 30,
    sku: 'GIFT-NIK-01',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 5.0,
    review_count: 94,
    tags: ['gift', 'nikah', 'wedding', 'bride', 'luxury'],
  },

  // ── Islamic Books ────────────────────────────────────────────────────────
  {
    name: 'The Holy Quran – Translation & Tafsir (Hardcover)',
    slug: 'holy-quran-translation-tafsir-hardcover',
    description: 'A beautiful hardcover Quran with clear Arabic text, English translation and brief tafsir notes. Large, easy-to-read font. Ideal for learning and gifting.',
    short_description: 'Quran with English translation & tafsir',
    price: 699,
    original_price: 899,
    category_slug: 'islamic-books',
    images: ['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    stock: 150,
    sku: 'BOOK-QURAN-HC',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 532,
    tags: ['quran', 'islamic books', 'tafsir', 'gift'],
  },
  {
    name: 'Fortress of the Muslim (Hisnul Muslim)',
    slug: 'hisnul-muslim-fortress-of-the-muslim',
    description: 'The essential pocket dua book — over 200 authenticated supplications for every situation. Available in Arabic with English transliteration and translation.',
    short_description: 'Pocket dua book — Hisnul Muslim',
    price: 199,
    original_price: 249,
    category_slug: 'islamic-books',
    images: ['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    stock: 200,
    sku: 'BOOK-HISN-01',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 389,
    tags: ['dua', 'supplication', 'islamic books', 'pocket book'],
  },
  {
    name: 'Stories of the Prophets – Illustrated Edition',
    slug: 'stories-of-the-prophets-illustrated',
    description: 'A richly illustrated book of prophetic stories for young readers. Covers 25 prophets with engaging text, beautiful illustrations and lessons from each story.',
    short_description: 'Illustrated stories of 25 prophets',
    price: 499,
    original_price: 599,
    category_slug: 'islamic-books',
    images: ['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    stock: 100,
    sku: 'BOOK-PROP-IL',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 267,
    tags: ['islamic books', 'children', 'prophets', 'illustrated'],
  },

  // ── Kids Clothes ─────────────────────────────────────────────────────────
  {
    name: 'Boys Kurta Pyjama Set – White (2–8 yrs)',
    slug: 'boys-kurta-pyjama-set-white',
    description: 'Classic white cotton kurta pyjama for boys. Comfortable, breathable and perfect for Eid, Friday prayers and casual occasions. Available in sizes 2 to 8 years.',
    short_description: 'White cotton kurta pyjama, boys 2–8 yrs',
    price: 499,
    original_price: 649,
    category_slug: 'kids-clothes',
    images: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    stock: 120,
    sku: 'KIDS-KUR-WHT',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 214,
    tags: ['kids', 'kurta', 'boys', 'eid', 'cotton'],
  },
  {
    name: 'Girls Abaya – Embroidered (4–12 yrs)',
    slug: 'girls-abaya-embroidered',
    description: 'Beautiful embroidered abaya for girls in soft black with floral embroidery at the cuffs and hem. Light fabric, easy to wear and wash.',
    short_description: 'Embroidered abaya for girls 4–12 yrs',
    price: 699,
    original_price: 899,
    category_slug: 'kids-clothes',
    images: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    stock: 80,
    sku: 'KIDS-ABA-EMB',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 176,
    tags: ['kids', 'abaya', 'girls', 'eid', 'modest fashion'],
  },
  {
    name: 'Kids Prayer Cap – White Knit',
    slug: 'kids-prayer-cap-white-knit',
    description: 'Soft, stretchy white knitted prayer cap for boys. Machine washable. Available in sizes toddler, small and medium. Great Eid gift.',
    short_description: 'White knitted prayer cap, kids',
    price: 149,
    original_price: 199,
    category_slug: 'kids-clothes',
    images: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    stock: 250,
    sku: 'KIDS-CAP-WHT',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.7,
    review_count: 322,
    tags: ['kids', 'prayer cap', 'boys', 'topi'],
  },

  // ── Toys ─────────────────────────────────────────────────────────────────
  {
    name: 'Learn Arabic Alphabet – Wooden Puzzle',
    slug: 'learn-arabic-alphabet-wooden-puzzle',
    description: 'Colorful wooden puzzle featuring all 28 Arabic letters. Each piece is chunky and easy for small hands to grip. Helps children learn the alphabet through play.',
    short_description: 'Arabic alphabet wooden puzzle, 28 letters',
    price: 599,
    original_price: 749,
    category_slug: 'toys',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    stock: 90,
    sku: 'TOY-ARB-PUZ',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.9,
    review_count: 301,
    tags: ['toys', 'arabic', 'educational', 'puzzle', 'kids'],
  },
  {
    name: 'My First Quran Board Book',
    slug: 'my-first-quran-board-book',
    description: 'Thick board-book version of selected Quranic surahs for toddlers. Large Arabic text with colourful illustrations and English meanings. Durable and wipe-clean.',
    short_description: 'Quran board book for toddlers',
    price: 349,
    original_price: 449,
    category_slug: 'toys',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    stock: 130,
    sku: 'TOY-QUR-BB',
    is_featured: true,
    show_on_homepage: true,
    is_active: true,
    rating: 4.8,
    review_count: 245,
    tags: ['toys', 'quran', 'toddler', 'board book', 'educational'],
  },
  {
    name: 'Islamic Heroes Action Figure Set',
    slug: 'islamic-heroes-action-figure-set',
    description: 'A set of 4 collectible action figures inspired by great Muslim historical figures. Comes with mini biography cards. Age 5+.',
    short_description: 'Islamic historical figures action set, 4 pcs',
    price: 799,
    original_price: 999,
    category_slug: 'toys',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    stock: 55,
    sku: 'TOY-HERO-SET',
    is_featured: false,
    show_on_homepage: true,
    is_active: true,
    rating: 4.7,
    review_count: 118,
    tags: ['toys', 'action figures', 'islamic history', 'kids'],
  },
];

// ---------------------------------------------------------------------------
// SITE SETTINGS  (updated for an Islamic lifestyle store)
// ---------------------------------------------------------------------------
const siteSettings = [
  { setting_key: 'site_name',            setting_value: 'Aligarh Attars',                           setting_type: 'text',  category: 'general',  description: 'Website name',                   is_public: true },
  { setting_key: 'site_description',     setting_value: 'Pure Attars, Perfumes & Islamic Lifestyle Products', setting_type: 'text', category: 'general', description: 'Website tagline', is_public: true },
  { setting_key: 'contact_email',        setting_value: 'info@aligarhattar.com',                    setting_type: 'email', category: 'contact',  description: 'Contact email',                  is_public: true },
  { setting_key: 'contact_phone',        setting_value: '+91-9876543210',                           setting_type: 'text',  category: 'contact',  description: 'Contact phone',                  is_public: true },
  { setting_key: 'currency',             setting_value: 'INR',                                      setting_type: 'text',  category: 'general',  description: 'Default currency',               is_public: true },
  { setting_key: 'free_shipping_threshold', setting_value: '499',                                   setting_type: 'number',category: 'shipping', description: 'Free shipping above this amount', is_public: true },
  { setting_key: 'logo_url',             setting_value: '/logo.png',                                setting_type: 'text',  category: 'general',  description: 'Site logo URL',                  is_public: true },
];

// ---------------------------------------------------------------------------
// SEED FUNCTION
// ---------------------------------------------------------------------------
async function seedDatabase() {
  try {
    console.log('🌱 Seeding Islamic lifestyle store data...\n');

    // ── 1. Clear old products ───────────────────────────────────────────────
    console.log('🗑️  Deleting old products...');
    const { error: delProductsErr } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delProductsErr) console.error('  ❌ Could not delete products:', delProductsErr.message);
    else console.log('  ✅ Old products removed');

    // ── 2. Clear old categories ─────────────────────────────────────────────
    console.log('\n🗑️  Deleting old categories...');
    const { error: delCatsErr } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delCatsErr) console.error('  ❌ Could not delete categories:', delCatsErr.message);
    else console.log('  ✅ Old categories removed');

    // ── 3. Seed new categories ──────────────────────────────────────────────
    console.log('\n📁 Seeding categories...');
    for (const category of categories) {
      const { error } = await supabase.from('categories').upsert(category, { onConflict: 'slug' });
      if (error) console.error(`  ❌ ${category.name}:`, error.message);
      else console.log(`  ✅ ${category.name}`);
    }

    // Build slug → id map
    const { data: categoryData } = await supabase.from('categories').select('id, slug');
    const categoryMap = {};
    categoryData?.forEach(cat => { categoryMap[cat.slug] = cat.id; });

    // ── 4. Seed new products ────────────────────────────────────────────────
    console.log('\n📦 Seeding products...');
    for (const product of products) {
      const categoryId = categoryMap[product.category_slug];
      if (!categoryId) {
        console.error(`  ⚠️  Category not found for: ${product.name} (slug: ${product.category_slug})`);
        continue;
      }
      const { category_slug, ...productData } = product;
      productData.category_id = categoryId;
      const { error } = await supabase.from('products').upsert(productData, { onConflict: 'slug' });
      if (error) console.error(`  ❌ ${product.name}:`, error.message);
      else console.log(`  ✅ ${product.name}`);
    }

    // ── 5. Seed site settings ───────────────────────────────────────────────
    console.log('\n⚙️  Seeding site settings...');
    for (const setting of siteSettings) {
      const { error } = await supabase.from('site_settings').upsert(setting, { onConflict: 'setting_key' });
      if (error) console.error(`  ❌ ${setting.setting_key}:`, error.message);
      else console.log(`  ✅ ${setting.setting_key}`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
