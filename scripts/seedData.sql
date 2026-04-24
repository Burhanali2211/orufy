-- =============================================================================
-- seedData.sql
-- Clears old dummy data and inserts Islamic lifestyle store categories + products.
-- Run via: psql <connection-string> -f scripts/seedData.sql
-- =============================================================================

-- 1. Delete old products (all)
DELETE FROM public.products;

-- 2. Delete old categories (all)
DELETE FROM public.categories;

-- =============================================================================
-- 3. Insert new categories
-- =============================================================================
INSERT INTO public.categories (name, slug, description, image_url, sort_order, is_active)
VALUES
  ('Attars',        'attars',        'Pure concentrated perfume oils — the heart of our collection.',         'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80', 1, true),
  ('Perfumes',      'perfumes',      'Exquisite alcohol-based and long-lasting perfumes.',                    'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80', 2, true),
  ('Oud & Agarwood','oud-agarwood',  'Rich, woody fragrances derived from the prized oud tree.',             'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', 3, true),
  ('Hijabs',        'hijabs',        'Beautiful, modest hijabs and scarves for every occasion.',              'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80', 4, true),
  ('Gift Items',    'gift-items',    'Thoughtfully curated gift sets for weddings, Eid and celebrations.',   'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80', 5, true),
  ('Islamic Books', 'islamic-books', 'Qurans, Islamic literature and educational books.',                    'https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80', 6, true),
  ('Kids Clothes',  'kids-clothes',  'Adorable and modest clothing for children.',                           'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80', 7, true),
  ('Toys',          'toys',          'Fun, educational and Islamic-themed toys for children.',                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 8, true)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      updated_at = now();

-- =============================================================================
-- 4. Insert products (using subqueries to resolve category IDs)
-- =============================================================================

-- ── Attars ───────────────────────────────────────────────────────────────────
INSERT INTO public.products
  (name, slug, description, short_description, price, original_price, category_id, images, stock, sku, is_featured, show_on_homepage, is_active, rating, review_count, tags)
VALUES
  (
    'Rose Attar (10ml)', 'rose-attar-10ml',
    'A timeless Damask rose attar distilled using traditional deg-bhapka method. Light, floral and long-lasting — perfect for daily wear and prayer.',
    'Pure Damask rose attar, 10ml',
    299, 399, (SELECT id FROM public.categories WHERE slug = 'attars'),
    ARRAY['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    120, 'ATT-ROSE-10', true, true, true, 4.9, 312,
    ARRAY['attar','rose','floral','alcohol-free']
  ),
  (
    'Musk Malaki Attar (6ml)', 'musk-malaki-attar-6ml',
    'A warm, rich musk attar with hints of sandalwood and amber. Long-lasting sillage ideal for special occasions and gifting.',
    'Rich musk & sandalwood attar, 6ml',
    249, 349, (SELECT id FROM public.categories WHERE slug = 'attars'),
    ARRAY['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    90, 'ATT-MUSK-06', true, true, true, 4.8, 198,
    ARRAY['attar','musk','sandalwood','alcohol-free']
  ),
  (
    'Shamama Attar (12ml)', 'shamama-attar-12ml',
    'The legendary Shamama — a complex blend of over 40 botanicals including herbs, flowers and spices. A signature of Aligarh''s attar craft.',
    'Traditional Shamama blend, 12ml',
    549, 699, (SELECT id FROM public.categories WHERE slug = 'attars'),
    ARRAY['https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80'],
    60, 'ATT-SHAM-12', true, true, true, 4.9, 275,
    ARRAY['attar','shamama','traditional','alcohol-free']
  ),

-- ── Perfumes ──────────────────────────────────────────────────────────────────
  (
    'Oud Al Layl EDP (50ml)', 'oud-al-layl-edp-50ml',
    'An opulent Eau de Parfum blending oud, rose and amber. Intense and sophisticated — made without alcohol for a pure halal experience.',
    'Oud, rose & amber EDP, 50ml',
    1299, 1599, (SELECT id FROM public.categories WHERE slug = 'perfumes'),
    ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80'],
    45, 'PER-OUD-50', true, true, true, 4.8, 143,
    ARRAY['perfume','oud','edp','halal']
  ),
  (
    'Jasmine Mist EDP (30ml)', 'jasmine-mist-edp-30ml',
    'A delicate jasmine and white musk perfume. Fresh, feminine and long-lasting — ideal for everyday and office wear.',
    'Jasmine & white musk EDP, 30ml',
    799, 999, (SELECT id FROM public.categories WHERE slug = 'perfumes'),
    ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80'],
    70, 'PER-JAS-30', false, true, true, 4.7, 89,
    ARRAY['perfume','jasmine','floral','feminine']
  ),

-- ── Oud & Agarwood ────────────────────────────────────────────────────────────
  (
    'Pure Oud Chips (5g)', 'pure-oud-chips-5g',
    'Genuine agarwood chips for burning on charcoal. Produces a rich, deep smoke fragrance that fills the home. Sourced from South-East Asia.',
    'Genuine agarwood chips for burning',
    1499, 1899, (SELECT id FROM public.categories WHERE slug = 'oud-agarwood'),
    ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'],
    35, 'OUD-CHIPS-5G', true, true, true, 4.9, 167,
    ARRAY['oud','agarwood','bakhoor','incense']
  ),
  (
    'Oud Bakhoor (50g)', 'oud-bakhoor-50g',
    'Premium bakhoor blended with oud, rose water and natural resins. Burn on charcoal to fill your home with a warm, welcoming fragrance.',
    'Premium oud bakhoor, 50g',
    699, 849, (SELECT id FROM public.categories WHERE slug = 'oud-agarwood'),
    ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80'],
    55, 'OUD-BAK-50G', false, true, true, 4.7, 112,
    ARRAY['bakhoor','oud','incense','home fragrance']
  ),

-- ── Hijabs ────────────────────────────────────────────────────────────────────
  (
    'Chiffon Hijab – Dusty Rose', 'chiffon-hijab-dusty-rose',
    'Lightweight, breathable chiffon hijab in a soft dusty rose shade. Non-slip, wrinkle-resistant and suitable for all-day wear.',
    'Lightweight chiffon hijab, dusty rose',
    299, 399, (SELECT id FROM public.categories WHERE slug = 'hijabs'),
    ARRAY['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    200, 'HIJ-CHIF-ROSE', true, true, true, 4.8, 421,
    ARRAY['hijab','chiffon','modest fashion','scarf']
  ),
  (
    'Jersey Hijab – Black', 'jersey-hijab-black',
    'Soft, stretchy jersey hijab in classic black. Easy to style, no pins needed. Machine washable and comfortable for daily use.',
    'Stretchy jersey hijab, black',
    249, 299, (SELECT id FROM public.categories WHERE slug = 'hijabs'),
    ARRAY['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    300, 'HIJ-JER-BLK', false, true, true, 4.7, 584,
    ARRAY['hijab','jersey','modest fashion','everyday']
  ),
  (
    'Premium Silk Hijab – Emerald', 'premium-silk-hijab-emerald',
    'Luxurious silk-blend hijab in rich emerald green. Perfect for weddings, Eid and special occasions. Comes in a beautiful gift box.',
    'Silk-blend hijab, emerald green',
    649, 799, (SELECT id FROM public.categories WHERE slug = 'hijabs'),
    ARRAY['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80'],
    80, 'HIJ-SILK-EMR', true, true, true, 4.9, 203,
    ARRAY['hijab','silk','wedding','eid','gift']
  ),

-- ── Gift Items ────────────────────────────────────────────────────────────────
  (
    'Eid Gift Hamper – Attar & Bakhoor', 'eid-gift-hamper-attar-bakhoor',
    'A beautifully presented Eid gift hamper containing two premium attars (rose & musk) and a 50g bakhoor, packaged in a luxury gift box with ribbon.',
    'Eid hamper: 2 attars + bakhoor',
    999, 1299, (SELECT id FROM public.categories WHERE slug = 'gift-items'),
    ARRAY['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80'],
    50, 'GIFT-EID-01', true, true, true, 4.9, 178,
    ARRAY['gift','eid','hamper','attar','bakhoor']
  ),
  (
    'Nikah Gift Box – Luxury Set', 'nikah-gift-box-luxury',
    'An elegant nikah gift box with a silk hijab, rose attar, Quran bookmark set and luxury wrapping. A perfect gift for the bride.',
    'Nikah luxury gift set for bride',
    1499, 1899, (SELECT id FROM public.categories WHERE slug = 'gift-items'),
    ARRAY['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80'],
    30, 'GIFT-NIK-01', true, true, true, 5.0, 94,
    ARRAY['gift','nikah','wedding','bride','luxury']
  ),

-- ── Islamic Books ─────────────────────────────────────────────────────────────
  (
    'The Holy Quran – Translation & Tafsir (Hardcover)', 'holy-quran-translation-tafsir-hardcover',
    'A beautiful hardcover Quran with clear Arabic text, English translation and brief tafsir notes. Large, easy-to-read font. Ideal for learning and gifting.',
    'Quran with English translation & tafsir',
    699, 899, (SELECT id FROM public.categories WHERE slug = 'islamic-books'),
    ARRAY['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    150, 'BOOK-QURAN-HC', true, true, true, 4.9, 532,
    ARRAY['quran','islamic books','tafsir','gift']
  ),
  (
    'Fortress of the Muslim (Hisnul Muslim)', 'hisnul-muslim-fortress-of-the-muslim',
    'The essential pocket dua book — over 200 authenticated supplications for every situation. Available in Arabic with English transliteration and translation.',
    'Pocket dua book — Hisnul Muslim',
    199, 249, (SELECT id FROM public.categories WHERE slug = 'islamic-books'),
    ARRAY['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    200, 'BOOK-HISN-01', false, true, true, 4.8, 389,
    ARRAY['dua','supplication','islamic books','pocket book']
  ),
  (
    'Stories of the Prophets – Illustrated Edition', 'stories-of-the-prophets-illustrated',
    'A richly illustrated book of prophetic stories for young readers. Covers 25 prophets with engaging text, beautiful illustrations and lessons from each story.',
    'Illustrated stories of 25 prophets',
    499, 599, (SELECT id FROM public.categories WHERE slug = 'islamic-books'),
    ARRAY['https://images.unsplash.com/photo-1585241936939-be4099591252?w=800&q=80'],
    100, 'BOOK-PROP-IL', true, true, true, 4.9, 267,
    ARRAY['islamic books','children','prophets','illustrated']
  ),

-- ── Kids Clothes ──────────────────────────────────────────────────────────────
  (
    'Boys Kurta Pyjama Set – White (2–8 yrs)', 'boys-kurta-pyjama-set-white',
    'Classic white cotton kurta pyjama for boys. Comfortable, breathable and perfect for Eid, Friday prayers and casual occasions. Available in sizes 2 to 8 years.',
    'White cotton kurta pyjama, boys 2–8 yrs',
    499, 649, (SELECT id FROM public.categories WHERE slug = 'kids-clothes'),
    ARRAY['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    120, 'KIDS-KUR-WHT', true, true, true, 4.8, 214,
    ARRAY['kids','kurta','boys','eid','cotton']
  ),
  (
    'Girls Abaya – Embroidered (4–12 yrs)', 'girls-abaya-embroidered',
    'Beautiful embroidered abaya for girls in soft black with floral embroidery at the cuffs and hem. Light fabric, easy to wear and wash.',
    'Embroidered abaya for girls 4–12 yrs',
    699, 899, (SELECT id FROM public.categories WHERE slug = 'kids-clothes'),
    ARRAY['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    80, 'KIDS-ABA-EMB', true, true, true, 4.9, 176,
    ARRAY['kids','abaya','girls','eid','modest fashion']
  ),
  (
    'Kids Prayer Cap – White Knit', 'kids-prayer-cap-white-knit',
    'Soft, stretchy white knitted prayer cap for boys. Machine washable. Available in sizes toddler, small and medium. Great Eid gift.',
    'White knitted prayer cap, kids',
    149, 199, (SELECT id FROM public.categories WHERE slug = 'kids-clothes'),
    ARRAY['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    250, 'KIDS-CAP-WHT', false, true, true, 4.7, 322,
    ARRAY['kids','prayer cap','boys','topi']
  ),

-- ── Toys ──────────────────────────────────────────────────────────────────────
  (
    'Learn Arabic Alphabet – Wooden Puzzle', 'learn-arabic-alphabet-wooden-puzzle',
    'Colorful wooden puzzle featuring all 28 Arabic letters. Each piece is chunky and easy for small hands to grip. Helps children learn the alphabet through play.',
    'Arabic alphabet wooden puzzle, 28 letters',
    599, 749, (SELECT id FROM public.categories WHERE slug = 'toys'),
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    90, 'TOY-ARB-PUZ', true, true, true, 4.9, 301,
    ARRAY['toys','arabic','educational','puzzle','kids']
  ),
  (
    'My First Quran Board Book', 'my-first-quran-board-book',
    'Thick board-book version of selected Quranic surahs for toddlers. Large Arabic text with colourful illustrations and English meanings. Durable and wipe-clean.',
    'Quran board book for toddlers',
    349, 449, (SELECT id FROM public.categories WHERE slug = 'toys'),
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    130, 'TOY-QUR-BB', true, true, true, 4.8, 245,
    ARRAY['toys','quran','toddler','board book','educational']
  ),
  (
    'Islamic Heroes Action Figure Set', 'islamic-heroes-action-figure-set',
    'A set of 4 collectible action figures inspired by great Muslim historical figures. Comes with mini biography cards. Age 5+.',
    'Islamic historical figures action set, 4 pcs',
    799, 999, (SELECT id FROM public.categories WHERE slug = 'toys'),
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    55, 'TOY-HERO-SET', false, true, true, 4.7, 118,
    ARRAY['toys','action figures','islamic history','kids']
  )
ON CONFLICT (slug) DO UPDATE
  SET name              = EXCLUDED.name,
      description       = EXCLUDED.description,
      short_description = EXCLUDED.short_description,
      price             = EXCLUDED.price,
      original_price    = EXCLUDED.original_price,
      category_id       = EXCLUDED.category_id,
      images            = EXCLUDED.images,
      stock             = EXCLUDED.stock,
      sku               = EXCLUDED.sku,
      is_featured       = EXCLUDED.is_featured,
      show_on_homepage  = EXCLUDED.show_on_homepage,
      is_active         = EXCLUDED.is_active,
      rating            = EXCLUDED.rating,
      review_count      = EXCLUDED.review_count,
      tags              = EXCLUDED.tags,
      updated_at        = now();

-- Done
SELECT 'Categories: ' || count(*)::text FROM public.categories;
SELECT 'Products: '   || count(*)::text FROM public.products;
