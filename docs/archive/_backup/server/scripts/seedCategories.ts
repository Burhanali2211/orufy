import { query, initializeDatabase } from '../db/connection';

/**
 * Seed Categories Script
 * Populates the database with perfume categories
 */

const categories = [
  {
    name: 'Perfumes',
    slug: 'perfumes',
    description: 'Luxurious perfumes for every occasion',
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    sort_order: 1
  },
  {
    name: 'Colognes',
    slug: 'colognes',
    description: 'Fresh and invigorating colognes',
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    sort_order: 2
  },
  {
    name: 'Fragrances',
    slug: 'fragrances',
    description: 'Signature fragrances that define you',
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    sort_order: 3
  },
  {
    name: 'Attars',
    slug: 'attars',
    description: 'Traditional attars with rich heritage',
    image_url: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80',
    sort_order: 4
  },
  {
    name: 'Essential Oils',
    slug: 'essential-oils',
    description: 'Pure essential oils for aromatherapy',
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    sort_order: 5
  },
  {
    name: 'Oud Collection',
    slug: 'oud-collection',
    description: 'Premium oud fragrances',
    image_url: 'https://images.unsplash.com/photo-1587556930116-1a5e8e4e8a8e?w=800&q=80',
    sort_order: 6
  },
  {
    name: 'Floral Scents',
    slug: 'floral-scents',
    description: 'Delicate floral fragrances',
    image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80',
    sort_order: 7
  },
  {
    name: 'Woody Fragrances',
    slug: 'woody-fragrances',
    description: 'Earthy and grounding woody scents',
    image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80',
    sort_order: 8
  }
];

async function seedCategories() {
  try {
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();

    console.log('🌱 Starting category seeding...\n');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const category of categories) {
      const sql = `
        INSERT INTO public.categories (name, slug, description, image_url, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
        RETURNING id, name, (xmax = 0) AS inserted
      `;

      const values = [
        category.name,
        category.slug,
        category.description,
        category.image_url,
        category.sort_order
      ];

      const result = await query(sql, values);

      if (result.rows.length > 0) {
        const wasInserted = result.rows[0].inserted;
        if (wasInserted) {
          insertedCount++;
          console.log(`✅ Added: ${result.rows[0].name}`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated: ${result.rows[0].name}`);
        }
      }
    }

    console.log(`\n🎉 Category seeding completed!`);
    console.log(`   - Inserted: ${insertedCount} categories`);
    console.log(`   - Updated: ${updatedCount} categories`);
    console.log(`   - Total: ${insertedCount + updatedCount} categories\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding categories:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding
seedCategories();

