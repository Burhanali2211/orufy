import { Router, Request, Response } from 'express';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { products } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Get all products (Tenant Scoped via withStoreContext)
router.get('/', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const allProducts = await withStoreContext(storeId, async (tx) => {
      const query = tx.select().from(products).where(and(eq(products.store_id, storeId), eq(products.is_active, true)));
      return await query.orderBy(desc(products.created_at));
    }, userId);

    res.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get featured products
router.get('/featured', requireStore, async (req: Request, res: Response) => {
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
router.get('/:id', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const product = await withStoreContext(storeId, async (tx) => {
      const [p] = await tx.select()
        .from(products)
        .where(and(eq(products.id, req.params.id as string), eq(products.store_id, storeId), eq(products.is_active, true)));
      return p;
    }, userId);

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export const storefrontProductsRouter = router;
