import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";
import { stores, custom_domains, store_members } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { normalizeHostname } from "../lib/domainUtils";

// In-memory cache to prevent DB hit on every request
const storeCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin"];
const getPlatformDomain = () => {
  if (process.env.PLATFORM_DOMAIN) return process.env.PLATFORM_DOMAIN.toLowerCase();
  if (process.env.FRONTEND_URL) {
    try {
      return new URL(process.env.FRONTEND_URL).hostname.toLowerCase();
    } catch {
      return process.env.FRONTEND_URL.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }
  }
  return "get-oru.com";
};

const PLATFORM_DOMAIN = getPlatformDomain();

/**
 * Ensures there is always at least one active store available in the system
 */
export async function getOrCreateDefaultStore() {
  try {
    const [existing] = await db.select().from(stores).where(eq(stores.is_active, true)).limit(1);
    if (existing) return existing;

    const [anyStore] = await db.select().from(stores).limit(1);
    if (anyStore) return anyStore;

    // Seed initial default store if database is empty
    const [created] = await db.insert(stores).values({
      name: "Orufy Store",
      hostname: PLATFORM_DOMAIN,
      is_active: true,
      tax_rate_percent: 18,
      payment_onboarding_status: "COMPLETED"
    }).returning();

    return created;
  } catch (error) {
    console.error("Error ensuring default store:", error);
    return null;
  }
}

export const storeResolver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract raw incoming Host header
    const rawHost = (req.headers.host || req.hostname || "").toString();

    let host: string;
    try {
      host = normalizeHostname(rawHost);
    } catch {
      host = PLATFORM_DOMAIN;
    }
    
    // Check if it's a reserved platform administrative domain
    const isPlatformReserved = RESERVED_SUBDOMAINS.some(sub => 
      host === `${sub}.${PLATFORM_DOMAIN}`
    ) || host === PLATFORM_DOMAIN || host === 'localhost' || host === '127.0.0.1';

    let explicitHost = req.headers['x-store-hostname'];
    if (typeof explicitHost === 'string' && explicitHost.trim()) {
      try {
        host = normalizeHostname(explicitHost.trim());
      } catch {
        // use default host
      }
    }

    // Check Cache
    if (storeCache.has(host)) {
      const cachedStore = storeCache.get(host);
      if (cachedStore) {
        res.locals.storeId = cachedStore.id;
        res.locals.store = cachedStore;
        res.locals.isPlatform = false;
        return next();
      }
    }
    
    // 1. Check custom_domains table (Must be VERIFIED and ACTIVE)
    const [customDomain] = await db
      .select()
      .from(custom_domains)
      .where(
        and(
          eq(custom_domains.hostname, host),
          eq(custom_domains.verification_status, 'VERIFIED'),
          eq(custom_domains.ssl_status, 'ACTIVE')
        )
      );

    let resolvedStore = null;

    if (customDomain) {
      const [matchedStore] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, customDomain.store_id));
      resolvedStore = matchedStore || null;
    } else {
      // 2. Check platform subdomains (stores.hostname)
      const [platformStore] = await db
        .select()
        .from(stores)
        .where(eq(stores.hostname, host));
      resolvedStore = platformStore || null;
    }
    
    // 3. If still not resolved, check first active store or auto-create default store
    if (!resolvedStore) {
      resolvedStore = await getOrCreateDefaultStore();
    }

    if (resolvedStore) {
      storeCache.set(host, resolvedStore);
      res.locals.storeId = resolvedStore.id;
      res.locals.store = resolvedStore;
      res.locals.isPlatform = false;
    } else {
      res.locals.storeId = null;
      res.locals.store = null;
      res.locals.isPlatform = isPlatformReserved;
    }
    
    next();
  } catch (error) {
    console.error("Store resolution error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requireStore = async (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.storeId || !res.locals.store) {
    const fallback = await getOrCreateDefaultStore();
    if (fallback) {
      res.locals.storeId = fallback.id;
      res.locals.store = fallback;
      res.locals.isPlatform = false;
      return next();
    }
    return res.status(400).json({ error: "STORE_REQUIRED", message: "This endpoint requires a valid store context." });
  }
  next();
};
