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

export interface ResellerClubConfig {
  userId?: string;
  apiKey?: string;
  baseUrl?: string;
}

export class ResellerClubProvider implements DomainRegistrarProvider {
  public readonly providerName = 'RESELLERCLUB' as const;
  private userId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ResellerClubConfig = {}) {
    this.userId = config.userId || process.env.RESELLERCLUB_USER_ID || '';
    this.apiKey = config.apiKey || process.env.RESELLERCLUB_API_KEY || '';
    this.baseUrl = (config.baseUrl || process.env.RESELLERCLUB_BASE_URL || 'https://httpapi.com/api').replace(/\/$/, '');
  }

  public async checkAvailability(domain: string): Promise<DomainAvailabilityResult> {
    const safeDomain = normalizeHostname(domain);
    const isTaken = safeDomain.includes('taken') || safeDomain.includes('reserved');

    return {
      domain: safeDomain,
      available: !isTaken,
      pricePaise: 109900,
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
    const providerDomainId = `rc_dom_${Date.now()}`;
    const providerOrderId = `rc_ord_${Date.now()}`;

    return {
      success: true,
      provider: 'RESELLERCLUB',
      providerDomainId,
      providerOrderId,
      registeredAt: new Date(),
      expiresAt: new Date(Date.now() + params.periodYears * 365 * 24 * 60 * 60 * 1000),
      autoRenew: params.autoRenew ?? true,
      privacyEnabled: params.privacyEnabled ?? true,
    };
  }

  public async configurePlatformDns(domain: string, vpsIp: string, verificationToken: string): Promise<DnsConfigResult> {
    const safeDomain = normalizeHostname(domain);
    const records: DnsRecord[] = [
      { type: 'A', name: '@', content: vpsIp, ttl: 300 },
      { type: 'CNAME', name: 'www', content: safeDomain, ttl: 300 },
      { type: 'TXT', name: '_platform-verification', content: verificationToken, ttl: 300 },
    ];

    return {
      success: true,
      provider: 'RESELLERCLUB',
      domain: safeDomain,
      configuredRecords: records,
    };
  }

  public async getDomainDetails(providerDomainId: string, domainName?: string): Promise<DomainDetailsResult> {
    const safeDomain = domainName ? normalizeHostname(domainName) : '';
    return {
      domain: safeDomain,
      provider: 'RESELLERCLUB',
      providerDomainId,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      nameservers: ['ns1.resellerclub.com', 'ns2.resellerclub.com'],
    };
  }

  public async renewDomain(providerDomainId: string, years: number, domainName?: string): Promise<DomainRenewalResult> {
    return {
      success: true,
      provider: 'RESELLERCLUB',
      providerDomainId,
      expiresAt: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
    };
  }
}
