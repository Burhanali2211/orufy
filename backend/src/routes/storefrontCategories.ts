import { Router, Request, Response } from 'express';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { categories } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Get all categories (Tenant Scoped via withStoreContext)
router.get('/', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const allCategories = await withStoreContext(storeId, async (tx) => {
      const query = tx.select().from(categories).where(and(eq(categories.store_id, storeId), eq(categories.is_active, true)));
      return await query.orderBy(desc(categories.sort_order), desc(categories.created_at));
    }, userId);

    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by id
router.get('/:id', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const category = await withStoreContext(storeId, async (tx) => {
      const [c] = await tx.select()
        .from(categories)
        .where(and(eq(categories.id, req.params.id as string), eq(categories.store_id, storeId), eq(categories.is_active, true)));
      return c;
    }, userId);

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

export const storefrontCategoriesRouter = router;
