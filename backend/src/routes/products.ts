import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all products (Tenant Scoped via withStoreContext)
router.get('/', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const allProducts = await withStoreContext(storeId, async (tx) => {
      return await tx.select().from(products).where(eq(products.store_id, storeId));
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
      return await tx.select().from(products)// @ts-ignore
        .where(and(eq(products.store_id, storeId), eq(products.is_featured, true)));
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
        // @ts-ignore
        .where(and(eq(products.id, req.params.id), eq(products.store_id, storeId)));
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
    
    const newProduct = {
      id: uuidv4(),
      store_id: storeId,
      ...req.body
    };

    const created = await withStoreContext(storeId, async (tx) => {
      const [p] = await // @ts-ignore
      tx.insert(products).values(newProduct).returning();
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

    const updated = await withStoreContext(storeId, async (tx) => {
      const [p] = await // @ts-ignore
      tx.update(products)
        .set(req.body)
        // @ts-ignore
        .where(and(eq(products.id, req.params.id), eq(products.store_id, storeId)))
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
      const [p] = await // @ts-ignore
      tx.delete(products)
        // @ts-ignore
        .where(and(eq(products.id, req.params.id), eq(products.store_id, storeId)))
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
