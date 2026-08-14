import { DomainRegistrarProvider } from './provider.interface';
import {
  DomainSearchResult,
  DomainAvailabilityResult,
  DomainPurchaseParams,
  DomainPurchaseResult,
  DnsConfigResult,
  DomainDetailsResult,
  DomainRenewalResult,
  DnsRecord,
} from './types';
import { normalizeHostname } from '../domainUtils';

const DEFAULT_PRICING: Record<string, number> = {
  in: 89900,     // ₹899
  shop: 129900,  // ₹1,299
  store: 149900, // ₹1,499
  com: 119900,   // ₹1,199
  online: 69900,  // ₹699
};

export class MockRegistrarProvider implements DomainRegistrarProvider {
  public readonly providerName = 'MOCK' as const;

  // In-memory store for registered domains and DNS zones
  private registeredDomains: Map<string, {
    providerDomainId: string;
    providerOrderId: string;
    expiresAt: Date;
    autoRenew: boolean;
    privacyEnabled: boolean;
    dnsRecords: DnsRecord[];
  }> = new Map();

  constructor() {
    // Seed some mock registered domains
    this.registeredDomains.set('taken-domain.com', {
      providerDomainId: 'mock_dom_taken',
      providerOrderId: 'mock_ord_taken',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      privacyEnabled: true,
      dnsRecords: [],
    });
  }

  public async checkAvailability(domain: string): Promise<DomainAvailabilityResult> {
    const safeDomain = normalizeHostname(domain);
    const parts = safeDomain.split('.');
    const tld = parts[parts.length - 1];
    const pricePaise = DEFAULT_PRICING[tld] || 99900;

    // Reject reserved or already registered domains
    const isTaken = this.registeredDomains.has(safeDomain) || safeDomain.includes('taken') || safeDomain.includes('reserved');

    return {
      domain: safeDomain,
      available: !isTaken,
      pricePaise,
      currency: 'INR',
      periodYears: 1,
    };
  }

  public async searchSuggestions(query: string, tlds: string[] = ['in', 'shop', 'store', 'com']): Promise<DomainSearchResult[]> {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const results: DomainSearchResult[] = [];

    for (const tld of tlds) {
      const candidateDomain = `${cleanQuery}.${tld}`;
      const avail = await this.checkAvailability(candidateDomain);
      results.push({
        domain: candidateDomain,
        available: avail.available,
        pricePaise: avail.pricePaise,
        currency: 'INR',
        periodYears: 1,
        tld,
      });
    }

    return results;
  }

  public async purchaseDomain(params: DomainPurchaseParams): Promise<DomainPurchaseResult> {
    const safeDomain = normalizeHostname(params.domain);
    const avail = await this.checkAvailability(safeDomain);

    if (!avail.available) {
      return {
        success: false,
        provider: 'MOCK',
        providerDomainId: '',
        providerOrderId: '',
        registeredAt: new Date(),
        expiresAt: new Date(),
        autoRenew: false,
        privacyEnabled: false,
        error: 'DOMAIN_ALREADY_REGISTERED',
      };
    }

    const providerDomainId = `mock_dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const providerOrderId = `mock_ord_${Date.now()}`;
    const registeredAt = new Date();
    const expiresAt = new Date(Date.now() + params.periodYears * 365 * 24 * 60 * 60 * 1000);

    this.registeredDomains.set(safeDomain, {
      providerDomainId,
      providerOrderId,
      expiresAt,
      autoRenew: params.autoRenew ?? true,
      privacyEnabled: params.privacyEnabled ?? true,
      dnsRecords: [],
    });

    return {
      success: true,
      provider: 'MOCK',
      providerDomainId,
      providerOrderId,
      registeredAt,
      expiresAt,
      autoRenew: params.autoRenew ?? true,
      privacyEnabled: params.privacyEnabled ?? true,
    };
  }

  public async configurePlatformDns(domain: string, vpsIp: string, verificationToken: string): Promise<DnsConfigResult> {
    const safeDomain = normalizeHostname(domain);
    const domainRecord = this.registeredDomains.get(safeDomain);

    if (!domainRecord) {
      return {
        success: false,
        provider: 'MOCK',
        domain: safeDomain,
        configuredRecords: [],
        error: 'DOMAIN_NOT_FOUND_AT_REGISTRAR',
      };
    }

    const records: DnsRecord[] = [
      { type: 'A', name: '@', content: vpsIp, ttl: 300 },
      { type: 'CNAME', name: 'www', content: safeDomain, ttl: 300 },
      { type: 'TXT', name: '_platform-verification', content: verificationToken, ttl: 300 },
    ];

    domainRecord.dnsRecords = records;

    return {
      success: true,
      provider: 'MOCK',
      domain: safeDomain,
      configuredRecords: records,
    };
  }

  public async getDomainDetails(providerDomainId: string, domainName?: string): Promise<DomainDetailsResult> {
    const safeDomain = domainName ? normalizeHostname(domainName) : 'mock-domain.com';
    const record = this.registeredDomains.get(safeDomain);

    return {
      domain: safeDomain,
      provider: 'MOCK',
      providerDomainId: providerDomainId || record?.providerDomainId || 'mock_id',
      status: 'ACTIVE',
      expiresAt: record?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: record?.autoRenew ?? true,
      nameservers: ['ns1.mock-dns.com', 'ns2.mock-dns.com'],
    };
  }

  public async renewDomain(providerDomainId: string, years: number, domainName?: string): Promise<DomainRenewalResult> {
    const safeDomain = domainName ? normalizeHostname(domainName) : '';
    const record = this.registeredDomains.get(safeDomain);

    const currentExpiry = record?.expiresAt || new Date();
    const newExpiresAt = new Date(currentExpiry.getTime() + years * 365 * 24 * 60 * 60 * 1000);

    if (record) {
      record.expiresAt = newExpiresAt;
    }

    return {
      success: true,
      provider: 'MOCK',
      providerDomainId,
      expiresAt: newExpiresAt,
    };
  }
}
