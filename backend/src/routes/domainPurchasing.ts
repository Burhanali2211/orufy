import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { stores, store_members, custom_domains, domain_registrations } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { normalizeHostname, generateVerificationToken } from '../lib/domainUtils';
import { getRegistrarProvider } from '../lib/registrar/registrarFactory';
import { provisionSslCertificate } from '../lib/sslManager';
import { withStoreContext, withUserContext } from '../db/utils';

export const domainPurchasingRouter = Router();

// Helper: Ensure user is authorized merchant for store
// Helper: Ensure user is authorized merchant (owner/admin) for store
async function getMerchantStore(userId: string) {
  return await withUserContext(userId, async (tx) => {
    const [membership] = await tx
      .select()
      .from(store_members)
      .where(
        and(
          eq(store_members.user_id, userId),
          inArray(store_members.role, ['owner', 'admin'])
        )
      );

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

// 1. Search Domain Availability across popular TLDs
domainPurchasingRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.query as string;
    if (!rawQuery || rawQuery.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const cleanQuery = rawQuery.toLowerCase().trim();
    const provider = getRegistrarProvider();
    const suggestions = await provider.searchSuggestions(cleanQuery, ['in', 'shop', 'store', 'com', 'online']);

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      provider: provider.providerName,
      results: suggestions,
    });
  } catch (error: any) {
    console.error('Error searching domains:', error);
    return res.status(500).json({ error: error.message || 'Domain search failed' });
  }
});

// 2. Create Domain Purchase Order
domainPurchasingRouter.post('/order', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden: You must be a store owner/admin to purchase domains' });
    }

    const { domain, periodYears = 1, contactInfo, isPrimary = true } = req.body;

    let normalizedDomain: string;
    try {
      normalizedDomain = normalizeHostname(domain);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const provider = getRegistrarProvider();
    const avail = await provider.checkAvailability(normalizedDomain);

    if (!avail.available) {
      return res.status(400).json({ error: `Domain ${normalizedDomain} is unavailable or already taken` });
    }

    const totalPricePaise = avail.pricePaise * (periodYears || 1);
    const mockRazorpayOrderId = `order_dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const registration = await withStoreContext(store.id, async (tx) => {
      // Check if domain is already registered on our platform
      const [existingCustomDomain] = await tx
        .select()
        .from(custom_domains)
        .where(eq(custom_domains.hostname, normalizedDomain));

      if (existingCustomDomain) {
        throw new Error('DOMAIN_ALREADY_REGISTERED_ON_PLATFORM');
      }

      const [inserted] = await tx
        .insert(domain_registrations)
        .values({
          store_id: store.id,
          domain_name: normalizedDomain,
          provider: provider.providerName,
          provider_order_id: mockRazorpayOrderId,
          registration_status: 'PENDING_PAYMENT',
          registration_period_years: periodYears,
          purchase_price_paise: totalPricePaise,
          currency: avail.currency || 'INR',
          auto_renew: true,
          privacy_enabled: true,
          contact_info: contactInfo || {
            firstName: res.locals.user.full_name?.split(' ')[0] || 'Store',
            lastName: res.locals.user.full_name?.split(' ')[1] || 'Owner',
            email: res.locals.user.email || 'merchant@example.com',
            phone: '+919876543210',
            addressLine1: 'MG Road',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            countryCode: 'IN',
          },
        })
        .returning();

      return inserted;
    }, userId);

    return res.status(201).json({
      success: true,
      registrationId: registration.id,
      domain: registration.domain_name,
      provider: registration.provider,
      razorpayOrderId: mockRazorpayOrderId,
      amountPaise: totalPricePaise,
      currency: registration.currency,
      periodYears: registration.registration_period_years,
    });
  } catch (error: any) {
    if (error.message === 'DOMAIN_ALREADY_REGISTERED_ON_PLATFORM') {
      return res.status(409).json({ error: 'This domain is already registered on our platform' });
    }
    console.error('Error creating domain purchase order:', error);
    return res.status(500).json({ error: error.message || 'Failed to create domain order' });
  }
});

// 3. Confirm Purchase & Auto-Configure DNS + SSL
domainPurchasingRouter.post('/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Verify Razorpay payment signature if razorpay secret is configured
    if (process.env.RAZORPAY_KEY_SECRET && razorpayOrderId && razorpayPaymentId) {
      if (!razorpaySignature) {
        return res.status(400).json({ error: 'Missing payment signature verification parameter' });
      }
      const crypto = await import('crypto');
      const generatedSignature = crypto.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' });
      }
    }

    const registration = await withStoreContext(store.id, async (tx) => {
      const [reg] = await tx
        .select()
        .from(domain_registrations)
        .where(and(eq(domain_registrations.id, registrationId), eq(domain_registrations.store_id, store.id)));
      return reg || null;
    }, userId);

    if (!registration) {
      return res.status(404).json({ error: 'Domain registration order not found' });
    }

    if (registration.registration_status === 'ACTIVE') {
      return res.status(200).json({ success: true, message: 'Domain is already active', domain: registration.domain_name });
    }

    const provider = getRegistrarProvider(registration.provider as any);

    // Register Domain with Registrar
    const purchaseResult = await provider.purchaseDomain({
      domain: registration.domain_name,
      periodYears: registration.registration_period_years,
      contactInfo: (registration.contact_info as any) || {
        firstName: 'Store',
        lastName: 'Owner',
        email: 'owner@example.com',
        phone: '+919876543210',
        addressLine1: 'Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        countryCode: 'IN',
      },
      autoRenew: registration.auto_renew,
      privacyEnabled: registration.privacy_enabled,
    });

    if (!purchaseResult.success) {
      await withStoreContext(store.id, async (tx) => {
        await tx
          .update(domain_registrations)
          .set({
            registration_status: 'REGISTRATION_FAILED',
            failure_reason: purchaseResult.error || 'Registrar order failed',
            updated_at: sql`now()`,
          })
          .where(eq(domain_registrations.id, registration.id));
      }, userId);

      return res.status(502).json({
        success: false,
        error: purchaseResult.error || 'Domain registration failed at registrar',
      });
    }

    // Configure DNS automatically
    const verificationToken = generateVerificationToken();
    const vpsIp = process.env.VPS_IP || '127.0.0.1';
    const dnsResult = await provider.configurePlatformDns(registration.domain_name, vpsIp, verificationToken);

    // Classify domain type
    const isWww = registration.domain_name.startsWith('www.');
    const parts = registration.domain_name.split('.');
    const domainType = isWww ? 'alias' : (parts.length === 2 ? 'apex' : 'subdomain');

    // Create custom_domains record and update domain_registrations inside transaction
    const finalResult = await withStoreContext(store.id, async (tx) => {
      // Demote existing primary domain
      await tx
        .update(custom_domains)
        .set({ is_primary: false, updated_at: sql`now()` })
        .where(and(eq(custom_domains.store_id, store.id), eq(custom_domains.is_primary, true)));

      // Insert into custom_domains
      const [customDom] = await tx
        .insert(custom_domains)
        .values({
          store_id: store.id,
          hostname: registration.domain_name,
          domain_type: domainType,
          verification_token: verificationToken,
          verification_method: 'dns_txt',
          verification_status: 'VERIFIED',
          verified_at: sql`now()`,
          ssl_status: 'PENDING',
          is_primary: true,
        })
        .returning();

      return { customDom };
    }, userId);

    // Provision SSL
    const sslResult = await provisionSslCertificate(registration.domain_name);

    if (sslResult.success) {
      await withStoreContext(store.id, async (tx) => {
        await tx
          .update(custom_domains)
          .set({
            ssl_status: 'ACTIVE',
            ssl_expires_at: sslResult.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            updated_at: sql`now()`,
          })
          .where(eq(custom_domains.id, finalResult.customDom.id));
      }, userId);
    }

    const updatedReg = await withStoreContext(store.id, async (tx) => {
      const [finalReg] = await tx
        .update(domain_registrations)
        .set({
          custom_domain_id: finalResult.customDom.id,
          provider_domain_id: purchaseResult.providerDomainId,
          registration_status: 'ACTIVE',
          dns_configured: dnsResult.success,
          registered_at: purchaseResult.registeredAt,
          expires_at: purchaseResult.expiresAt,
          updated_at: sql`now()`,
        })
        .where(eq(domain_registrations.id, registration.id))
        .returning();
      return finalReg;
    }, userId);

    return res.status(200).json({
      success: true,
      domain: updatedReg.domain_name,
      registrationStatus: updatedReg.registration_status,
      dnsConfigured: updatedReg.dns_configured,
      sslActive: sslResult.success,
      storeLive: true,
      message: `Domain ${updatedReg.domain_name} successfully purchased, DNS configured via ${updatedReg.provider}, SSL provisioned, and store is now LIVE!`,
    });
  } catch (error: any) {
    console.error('Error confirming domain purchase:', error);
    return res.status(500).json({ error: error.message || 'Purchase confirmation failed' });
  }
});

// 4. List Purchased Domains for Store
domainPurchasingRouter.get('/registrations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const store = await getMerchantStore(userId);

    if (!store) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const registrations = await withStoreContext(store.id, async (tx) => {
      return await tx
        .select()
        .from(domain_registrations)
        .where(eq(domain_registrations.store_id, store.id));
    }, userId);

    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to list domain registrations' });
  }
});
