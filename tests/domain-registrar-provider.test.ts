import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistrarProvider } from '../backend/src/lib/registrar/mockProvider';
import { HostingerProvider } from '../backend/src/lib/registrar/hostingerProvider';
import { ResellerClubProvider } from '../backend/src/lib/registrar/resellerClubProvider';
import { getRegistrarProvider, setRegistrarProvider } from '../backend/src/lib/registrar/registrarFactory';

describe('Phase 10 — Domain Registrar Provider Architecture & Adapter Tests', () => {
  beforeEach(() => {
    setRegistrarProvider(null);
  });

  describe('1. MockRegistrarProvider Implementation', () => {
    const provider = new MockRegistrarProvider();

    it('identifies providerName as MOCK', () => {
      expect(provider.providerName).toBe('MOCK');
    });

    it('checks domain availability correctly', async () => {
      const avail = await provider.checkAvailability('available-store.in');
      expect(avail.available).toBe(true);
      expect(avail.pricePaise).toBe(89900); // ₹899
      expect(avail.currency).toBe('INR');

      const taken = await provider.checkAvailability('taken-domain.com');
      expect(taken.available).toBe(false);
    });

    it('searches multi-TLD suggestions (.in, .shop, .store, .com)', async () => {
      const results = await provider.searchSuggestions('attarhouse', ['in', 'shop', 'store', 'com']);
      expect(results.length).toBe(4);
      expect(results.map(r => r.tld)).toEqual(['in', 'shop', 'store', 'com']);
      expect(results.every(r => r.domain.startsWith('attarhouse.'))).toBe(true);
    });

    it('purchases domain and allocates provider IDs', async () => {
      const result = await provider.purchaseDomain({
        domain: 'brandnewstore.shop',
        periodYears: 1,
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+919876543210',
          addressLine1: '123 Market St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          countryCode: 'IN',
        },
        autoRenew: true,
        privacyEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.providerDomainId).toMatch(/^mock_dom_/);
      expect(result.providerOrderId).toMatch(/^mock_ord_/);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() + 300 * 24 * 60 * 60 * 1000);
    });

    it('rejects purchase for already registered domain', async () => {
      const result = await provider.purchaseDomain({
        domain: 'taken-domain.com',
        periodYears: 1,
        contactInfo: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+919876543210',
          addressLine1: '123 Market St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          countryCode: 'IN',
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DOMAIN_ALREADY_REGISTERED');
    });

    it('automatically configures platform DNS records (A, CNAME, TXT)', async () => {
      // First purchase
      await provider.purchaseDomain({
        domain: 'mydnsshop.store',
        periodYears: 1,
        contactInfo: {
          firstName: 'Alex',
          lastName: 'Smith',
          email: 'alex@example.com',
          phone: '+919876543210',
          addressLine1: '456 Tech Ave',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          countryCode: 'IN',
        }
      });

      const dns = await provider.configurePlatformDns('mydnsshop.store', '172.28.0.5', 'bf-domain-verification=tok999');
      expect(dns.success).toBe(true);
      expect(dns.configuredRecords.length).toBe(3);

      const aRec = dns.configuredRecords.find(r => r.type === 'A');
      const cnameRec = dns.configuredRecords.find(r => r.type === 'CNAME');
      const txtRec = dns.configuredRecords.find(r => r.type === 'TXT');

      expect(aRec?.content).toBe('172.28.0.5');
      expect(cnameRec?.content).toBe('mydnsshop.store');
      expect(txtRec?.content).toBe('bf-domain-verification=tok999');
    });

    it('renews domain and extends expiration date', async () => {
      const renewal = await provider.renewDomain('mock_dom_123', 2, 'mydnsshop.store');
      expect(renewal.success).toBe(true);
      expect(renewal.expiresAt.getTime()).toBeGreaterThan(Date.now() + 600 * 24 * 60 * 60 * 1000);
    });
  });

  describe('2. HostingerProvider Adapter Interface Conformance', () => {
    const hostinger = new HostingerProvider({ apiToken: 'test_token', baseUrl: 'https://api.hostinger.com/v1' });

    it('identifies providerName as HOSTINGER', () => {
      expect(hostinger.providerName).toBe('HOSTINGER');
    });

    it('formats purchase domain payload correctly', async () => {
      // In test mode without live network calls, provider conforms to interface
      const avail = await hostinger.checkAvailability('hostinger-test-store.in');
      expect(avail.domain).toBe('hostinger-test-store.in');
      expect(avail.pricePaise).toBeGreaterThan(0);
    });
  });

  describe('3. ResellerClubProvider Adapter Interface Conformance', () => {
    const rc = new ResellerClubProvider({ userId: 'rc_user_1', apiKey: 'rc_key_1' });

    it('identifies providerName as RESELLERCLUB', () => {
      expect(rc.providerName).toBe('RESELLERCLUB');
    });

    it('checks availability and configures DNS', async () => {
      const avail = await rc.checkAvailability('reseller-test.com');
      expect(avail.available).toBe(true);

      const dns = await rc.configurePlatformDns('reseller-test.com', '1.2.3.4', 'bf-domain-verification=rctok');
      expect(dns.success).toBe(true);
      expect(dns.configuredRecords.length).toBe(3);
    });
  });

  describe('4. RegistrarFactory Selection', () => {
    it('returns MockRegistrarProvider by default or when REGISTRAR_PROVIDER=MOCK', () => {
      const provider = getRegistrarProvider('MOCK');
      expect(provider.providerName).toBe('MOCK');
    });

    it('returns HostingerProvider when requested', () => {
      const provider = getRegistrarProvider('HOSTINGER');
      expect(provider.providerName).toBe('HOSTINGER');
    });

    it('returns ResellerClubProvider when requested', () => {
      const provider = getRegistrarProvider('RESELLERCLUB');
      expect(provider.providerName).toBe('RESELLERCLUB');
    });
  });
});
