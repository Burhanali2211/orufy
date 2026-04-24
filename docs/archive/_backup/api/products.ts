import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../server/db/connection';

function transformProductRow(row: any): any {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    categoryId: row.category_id,
    category: row.category_name || undefined,
    sellerId: row.seller_id,
    sellerName: row.seller_name || '',
    images: (() => {
      const imgArray = Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []);
      return imgArray
        .filter((img: any) => img && typeof img === 'string' && img.trim() !== '' && img.trim() !== 'null' && img.trim() !== 'undefined')
        .map((img: string) => {
          if (img.startsWith('/uploads') && !img.startsWith('http')) {
            const baseUrl = process.env.FRONTEND_URL || process.env.API_BASE_URL || (process.env.NODE_ENV === 'development' ? `http://localhost:${process.env.PORT || 5000}` : undefined);
            if (baseUrl) {
              const cleanBaseUrl = baseUrl.replace(/\/$/, '');
              const cleanPath = img.startsWith('/') ? img : `/${img}`;
              return `${cleanBaseUrl}${cleanPath}`;
            }
            return img;
          }
          return img;
        });
    })(),
    stock: Number(row.stock) || 0,
    minStockLevel: row.min_stock_level ? Number(row.min_stock_level) : undefined,
    sku: row.sku,
    weight: row.weight ? Number(row.weight) : undefined,
    dimensions: row.dimensions,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    reviews: row.reviews || [],
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []),
    specifications: row.specifications,
    featured: Boolean(row.is_featured),
    showOnHomepage: Boolean(row.show_on_homepage),
    isActive: row.is_active !== false,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variants: row.variants
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // List products with pagination and filtering
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;
    const featured = req.query.featured === 'true';
    const bestSellers = req.query.bestSellers === 'true';
    const latest = req.query.latest === 'true';
    const sellerId = req.query.sellerId as string;
    const showOnHomepage = req.query.showOnHomepage === 'true';

    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];
    let orderByClause = 'ORDER BY created_at DESC';

    if (categoryId) {
      whereClause += ` AND category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (search) {
      whereClause += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    if (featured) {
      whereClause += ` AND is_featured = true`;
    }
    if (showOnHomepage) {
      whereClause += ` AND show_on_homepage = true`;
    }
    if (sellerId) {
      whereClause += ` AND seller_id = $${params.length + 1}`;
      params.push(sellerId);
    }
    if (bestSellers) {
      orderByClause = 'ORDER BY (rating * review_count) DESC, rating DESC, review_count DESC';
    }
    if (latest) {
      orderByClause = 'ORDER BY created_at DESC';
    }
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    const result = await query(
      `SELECT p.id, p.name, p.slug, p.description, p.short_description, p.price, p.original_price,
              p.category_id, p.seller_id, p.images, p.stock, p.rating, p.review_count, 
              p.is_featured, p.tags, p.show_on_homepage, p.created_at,
              c.name as category_name,
              COALESCE(pr.full_name, pr.email, '') as seller_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       LEFT JOIN public.profiles pr ON p.seller_id = pr.id
       ${whereClause.replace(/WHERE/g, 'WHERE p.')}
       ${orderByClause.replace(/created_at/g, 'p.created_at').replace(/rating/g, 'p.rating').replace(/review_count/g, 'p.review_count')}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const transformedProducts = result.rows.map(transformProductRow);
    return res.status(200).json({
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
  res.setHeader('Allow', 'GET');
  res.status(405).json({ error: 'Method Not Allowed' });
}
