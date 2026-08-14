import {
  DomainSearchResult,
  DomainAvailabilityResult,
  DomainPurchaseParams,
  DomainPurchaseResult,
  DnsConfigResult,
  DomainDetailsResult,
  DomainRenewalResult,
} from './types';

export interface DomainRegistrarProvider {
  readonly providerName: 'HOSTINGER' | 'RESELLERCLUB' | 'MOCK';

  /**
   * Check if a specific domain is available for registration
   */
  checkAvailability(domain: string): Promise<DomainAvailabilityResult>;

  /**
   * Search domain suggestions across multiple popular TLDs (.in, .shop, .store, .com)
   */
  searchSuggestions(query: string, tlds?: string[]): Promise<DomainSearchResult[]>;

  /**
   * Purchase/Register domain at registrar
   */
  purchaseDomain(params: DomainPurchaseParams): Promise<DomainPurchaseResult>;

  /**
   * Automatically configure DNS records (A, CNAME, TXT) on the registrar's DNS zones
   */
  configurePlatformDns(domain: string, vpsIp: string, verificationToken: string): Promise<DnsConfigResult>;

  /**
   * Fetch current domain status and expiration from registrar
   */
  getDomainDetails(providerDomainId: string, domainName?: string): Promise<DomainDetailsResult>;

  /**
   * Renew domain for specified number of years
   */
  renewDomain(providerDomainId: string, years: number, domainName?: string): Promise<DomainRenewalResult>;
}
