import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { products } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all products (Tenant Scoped via withStoreContext)
router.get('/', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const allProducts = await withStoreContext(storeId, async (tx) => {
      let query = tx.select().from(products).where(eq(products.store_id, storeId));
      return await query.orderBy(desc(products.created_at));
    }, userId);

    res.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get featured products
router.get('/featured', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const featured = await withStoreContext(storeId, async (tx) => {
      // First try explicit featured products
      const specificFeatured = await tx.select().from(products)
        .where(and(eq(products.store_id, storeId), eq(products.is_featured, true), eq(products.is_active, true)))
        .orderBy(desc(products.created_at));

      if (specificFeatured.length > 0) {
        return specificFeatured;
      }

      // If no explicit featured, return products marked for homepage
      const homepageProducts = await tx.select().from(products)
        .where(and(eq(products.store_id, storeId), eq(products.show_on_homepage, true), eq(products.is_active, true)))
        .orderBy(desc(products.created_at));

      if (homepageProducts.length > 0) {
        return homepageProducts;
      }

      // Otherwise return all active products
      return await tx.select().from(products)
        .where(and(eq(products.store_id, storeId), eq(products.is_active, true)))
        .orderBy(desc(products.created_at));
    }, userId);

    res.json(featured);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get product by id
router.get('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const product = await withStoreContext(storeId, async (tx) => {
      const [p] = await tx.select()
        .from(products)
        .where(and(eq(products.id as any, req.params.id as any), eq(products.store_id as any, storeId as any)));
      return p;
    }, userId);

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Admin only routes below
router.use(requireAuth);

router.post('/', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const body = req.body || {};
    const newProduct: any = {
      id: uuidv4(),
      store_id: storeId,
      name: body.name?.trim(),
      slug: body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description || null,
      short_description: body.short_description || null,
      price: body.price != null ? Math.round(parseFloat(body.price)) : 0,
      original_price: body.original_price != null ? Math.round(parseFloat(body.original_price)) : null,
      category_id: body.category_id || null,
      stock: body.stock != null ? parseInt(body.stock, 10) : 100,
      min_stock_level: body.min_stock_level != null ? parseInt(body.min_stock_level, 10) : 5,
      sku: body.sku || null,
      tags: Array.isArray(body.tags) ? body.tags : null,
      specifications: body.specifications || null,
      images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
      is_featured: body.is_featured === true || body.is_featured === 'true' || body.is_featured === 1,
      show_on_homepage: body.show_on_homepage === undefined ? true : (body.show_on_homepage === true || body.show_on_homepage === 'true' || body.show_on_homepage === 1),
      is_active: body.is_active === undefined ? true : (body.is_active !== false && body.is_active !== 'false' && body.is_active !== 0),
      attributes: typeof body.attributes === 'object' ? body.attributes : {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    const created = await withStoreContext(storeId, async (tx) => {
      const [p] = await tx.insert(products).values(newProduct).returning();
      return p;
    }, userId);

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    const body = req.body || {};

    const updateData: any = {
      updated_at: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.short_description !== undefined) updateData.short_description = body.short_description;
    if (body.price !== undefined) updateData.price = Math.round(parseFloat(body.price));
    if (body.original_price !== undefined) updateData.original_price = body.original_price != null ? Math.round(parseFloat(body.original_price)) : null;
    if (body.category_id !== undefined) updateData.category_id = body.category_id || null;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock, 10);
    if (body.min_stock_level !== undefined) updateData.min_stock_level = parseInt(body.min_stock_level, 10);
    if (body.sku !== undefined) updateData.sku = body.sku || null;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : null;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []);
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured === true || body.is_featured === 'true' || body.is_featured === 1;
    if (body.show_on_homepage !== undefined) updateData.show_on_homepage = body.show_on_homepage === true || body.show_on_homepage === 'true' || body.show_on_homepage === 1;
    if (body.is_active !== undefined) updateData.is_active = body.is_active !== false && body.is_active !== 'false' && body.is_active !== 0;
    if (body.attributes !== undefined) updateData.attributes = typeof body.attributes === 'object' ? body.attributes : {};

    const updated = await withStoreContext(storeId, async (tx) => {
      const [p] = await tx.update(products)
        .set(updateData)
        .where(and(eq(products.id as any, req.params.id as any), eq(products.store_id as any, storeId as any)))
        .returning();
      return p;
    }, userId);

    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const deleted = await withStoreContext(storeId, async (tx) => {
      const [p] = await tx.delete(products)
        .where(and(eq(products.id as any, req.params.id as any), eq(products.store_id as any, storeId as any)))
        .returning();
      return p;
    }, userId);

    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export const productsRouter = router;
