import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { addresses, payment_methods, notification_preferences, orders, reviews, profiles, stores } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import path from 'path';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { optimizeImageBuffer, saveOptimizedImage } from '../services/imageOptimizer';

export const customerRouter = Router();

/**
 * Helper to resolve store ID or use fallback
 */
async function resolveStoreId(req: Request, res: Response): Promise<string> {
  if (res.locals?.storeId) return res.locals.storeId;
  if (req.headers && req.headers['x-store-hostname']) {
    const [found] = await db.select().from(stores).where(eq(stores.hostname, req.headers['x-store-hostname'] as string));
    if (found) return found.id;
  }
  const [firstStore] = await db.select().from(stores).where(eq(stores.is_active, true)).limit(1);
  if (firstStore) return firstStore.id;
  // Fallback to dummy UUID if no store exists yet
  return '00000000-0000-0000-0000-000000000000';
}

// ==========================================
// 1. Customer Stats
// ==========================================
customerRouter.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const storeId = await resolveStoreId(req, res);

    const userOrders = await db.select().from(orders).where(and(eq(orders.user_id, userId), eq(orders.store_id, storeId)));
    const userReviews = await db.select().from(reviews).where(and(eq(reviews.user_id, userId), eq(reviews.store_id, storeId)));

    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const activeOrders = userOrders.filter(o => ['placed', 'confirmed', 'processing', 'shipped'].includes(o.status)).length;
    const completedOrders = userOrders.filter(o => o.status === 'delivered').length;

    return res.status(200).json({
      totalOrders,
      totalSpent,
      activeOrders,
      completedOrders,
      reviewCount: userReviews.length,
      savedAddresses: (await db.select().from(addresses).where(eq(addresses.user_id, userId))).length,
    });
  } catch (error) {
    console.error('Customer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
});

// ==========================================
// 2. Addresses CRUD
// ==========================================
customerRouter.get('/addresses', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const list = await db
      .select()
      .from(addresses)
      .where(eq(addresses.user_id, userId))
      .orderBy(desc(addresses.is_default), desc(addresses.created_at));

    return res.status(200).json(list);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

customerRouter.post('/addresses', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const storeId = await resolveStoreId(req, res);
    const {
      type = 'home',
      full_name,
      fullName,
      name,
      phone,
      street_address,
      streetAddress,
      address,
      city,
      state,
      postal_code,
      postalCode,
      zipCode,
      country = 'India',
      is_default = false,
      isDefault = false,
    } = req.body;

    const resolvedFullName = full_name || fullName || name || 'Customer';
    const resolvedStreet = street_address || streetAddress || address || '';
    const resolvedPostal = postal_code || postalCode || zipCode || '';
    const resolvedDefault = is_default || isDefault;

    if (resolvedDefault) {
      // Unset existing defaults
      await db.update(addresses).set({ is_default: false }).where(eq(addresses.user_id, userId));
    }

    const [created] = await db.insert(addresses).values({
      store_id: storeId,
      user_id: userId,
      type,
      full_name: resolvedFullName,
      phone: phone || null,
      street_address: resolvedStreet,
      city: city || '',
      state: state || '',
      postal_code: resolvedPostal,
      country,
      is_default: resolvedDefault,
    }).returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

customerRouter.put('/addresses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const id = req.params.id;
    const {
      type,
      full_name,
      fullName,
      name,
      phone,
      street_address,
      streetAddress,
      address,
      city,
      state,
      postal_code,
      postalCode,
      zipCode,
      country,
      is_default,
      isDefault,
    } = req.body;

    const updates: any = { updated_at: new Date() };
    if (type !== undefined) updates.type = type;
    if (full_name !== undefined || fullName !== undefined || name !== undefined) {
      updates.full_name = full_name || fullName || name;
    }
    if (phone !== undefined) updates.phone = phone;
    if (street_address !== undefined || streetAddress !== undefined || address !== undefined) {
      updates.street_address = street_address || streetAddress || address;
    }
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (postal_code !== undefined || postalCode !== undefined || zipCode !== undefined) {
      updates.postal_code = postal_code || postalCode || zipCode;
    }
    if (country !== undefined) updates.country = country;
    if (is_default !== undefined || isDefault !== undefined) {
      updates.is_default = is_default !== undefined ? is_default : isDefault;
      if (updates.is_default) {
        await db.update(addresses).set({ is_default: false }).where(eq(addresses.user_id, userId));
      }
    }

    const [updated] = await db
      .update(addresses)
      .set(updates)
      .where(and(eq(addresses.id, id as any), eq(addresses.user_id, userId as any)))
      .returning();

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

customerRouter.delete('/addresses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const id = req.params.id;

    await db.delete(addresses).where(and(eq(addresses.id, id as any), eq(addresses.user_id, userId as any)));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ==========================================
// 3. Payment Methods CRUD
// ==========================================
const handleGetPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const list = await db
      .select()
      .from(payment_methods)
      .where(and(eq(payment_methods.user_id, userId as any), eq(payment_methods.is_active, true)))
      .orderBy(desc(payment_methods.is_default), desc(payment_methods.created_at));

    return res.status(200).json(list);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};

const handleCreatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const storeId = await resolveStoreId(req, res);
    const {
      type = 'card',
      last_four,
      lastFour,
      card_brand,
      cardBrand,
      brand,
      expiry_month,
      expiryMonth,
      expiry_year,
      expiryYear,
      cardholder_name,
      cardholderName,
      name,
      upi_id,
      upiId,
      is_default = false,
      isDefault = false,
    } = req.body;

    const resolvedDefault = is_default || isDefault;
    if (resolvedDefault) {
      await db.update(payment_methods).set({ is_default: false }).where(eq(payment_methods.user_id, userId as any));
    }

    const [created] = await db.insert(payment_methods).values({
      store_id: storeId,
      user_id: userId,
      type,
      last_four: last_four || lastFour || '4242',
      card_brand: card_brand || cardBrand || brand || 'Visa',
      expiry_month: expiry_month || expiryMonth || '12',
      expiry_year: expiry_year || expiryYear || '2028',
      cardholder_name: cardholder_name || cardholderName || name || 'Customer',
      upi_id: upi_id || upiId || null,
      is_default: resolvedDefault,
      is_active: true,
    }).returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
};

customerRouter.get('/payment-methods', requireAuth, handleGetPaymentMethods);
customerRouter.get('/payment_methods', requireAuth, handleGetPaymentMethods);
customerRouter.post('/payment-methods', requireAuth, handleCreatePaymentMethod);
customerRouter.post('/payment_methods', requireAuth, handleCreatePaymentMethod);

customerRouter.put('/payment-methods/:id/set-default', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const id = req.params.id;

    await db.update(payment_methods).set({ is_default: false }).where(eq(payment_methods.user_id, userId as any));
    const [updated] = await db
      .update(payment_methods)
      .set({ is_default: true, updated_at: new Date() })
      .where(and(eq(payment_methods.id, id as any), eq(payment_methods.user_id, userId as any)))
      .returning();

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});
customerRouter.put('/payment_methods/:id/set-default', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const id = req.params.id;

    await db.update(payment_methods).set({ is_default: false }).where(eq(payment_methods.user_id, userId as any));
    const [updated] = await db
      .update(payment_methods)
      .set({ is_default: true, updated_at: new Date() })
      .where(and(eq(payment_methods.id, id as any), eq(payment_methods.user_id, userId as any)))
      .returning();

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

const handleDeletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const id = req.params.id;

    await db.delete(payment_methods).where(and(eq(payment_methods.id, id as any), eq(payment_methods.user_id, userId as any)));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
};
customerRouter.delete('/payment-methods/:id', requireAuth, handleDeletePaymentMethod);
customerRouter.delete('/payment_methods/:id', requireAuth, handleDeletePaymentMethod);

// ==========================================
// 4. Notification Preferences
// ==========================================
const handleGetNotifications = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const [prefs] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId))
      .limit(1);

    if (!prefs) {
      return res.status(200).json({
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        order_updates: true,
        promotional_emails: false,
        newsletter: true,
        product_updates: true,
      });
    }

    return res.status(200).json(prefs);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

const handleSaveNotifications = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const storeId = await resolveStoreId(req, res);
    const {
      email_notifications = true,
      sms_notifications = false,
      push_notifications = true,
      order_updates = true,
      promotional_emails = false,
      newsletter = true,
      product_updates = true,
      emailOrderUpdates,
      emailPromotions,
      emailNewsletter,
      pushOrderUpdates,
      pushPromotions,
    } = req.body;

    const values = {
      store_id: storeId,
      user_id: userId,
      email_notifications: email_notifications ?? true,
      sms_notifications: sms_notifications ?? false,
      push_notifications: push_notifications ?? true,
      order_updates: order_updates ?? emailOrderUpdates ?? true,
      promotional_emails: promotional_emails ?? emailPromotions ?? false,
      newsletter: newsletter ?? emailNewsletter ?? true,
      product_updates: product_updates ?? true,
      updated_at: new Date(),
    };

    const [existing] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(notification_preferences)
        .set(values)
        .where(eq(notification_preferences.id, existing.id))
        .returning();
      return res.status(200).json(updated);
    } else {
      const [inserted] = await db
        .insert(notification_preferences)
        .values(values)
        .returning();
      return res.status(200).json(inserted);
    }
  } catch (error) {
    console.error('Save notification preferences error:', error);
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
};

customerRouter.get('/notification-preferences', requireAuth, handleGetNotifications);
customerRouter.get('/notification_preferences', requireAuth, handleGetNotifications);
customerRouter.post('/notification-preferences', requireAuth, handleSaveNotifications);
customerRouter.post('/notification_preferences', requireAuth, handleSaveNotifications);
customerRouter.put('/notification-preferences', requireAuth, handleSaveNotifications);
customerRouter.put('/notification_preferences', requireAuth, handleSaveNotifications);

// ==========================================
// 5. Customer Avatar / Profile Upload
// ==========================================
customerRouter.post('/profiles/avatar', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    let avatarUrl = req.body?.url;

    // If a base64 image data payload is sent, optimize and persist to disk
    if (req.body?.data && typeof req.body.data === 'string' && req.body.data.startsWith('data:image')) {
      try {
        const base64Data = req.body.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadDir = path.join(process.cwd(), 'uploads');
        const saved = await saveOptimizedImage(buffer, uploadDir, `avatar_${userId}`);
        avatarUrl = saved.url;
      } catch (optErr) {
        console.warn('Image optimization fallback:', optErr);
        avatarUrl = req.body.data;
      }
    }

    if (!avatarUrl) {
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }

    await db.update(profiles).set({ avatar_url: avatarUrl }).where(eq(profiles.id, userId));

    return res.status(200).json({
      success: true,
      url: avatarUrl,
      publicUrl: avatarUrl,
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

