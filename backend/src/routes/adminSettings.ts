import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/db';
import {
  admin_dashboard_settings,
  site_settings,
  contact_information,
  social_media_accounts,
  business_hours,
  footer_links,
  stores,
  store_members
} from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireStore, invalidateStoreCache } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';

export const adminSettingsRouter = Router();

const getStoreId = (req: Request, res: Response): string => {
  return res.locals.storeId || res.locals.store?.id || (req as any).store?.id;
};

// Middleware: Verify caller is owner or admin of the resolved store
const requireStoreAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;
  const storeId = getStoreId(req, res);

  if (!user || !storeId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (user.role === 'admin') {
    return next();
  }

  const [membership] = await db
    .select()
    .from(store_members)
    .where(
      and(
        eq(store_members.store_id, storeId),
        eq(store_members.user_id, user.id),
        inArray(store_members.role, ['owner', 'admin'])
      )
    );

  if (!membership) {
    return res.status(403).json({ error: 'Forbidden: Store admin or owner access required' });
  }

  next();
};

// --- Admin Dashboard Settings ---
adminSettingsRouter.get('/dashboard', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const settings = await withStoreContext(storeId, async (tx) => 
      tx.select().from(admin_dashboard_settings).where(eq(admin_dashboard_settings.store_id, storeId)),
      userId
    );
    res.json(settings);
  } catch (error) {
    console.error('Error fetching dashboard settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/dashboard', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const { setting_key, setting_value, setting_type, category, description, is_active } = req.body;
    
    if (!setting_key) {
      return res.status(400).json({ error: 'setting_key is required' });
    }

    const userId = res.locals.user?.id;

    await withStoreContext(storeId, async (tx) => 
      tx.insert(admin_dashboard_settings).values({
        store_id: storeId,
        setting_key,
        setting_value,
        setting_type: setting_type || 'text',
        category: category || 'dashboard',
        description,
        is_active: is_active ?? true,
        updated_by: userId
      }).onConflictDoUpdate({
        target: [admin_dashboard_settings.store_id, admin_dashboard_settings.setting_key],
        set: {
          setting_value,
          setting_type: setting_type || 'text',
          category: category || 'dashboard',
          description,
          is_active: is_active ?? true,
          updated_by: userId,
          updated_at: new Date()
        }
      }),
      userId
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating dashboard setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Site Settings ---
adminSettingsRouter.get('/site', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const settings = await withStoreContext(storeId, async (tx) => 
      tx.select().from(site_settings).where(eq(site_settings.store_id, storeId)),
      userId
    );
    res.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/site', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const { setting_key, setting_value, category, description } = req.body;
    const userId = res.locals.user?.id;

    if (!setting_key) {
      return res.status(400).json({ error: 'setting_key is required' });
    }

    await withStoreContext(storeId, async (tx) => 
      tx.insert(site_settings).values({
        store_id: storeId,
        setting_key,
        setting_value,
        category: category || 'general',
        description,
        updated_by: userId
      }).onConflictDoUpdate({
        target: [site_settings.store_id, site_settings.setting_key],
        set: { setting_value, category: category || 'general', description, updated_by: userId, updated_at: new Date() }
      }),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Contact Information ---
adminSettingsRouter.get('/contact', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const info = await withStoreContext(storeId, async (tx) => 
      tx.select().from(contact_information).where(eq(contact_information.store_id, storeId)),
      userId
    );
    res.json(info);
  } catch (error) {
    console.error('Error fetching contact information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/contact', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { type, label, value, display_order, is_primary, is_active } = req.body;

    if (!type || !value) {
      return res.status(400).json({ error: 'Contact type and value are required' });
    }

    await withStoreContext(storeId, async (tx) => {
      return tx.insert(contact_information).values({
        store_id: storeId,
        contact_type: type, 
        label: label || type,
        value, 
        display_order: display_order || 0, 
        is_primary: Boolean(is_primary), 
        is_active: is_active ?? true
      });
    }, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.put('/contact/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    const { type, label, value, display_order, is_primary, is_active } = req.body;

    const updateData: any = { updated_at: new Date() };
    if (type !== undefined) updateData.contact_type = type;
    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_primary !== undefined) updateData.is_primary = Boolean(is_primary);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    await withStoreContext(storeId, async (tx) => 
      tx.update(contact_information).set(updateData).where(and(eq(contact_information.id as any, id), eq(contact_information.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.delete('/contact/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    await withStoreContext(storeId, async (tx) => 
      tx.delete(contact_information).where(and(eq(contact_information.id as any, id), eq(contact_information.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Social Media Accounts ---
adminSettingsRouter.get('/social', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const accounts = await withStoreContext(storeId, async (tx) => 
      tx.select().from(social_media_accounts).where(eq(social_media_accounts.store_id, storeId)),
      userId
    );
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching social media accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/social', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { platform, platform_name, url, username, icon_name, is_active, display_order } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ error: 'Platform and URL are required' });
    }

    await withStoreContext(storeId, async (tx) => 
      tx.insert(social_media_accounts).values({
        store_id: storeId,
        platform,
        platform_name: platform_name || platform,
        url,
        username: username || null,
        icon_name: icon_name || null,
        is_active: is_active ?? true,
        display_order: display_order || 0
      }),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding social media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.put('/social/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    const { platform, platform_name, url, username, icon_name, is_active, display_order } = req.body;

    const updateData: any = { updated_at: new Date() };
    if (platform !== undefined) updateData.platform = platform;
    if (platform_name !== undefined) updateData.platform_name = platform_name;
    if (url !== undefined) updateData.url = url;
    if (username !== undefined) updateData.username = username;
    if (icon_name !== undefined) updateData.icon_name = icon_name;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (display_order !== undefined) updateData.display_order = display_order;

    await withStoreContext(storeId, async (tx) => 
      tx.update(social_media_accounts).set(updateData).where(and(eq(social_media_accounts.id as any, id), eq(social_media_accounts.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating social media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.delete('/social/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    await withStoreContext(storeId, async (tx) => 
      tx.delete(social_media_accounts).where(and(eq(social_media_accounts.id as any, id), eq(social_media_accounts.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting social media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/social/batch-delete', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { ids } = req.body;
    if (!ids || !ids.length) return res.json({ success: true });
    await withStoreContext(storeId, async (tx) => 
      tx.delete(social_media_accounts).where(and(inArray(social_media_accounts.id, ids), eq(social_media_accounts.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error batch deleting social media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Footer Links ---
adminSettingsRouter.get('/footer', requireStore, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const links = await withStoreContext(storeId, async (tx) => 
      tx.select().from(footer_links).where(eq(footer_links.store_id, storeId)),
      userId
    );
    res.json(links);
  } catch (error) {
    console.error('Error fetching footer links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/footer', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { section_name, link_text, link_url, display_order, is_active, opens_new_tab } = req.body;

    if (!section_name || !link_text || !link_url) {
      return res.status(400).json({ error: 'section_name, link_text, and link_url are required' });
    }

    await withStoreContext(storeId, async (tx) => 
      tx.insert(footer_links).values({
        store_id: storeId,
        section_name,
        link_text,
        link_url,
        display_order: display_order || 0,
        is_active: is_active ?? true,
        opens_new_tab: Boolean(opens_new_tab)
      }),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding footer link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.put('/footer/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    const { section_name, link_text, link_url, display_order, is_active, opens_new_tab } = req.body;

    const updateData: any = { updated_at: new Date() };
    if (section_name !== undefined) updateData.section_name = section_name;
    if (link_text !== undefined) updateData.link_text = link_text;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (opens_new_tab !== undefined) updateData.opens_new_tab = Boolean(opens_new_tab);

    await withStoreContext(storeId, async (tx) => 
      tx.update(footer_links).set(updateData).where(and(eq(footer_links.id as any, id), eq(footer_links.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating footer link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.delete('/footer/:id', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const id = req.params.id as string;
    await withStoreContext(storeId, async (tx) => 
      tx.delete(footer_links).where(and(eq(footer_links.id as any, id), eq(footer_links.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting footer link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/footer/batch-delete', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { ids } = req.body;
    if (!ids || !ids.length) return res.json({ success: true });
    await withStoreContext(storeId, async (tx) => 
      tx.delete(footer_links).where(and(inArray(footer_links.id, ids), eq(footer_links.store_id, storeId))),
      userId
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error batch deleting footer links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Hero Settings ---
adminSettingsRouter.get('/hero', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const [heroRow] = await withStoreContext(storeId, async (tx) =>
      tx.select().from(site_settings).where(and(eq(site_settings.store_id, storeId), eq(site_settings.setting_key, 'hero_settings'))),
      userId
    );
    let hero = null;
    if (heroRow?.setting_value) {
      try {
        hero = JSON.parse(heroRow.setting_value);
      } catch (_) {}
    }
    res.json(hero);
  } catch (error) {
    console.error('Error fetching hero settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/hero', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const heroData = req.body;
    const userId = res.locals.user?.id;
    const valueStr = JSON.stringify(heroData);

    await withStoreContext(storeId, async (tx) =>
      tx.insert(site_settings).values({
        store_id: storeId,
        setting_key: 'hero_settings',
        setting_value: valueStr,
        category: 'hero',
        description: 'Hero section customization and banner slides',
        updated_by: userId,
      }).onConflictDoUpdate({
        target: [site_settings.store_id, site_settings.setting_key],
        set: {
          setting_value: valueStr,
          updated_by: userId,
          updated_at: new Date(),
        }
      }),
      userId
    );

    res.json({ success: true, hero: heroData });
  } catch (error) {
    console.error('Error saving hero settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Store Branding & Logo Settings ---
adminSettingsRouter.get('/branding', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { store, siteSettingsRows } = await withStoreContext(storeId, async (tx) => {
      const [s] = await tx.select().from(stores).where(eq(stores.id, storeId));
      const rows = await tx.select().from(site_settings).where(eq(site_settings.store_id, storeId));
      return { store: s, siteSettingsRows: rows };
    }, userId);

    const settingsMap: Record<string, string> = {};
    siteSettingsRows.forEach((r: any) => { settingsMap[r.setting_key] = r.setting_value || ''; });

    let themeStudio = null;
    if (settingsMap['theme_studio_settings'] || settingsMap['theme_studio']) {
      try {
        themeStudio = JSON.parse(settingsMap['theme_studio_settings'] || settingsMap['theme_studio']);
      } catch (_) {}
    }

    res.json({
      name: store?.name || '',
      logo_url: store?.logo_url || settingsMap['site_logo'] || '',
      announcement_bar: settingsMap['announcement_bar'] || '',
      primary_color: settingsMap['brand_primary'] || '#09090b',
      accent_color: settingsMap['brand_accent'] || '#18181b',
      theme_studio: themeStudio,
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/branding', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const { name, logo_url, announcement_bar, primary_color, accent_color, theme_studio } = req.body;
    const userId = res.locals.user?.id;

    await withStoreContext(storeId, async (tx) => {
      if (name !== undefined || logo_url !== undefined) {
        await tx.update(stores).set({
          ...(name ? { name: name.trim() } : {}),
          logo_url: logo_url !== undefined ? (logo_url || null) : null,
          updated_at: new Date(),
        }).where(eq(stores.id, storeId));
      }

      const updates: { key: string; value: string }[] = [];
      if (name !== undefined) updates.push({ key: 'site_name', value: name });
      if (logo_url !== undefined) updates.push({ key: 'site_logo', value: logo_url });
      if (announcement_bar !== undefined) updates.push({ key: 'announcement_bar', value: announcement_bar });
      if (primary_color !== undefined) updates.push({ key: 'brand_primary', value: primary_color });
      if (accent_color !== undefined) updates.push({ key: 'brand_accent', value: accent_color });
      if (theme_studio !== undefined) {
        const tsStr = typeof theme_studio === 'string' ? theme_studio : JSON.stringify(theme_studio);
        updates.push({ key: 'theme_studio', value: tsStr });
        updates.push({ key: 'theme_studio_settings', value: tsStr });
      }

      for (const item of updates) {
        await tx.insert(site_settings).values({
          store_id: storeId,
          setting_key: item.key,
          setting_value: item.value,
          category: 'branding',
          updated_by: userId,
        }).onConflictDoUpdate({
          target: [site_settings.store_id, site_settings.setting_key],
          set: { setting_value: item.value, updated_by: userId, updated_at: new Date() }
        });
      }
    }, userId);

    invalidateStoreCache();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.delete('/logo', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;

    await withStoreContext(storeId, async (tx) => {
      await tx.update(stores).set({ logo_url: null, updated_at: new Date() }).where(eq(stores.id, storeId));
      await tx.insert(site_settings).values({
        store_id: storeId,
        setting_key: 'site_logo',
        setting_value: '',
        category: 'branding',
        updated_by: userId,
      }).onConflictDoUpdate({
        target: [site_settings.store_id, site_settings.setting_key],
        set: { setting_value: '', updated_by: userId, updated_at: new Date() }
      });
    }, userId);

    invalidateStoreCache();

    res.json({ success: true, message: 'Logo removed successfully' });
  } catch (error) {
    console.error('Error removing logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Full Visual Theme Studio Settings ---
adminSettingsRouter.get('/theme-studio', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { store, siteSettingsRows } = await withStoreContext(storeId, async (tx) => {
      const [s] = await tx.select().from(stores).where(eq(stores.id, storeId));
      const rows = await tx.select().from(site_settings).where(eq(site_settings.store_id, storeId));
      return { store: s, siteSettingsRows: rows };
    }, userId);

    const settingsMap: Record<string, string> = {};
    siteSettingsRows.forEach((r: any) => { settingsMap[r.setting_key] = r.setting_value || ''; });

    let studioConfig = null;
    if (settingsMap['theme_studio_settings']) {
      try {
        studioConfig = JSON.parse(settingsMap['theme_studio_settings']);
      } catch (_) {}
    }

    let heroConfig = null;
    if (settingsMap['hero_settings']) {
      try {
        heroConfig = JSON.parse(settingsMap['hero_settings']);
      } catch (_) {}
    }

    res.json({
      store: {
        name: store?.name || '',
        logo_url: store?.logo_url || settingsMap['site_logo'] || '',
        hostname: store?.hostname || '',
      },
      hero: heroConfig || studioConfig?.hero || null,
      theme: studioConfig || {
        sections: [
          { id: 'hero', name: 'Hero Banner', enabled: true, icon: 'Sparkles' },
          { id: 'category_chips', name: 'Category Avatar Chips', enabled: true, icon: 'LayoutGrid' },
          { id: 'featured_products', name: 'Featured Collection', enabled: true, icon: 'Star' },
          { id: 'bento_grid', name: 'Shop by Category Grid', enabled: true, icon: 'Layers' },
          { id: 'latest_arrivals', name: 'Fresh Releases', enabled: true, icon: 'Clock' },
          { id: 'promo_banner', name: 'Why Shop With Us Badges', enabled: true, icon: 'ShieldCheck' },
        ],
        palette: {
          id: 'classic_luxury',
          name: 'Classic Luxury',
          primary: settingsMap['brand_primary'] || '#1c1917',
          accent: settingsMap['brand_accent'] || '#8c7e5a',
          background: '#fafaf9',
          surface: '#ffffff',
          text: '#1c1917',
          mutedText: '#78716c',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          headingWeight: '800',
        },
        header: {
          layout: 'standard',
          logoHeight: 38,
          sticky: true,
          showAnnouncement: true,
          announcementText: settingsMap['announcement_bar'] || 'Complimentary shipping on orders above ₹499',
          announcementBg: '#1c1917',
          announcementTextCol: '#ffffff',
        },
        footer: {
          aboutText: 'Discover curated luxury essentials and artisanal collections.',
          showNewsletter: true,
          showTrustBadges: true,
          copyrightText: `© ${new Date().getFullYear()} ${store?.name || 'Store'}. All rights reserved.`,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching theme studio settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminSettingsRouter.post('/theme-studio', requireAuth, requireStore, requireStoreAdmin, async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req, res);
    const userId = res.locals.user?.id;
    const { store: storeData, hero: heroData, theme: themeData } = req.body;

    await withStoreContext(storeId, async (tx) => {
      // 1. Update store name & logo if provided
      if (storeData) {
        await tx.update(stores).set({
          ...(storeData.name ? { name: storeData.name.trim() } : {}),
          logo_url: storeData.logo_url !== undefined ? (storeData.logo_url || null) : null,
          updated_at: new Date(),
        }).where(eq(stores.id, storeId));
      }

      // 2. Persist Hero settings if included
      if (heroData) {
        const heroStr = JSON.stringify(heroData);
        await tx.insert(site_settings).values({
          store_id: storeId,
          setting_key: 'hero_settings',
          setting_value: heroStr,
          category: 'hero',
          description: 'Theme Studio Hero Configuration',
          updated_by: userId,
        }).onConflictDoUpdate({
          target: [site_settings.store_id, site_settings.setting_key],
          set: { setting_value: heroStr, updated_by: userId, updated_at: new Date() }
        });
      }

      // 3. Persist Full Theme Studio Config & Quick Keys
      const studioStr = JSON.stringify(themeData);
      const quickUpdates = [
        { key: 'theme_studio_settings', value: studioStr },
        { key: 'site_name', value: storeData?.name || '' },
        { key: 'site_logo', value: storeData?.logo_url || '' },
        { key: 'announcement_bar', value: themeData?.header?.announcementText || '' },
        { key: 'brand_primary', value: themeData?.palette?.primary || '#1c1917' },
        { key: 'brand_accent', value: themeData?.palette?.accent || '#8c7e5a' },
        { key: 'brand_typography', value: themeData?.typography?.headingFont || 'Inter' },
      ];

      for (const item of quickUpdates) {
        if (item.value !== undefined) {
          await tx.insert(site_settings).values({
            store_id: storeId,
            setting_key: item.key,
            setting_value: item.value,
            category: 'theme_studio',
            updated_by: userId,
          }).onConflictDoUpdate({
            target: [site_settings.store_id, site_settings.setting_key],
            set: { setting_value: item.value, updated_by: userId, updated_at: new Date() }
          });
        }
      }
    }, userId);

    invalidateStoreCache();

    res.json({ success: true, message: 'Theme settings published successfully!' });
  } catch (error) {
    console.error('Error publishing theme studio settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
