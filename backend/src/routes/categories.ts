import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { categories } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all categories (Tenant Scoped via withStoreContext)
router.get('/', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const allCategories = await withStoreContext(storeId, async (tx) => {
      return await tx.select().from(categories)
        .where(eq(categories.store_id, storeId))
        .orderBy(desc(categories.sort_order));
    }, userId);

    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by id
router.get('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const category = await withStoreContext(storeId, async (tx) => {
      const [c] = await tx.select()
        .from(categories)
        // @ts-ignore
        .where(and(eq(categories.id, req.params.id), eq(categories.store_id, storeId)));
      return c;
    }, userId);

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Admin only routes below
router.use(requireAuth);

router.post('/', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    
    const newCategory = {
      id: uuidv4(),
      store_id: storeId,
      ...req.body
    };

    const created = await withStoreContext(storeId, async (tx) => {
      const [c] = await // @ts-ignore
      tx.insert(categories).values(newCategory).returning();
      return c;
    }, userId);

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const updated = await withStoreContext(storeId, async (tx) => {
      const [c] = await // @ts-ignore
      tx.update(categories)
        .set(req.body)
        // @ts-ignore
        .where(and(eq(categories.id, req.params.id), eq(categories.store_id, storeId)))
        .returning();
      return c;
    }, userId);

    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', requireStore, async (req, res) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const deleted = await withStoreContext(storeId, async (tx) => {
      const [c] = await // @ts-ignore
      tx.delete(categories)
        // @ts-ignore
        .where(and(eq(categories.id, req.params.id), eq(categories.store_id, storeId)))
        .returning();
      return c;
    }, userId);

    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export const categoriesRouter = router;
