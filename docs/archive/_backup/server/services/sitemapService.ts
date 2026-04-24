/**
 * Sitemap Service
 * 
 * Generates XML sitemap for SEO
 */

import { query } from '../db';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap
 */
export async function generateSitemap(baseUrl: string): Promise<string> {
  const urls: SitemapUrl[] = [];

  // Add static pages
  urls.push(
    {
      loc: `${baseUrl}/`,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/products`,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/categories`,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/collections`,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/new-arrivals`,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/deals`,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/about`,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/privacy-policy`,
      changefreq: 'monthly',
      priority: 0.4
    },
    {
      loc: `${baseUrl}/terms-of-service`,
      changefreq: 'monthly',
      priority: 0.4
    },
    {
      loc: `${baseUrl}/refund-policy`,
      changefreq: 'monthly',
      priority: 0.4
    },
    {
      loc: `${baseUrl}/shipping-policy`,
      changefreq: 'monthly',
      priority: 0.4
    }
  );

  // Add product pages
  try {
    const productsResult = await query(
      `SELECT id, slug, updated_at 
       FROM public.products 
       WHERE is_active = true 
       ORDER BY updated_at DESC`
    );

    productsResult.rows.forEach((product) => {
      urls.push({
        loc: `${baseUrl}/products/${product.id}`,
        lastmod: new Date(product.updated_at).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7
      });
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Add category pages
  try {
    const categoriesResult = await query(
      `SELECT id, slug, updated_at 
       FROM public.categories 
       WHERE is_active = true 
       ORDER BY name`
    );

    categoriesResult.rows.forEach((category) => {
      urls.push({
        loc: `${baseUrl}/categories/${category.slug || category.id}`,
        lastmod: new Date(category.updated_at).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7
      });
    });
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // Generate XML
  return generateSitemapXML(urls);
}

/**
 * Generate XML from URLs
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n`;
    
    if (url.lastmod) {
      entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority !== undefined) {
      entry += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    
    entry += `  </url>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generate sitemap index (for large sites with multiple sitemaps)
 */
export function generateSitemapIndex(baseUrl: string, sitemaps: string[]): string {
  const sitemapEntries = sitemaps.map(sitemap => {
    return `  <sitemap>
    <loc>${escapeXml(`${baseUrl}/${sitemap}`)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

