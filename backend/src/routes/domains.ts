import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { custom_domains, stores, store_members } from '../db/schema';
import { eq, and, sql, lte, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { normalizeHostname, generateVerificationToken, verifyDnsTxtRecord } from '../lib/domainUtils';
import { provisionSslCertificate } from '../lib/sslManager';
import { withStoreContext, withUserContext } from '../db/utils';
import { invalidateStoreCache } from '../middleware/storeResolver';

export const domainsRouter = Router();

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper: Ensure user is authorized merchant for store (owner or admin)
async function getMerchantStore(userId: string) {
  return await withUserContext(userId, async (tx) => {
    const [membership] = await tx
      .select()
      .from(store_members)
      .where(and(eq(store_members.user_id, userId), inArray(store_members.role, ['owner', 'admin'])));

    if (!membership) {
      return null;
    }

    const [store] = await tx
      .select()
      .from(stores)
      .where(eq(stores.id, membership.store_id));

    return store || null;
  });
}

// 1. Add Custom Domain
domainsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden: You must be a store owner to manage custom domains' });
    }

    const { hostname, isPrimary } = req.body;

    let normalizedHost: string;
    try {
      normalizedHost = normalizeHostname(hostname);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const isWww = normalizedHost.startsWith('www.');
    const parts = normalizedHost.split('.');
    const domainType = isWww ? 'alias' : (parts.length === 2 ? 'apex' : 'subdomain');
    const verificationToken = generateVerificationToken();

    const inserted = await withStoreContext(store.id, async (tx) => {
      // Check if domain is already registered on platform
      const [existingPlatformSubdomain] = await tx
        .select()
        .from(stores)
        .where(eq(stores.hostname, normalizedHost));

      if (existingPlatformSubdomain) {
        throw new Error('SUBDOMAIN_RESERVED');
      }

      const [existingCustomDomain] = await tx
        .select()
        .from(custom_domains)
        .where(eq(custom_domains.hostname, normalizedHost));

      if (existingCustomDomain) {
        throw new Error('CUSTOM_DOMAIN_TAKEN');
      }

      if (isPrimary) {
        await tx
          .update(custom_domains)
          .set({ is_primary: false, updated_at: sql`now()` })
          .where(and(eq(custom_domains.store_id, store.id), eq(custom_domains.is_primary, true)));
      }

      const [domain] = await tx
        .insert(custom_domains)
        .values({
          store_id: store.id,
          hostname: normalizedHost,
          domain_type: domainType,
          verification_token: verificationToken,
          verification_method: 'dns_txt',
          verification_status: 'PENDING_VERIFICATION',
          ssl_status: 'PENDING',
          is_primary: Boolean(isPrimary),
        })
        .returning();

      return domain;
    }, userId);

    return res.status(201).json({
      success: true,
      domain: {
        id: inserted.id,
        storeId: inserted.store_id,
        hostname: inserted.hostname,
        domainType: inserted.domain_type,
        verificationHost: `_platform-verification.${inserted.hostname}`,
        verificationToken: inserted.verification_token,
        verificationStatus: inserted.verification_status,
        sslStatus: inserted.ssl_status,
        isPrimary: inserted.is_primary,
        createdAt: inserted.created_at,
      }
    });
  } catch (error: any) {
    if (error.message === 'SUBDOMAIN_RESERVED') {
      return res.status(409).json({ error: 'This domain/subdomain is already reserved by the platform' });
    }
    if (error.message === 'CUSTOM_DOMAIN_TAKEN') {
      return res.status(409).json({ error: 'This custom domain is already registered to a store' });
    }
    console.error('Error adding custom domain:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Verify Domain Ownership via DNS TXT Challenge
domainsRouter.post('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden: You must be a store owner to verify custom domains' });
    }

    const { id } = req.params;
    const domainId = typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : '');

    const domain = await withStoreContext(store.id, async (tx) => {
      const [dom] = await tx
        .select()
        .from(custom_domains)
        .where(and(eq(custom_domains.id, domainId), eq(custom_domains.store_id, store.id)));
      return dom || null;
    }, userId);

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found or unauthorized' });
    }

    // Check token expiration (7 days)
    if (domain.created_at) {
      const age = Date.now() - new Date(domain.created_at).getTime();
      if (age > TOKEN_EXPIRY_MS) {
        await withStoreContext(store.id, async (tx) => {
          await tx
            .update(custom_domains)
            .set({
              verification_status: 'VERIFICATION_FAILED',
              updated_at: sql`now()`
            })
            .where(eq(custom_domains.id, domain.id));
        }, userId);

        return res.status(400).json({
          success: false,
          verified: false,
          verificationStatus: 'VERIFICATION_FAILED',
          error: 'TOKEN_EXPIRED',
          message: 'Verification token has expired. Please remove and re-add the domain to generate a fresh token.'
        });
      }
    }

    // Check DNS TXT Record
    const result = await verifyDnsTxtRecord(domain.hostname, domain.verification_token);

    if (result.success) {
      const updated = await withStoreContext(store.id, async (tx) => {
        const [up] = await tx
          .update(custom_domains)
          .set({
            verification_status: 'VERIFIED',
            verified_at: sql`now()`,
            ssl_status: 'SSL_PENDING',
            updated_at: sql`now()`
          })
          .where(eq(custom_domains.id, domain.id))
          .returning();
        return up;
      }, userId);

      return res.status(200).json({
        success: true,
        verified: true,
        verificationStatus: updated.verification_status,
        sslStatus: updated.ssl_status,
        message: 'Domain ownership verified successfully! Ready for SSL provisioning.'
      });
    } else {
      return res.status(200).json({
        success: false,
        verified: false,
        verificationStatus: domain.verification_status,
        error: result.error,
        foundRecords: result.foundRecords,
        message: 'DNS TXT verification record not found or does not match yet. DNS propagation may take a few minutes.'
      });
    }
  } catch (error: any) {
    console.error('Error verifying custom domain:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Activate SSL (Certificate Issuance + Nginx Configuration + Expiry Tracking)
domainsRouter.post('/:id/activate-ssl', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const domainId = typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : '');

    const domain = await withStoreContext(store.id, async (tx) => {
      const [dom] = await tx
        .select()
        .from(custom_domains)
        .where(and(eq(custom_domains.id, domainId), eq(custom_domains.store_id, store.id)));
      return dom || null;
    }, userId);

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.verification_status !== 'VERIFIED') {
      return res.status(400).json({ error: 'Cannot activate SSL for an unverified domain' });
    }

    const sslResult = await provisionSslCertificate(domain.hostname);

    if (!sslResult.success) {
      await withStoreContext(store.id, async (tx) => {
        await tx
          .update(custom_domains)
          .set({
            ssl_status: 'SSL_FAILED',
            updated_at: sql`now()`
          })
          .where(eq(custom_domains.id, domain.id));
      }, userId);

      return res.status(500).json({
        success: false,
        error: sslResult.error,
        message: 'SSL provisioning and Nginx configuration failed'
      });
    }

    const updated = await withStoreContext(store.id, async (tx) => {
      const [up] = await tx
        .update(custom_domains)
        .set({
          ssl_status: 'ACTIVE',
          ssl_expires_at: sslResult.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          updated_at: sql`now()`
        })
        .where(eq(custom_domains.id, domain.id))
        .returning();
      return up;
    }, userId);

    if (updated?.hostname) {
      invalidateStoreCache(updated.hostname);
    }

    return res.status(200).json({
      success: true,
      domain: updated,
      message: 'SSL certificate successfully provisioned, Nginx configured, and domain marked ACTIVE.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Set Domain as Primary for Store
domainsRouter.post('/:id/set-primary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const domainId = typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : '');

    const updated = await withStoreContext(store.id, async (tx) => {
      const [domain] = await tx
        .select()
        .from(custom_domains)
        .where(and(eq(custom_domains.id, domainId), eq(custom_domains.store_id, store.id)));

      if (!domain) {
        throw new Error('DOMAIN_NOT_FOUND');
      }

      await tx
        .update(custom_domains)
        .set({ is_primary: false, updated_at: sql`now()` })
        .where(and(eq(custom_domains.store_id, store.id), eq(custom_domains.is_primary, true)));

      const [up] = await tx
        .update(custom_domains)
        .set({ is_primary: true, updated_at: sql`now()` })
        .where(eq(custom_domains.id, domain.id))
        .returning();

      return up;
    }, userId);

    if (updated?.hostname) {
      invalidateStoreCache(updated.hostname);
    }

    return res.status(200).json({
      success: true,
      domain: updated
    });
  } catch (error: any) {
    if (error.message === 'DOMAIN_NOT_FOUND') {
      return res.status(404).json({ error: 'Domain not found' });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Automated SSL Certificate Renewal Endpoint
domainsRouter.post('/renew-ssl', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized renewal request' });
    }

    const renewalThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringDomains = await db
      .select()
      .from(custom_domains)
      .where(
        and(
          eq(custom_domains.verification_status, 'VERIFIED'),
          eq(custom_domains.ssl_status, 'ACTIVE'),
          lte(custom_domains.ssl_expires_at, renewalThreshold)
        )
      );

    const renewed: string[] = [];
    const failed: Array<{ domain: string; error: string }> = [];

    for (const dom of expiringDomains) {
      const result = await provisionSslCertificate(dom.hostname);
      if (result.success) {
        await db
          .update(custom_domains)
          .set({
            ssl_expires_at: result.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            updated_at: sql`now()`
          })
          .where(eq(custom_domains.id, dom.id));
        renewed.push(dom.hostname);
      } else {
        failed.push({ domain: dom.hostname, error: result.error || 'Renewal failed' });
      }
    }

    return res.status(200).json({
      success: true,
      totalChecked: expiringDomains.length,
      renewedCount: renewed.length,
      renewed,
      failed
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Renewal process error' });
  }
});

// 6. List Custom Domains for Store
domainsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const domains = await withStoreContext(store.id, async (tx) => {
      return await tx
        .select()
        .from(custom_domains)
        .where(eq(custom_domains.store_id, store.id));
    }, userId);

    return res.status(200).json({
      success: true,
      domains
    });
  } catch (error: any) {
    console.error('Error listing custom domains:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 7. Delete Custom Domain
domainsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const domainId = typeof id === 'string' ? id : (Array.isArray(id) ? id[0] : '');

    const deleted = await withStoreContext(store.id, async (tx) => {
      const [del] = await tx
        .delete(custom_domains)
        .where(and(eq(custom_domains.id, domainId), eq(custom_domains.store_id, store.id)))
        .returning();
      return del;
    }, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Domain not found or unauthorized' });
    }

    if (deleted?.hostname) {
      invalidateStoreCache(deleted.hostname);
    }

    return res.status(200).json({
      success: true,
      message: 'Custom domain removed successfully'
    });
  } catch (error: any) {
    console.error('Error deleting custom domain:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
