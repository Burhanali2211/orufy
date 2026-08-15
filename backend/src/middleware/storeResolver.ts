import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";
import { stores, custom_domains } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { normalizeHostname } from "../lib/domainUtils";

// In-memory cache to prevent DB hit on every request
const storeCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin"];
const PLATFORM_DOMAIN = (process.env.PLATFORM_DOMAIN || "platform.com").toLowerCase();

export const storeResolver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract raw incoming Host header (ignoring any spoofed client headers like X-Store-ID, X-Tenant-ID, X-Store-Host)
    const rawHost = (req.headers.host || req.hostname || "").toString();

    let host: string;
    try {
      host = normalizeHostname(rawHost);
    } catch {
      return res.status(400).json({ error: "INVALID_HOSTNAME" });
    }
    
    // Check if it's a reserved platform administrative domain
    const isPlatformReserved = RESERVED_SUBDOMAINS.some(sub => 
      host === `${sub}.${PLATFORM_DOMAIN}`
    ) || host === PLATFORM_DOMAIN;

    if (isPlatformReserved) {
      const explicitStoreHost = req.headers['x-store-hostname'];
      if (explicitStoreHost && typeof explicitStoreHost === 'string') {
        try {
          host = normalizeHostname(explicitStoreHost);
          // Proceed to resolve this explicit host below
        } catch {
          return res.status(400).json({ error: "INVALID_STORE_HOSTNAME" });
        }
      } else {
        res.locals.isPlatform = true;
        res.locals.storeId = null;
        return next();
      }
    }

    // Check Cache
    if (storeCache.has(host)) {
      const cachedStore = storeCache.get(host);
      if (!cachedStore) {
        return res.status(404).json({ error: "STORE_NOT_FOUND" });
      }
      res.locals.storeId = cachedStore.id;
      res.locals.store = cachedStore;
      res.locals.isPlatform = false;
      return next();
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
    
    if (!resolvedStore) {
      // If accessing from localhost/platform dev or requesting platform/auth endpoints, fallback to platform context
      const isPlatformRoute = req.path.startsWith('/api/auth') || req.path.startsWith('/api/platform') || req.path.startsWith('/api/health');
      if (host === 'localhost' || host === '127.0.0.1' || isPlatformRoute) {
        res.locals.isPlatform = true;
        res.locals.storeId = null;
        return next();
      }

      // Cache negative lookup
      storeCache.set(host, null);
      return res.status(404).json({ error: "STORE_NOT_FOUND" });
    }

    // Cache successful lookup
    storeCache.set(host, resolvedStore);

    // Attach authoritative store context to request
    res.locals.storeId = resolvedStore.id;
    res.locals.store = resolvedStore;
    res.locals.isPlatform = false;
    
    next();
  } catch (error) {
    console.error("Store resolution error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requireStore = (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.isPlatform || !res.locals.storeId) {
    return res.status(400).json({ error: "STORE_REQUIRED", message: "This endpoint requires a valid store context." });
  }
  next();
};
