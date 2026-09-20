import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/db';
import { requireAuth } from '../middleware/auth';
import { requireStore, getUserPrimaryStore, getOrCreateDefaultStore } from '../middleware/storeResolver';
import { withStoreContext, withUserContext } from '../db/utils';
import { categories, store_members } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware: Verify store admin / owner / seller membership
const requireStoreMember = async (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;
  let storeId = res.locals.storeId;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!storeId && user.id) {
    let userStore = await getUserPrimaryStore(user.id);
    if (!userStore) {
      const host = (req.headers.host || req.hostname || "").toString().toLowerCase();
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        userStore = await getOrCreateDefaultStore();
        if (userStore) {
          await withUserContext(user.id, async (tx) => {
            await tx.insert(store_members).values({ store_id: userStore.id, user_id: user.id, role: 'owner' }).onConflictDoNothing();
          });
        }
      }
    }
    if (userStore) {
      storeId = userStore.id;
      res.locals.storeId = userStore.id;
      res.locals.store = userStore;
    }
  }

  if (!storeId) {
    return res.status(403).json({ error: 'Forbidden: Store context required' });
  }

  if (user.role === 'admin') {
    return next();
  }

  const membership = await withStoreContext(storeId, async (tx) => {
    const [m] = await tx
      .select()
      .from(store_members)
      .where(
        and(
          eq(store_members.store_id, storeId),
          eq(store_members.user_id, user.id),
          inArray(store_members.role, ['owner', 'admin', 'seller', 'member'])
        )
      );
    return m;
  }, user.id);

  if (!membership) {
    return res.status(403).json({ error: 'Forbidden: Store merchant permissions required' });
  }

  next();
};

// Admin / Merchant routes
router.use(requireAuth);
router.use(requireStoreMember);

// GET /api/admin/categories - List all categories for the resolved store
router.get('/', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const items = await withStoreContext(storeId, async (tx) => {
      return tx.select().from(categories).where(eq(categories.store_id, storeId)).orderBy(desc(categories.sort_order));
    }, userId);

    res.json({ data: items, total: items.length });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/admin/categories/:id - Get single category detail
router.get('/:id', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    const id = req.params.id as string;

    const [category] = await withStoreContext(storeId, async (tx) => {
      return tx.select().from(categories).where(and(eq(categories.id, id), eq(categories.store_id, storeId)));
    }, userId);

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category detail:', error);
    res.status(500).json({ error: 'Failed to fetch category detail' });
  }
});

router.post('/', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    const { name, slug, description, image_url, sort_order, is_active, parent_id } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const resolvedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCategory = {
      id: uuidv4(),
      store_id: storeId,
      name: name.trim(),
      slug: resolvedSlug,
      description: description || null,
      image_url: image_url || null,
      parent_id: parent_id || null,
      sort_order: sort_order != null ? parseInt(sort_order, 10) : 0,
      is_active: is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const created = await withStoreContext(storeId, async (tx) => {
      const [c] = await tx.insert(categories).values(newCategory).returning();
      return c;
    }, userId);

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;
    const { name, slug, description, image_url, sort_order, is_active, parent_id } = req.body;

    const updateData: any = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (parent_id !== undefined) updateData.parent_id = parent_id || null;
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order, 10);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updated = await withStoreContext(storeId, async (tx) => {
      const [c] = await tx.update(categories)
        .set(updateData)
        .where(and(eq(categories.id, req.params.id as string), eq(categories.store_id, storeId)))
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

router.delete('/:id', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = res.locals.storeId;
    const userId = res.locals.user?.id;

    const deleted = await withStoreContext(storeId, async (tx) => {
      const [c] = await tx.delete(categories)
        .where(and(eq(categories.id, req.params.id as string), eq(categories.store_id, storeId)))
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
