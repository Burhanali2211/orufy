export interface DomainSearchResult {
  domain: string;
  available: boolean;
  pricePaise: number;
  currency: string;
  periodYears: number;
  tld: string;
  isPremium?: boolean;
}

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  pricePaise: number;
  currency: string;
  periodYears: number;
  isPremium?: boolean;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string; // ISO 2-letter e.g. "IN", "US"
  organization?: string;
}

export interface DomainPurchaseParams {
  domain: string;
  periodYears: number;
  contactInfo: ContactInfo;
  autoRenew?: boolean;
  privacyEnabled?: boolean;
}

export interface DomainPurchaseResult {
  success: boolean;
  provider: 'HOSTINGER' | 'RESELLERCLUB' | 'MOCK';
  providerDomainId: string;
  providerOrderId: string;
  registeredAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
  privacyEnabled: boolean;
  error?: string;
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT' | 'AAAA' | 'MX';
  name: string; // e.g. "@", "www", "_platform-verification"
  content: string; // e.g. "127.0.0.1", "bf-domain-verification=..."
  ttl?: number;
}

export interface DnsConfigResult {
  success: boolean;
  provider: string;
  domain: string;
  configuredRecords: DnsRecord[];
  error?: string;
}

export interface DomainDetailsResult {
  domain: string;
  provider: string;
  providerDomainId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED';
  expiresAt: Date;
  autoRenew: boolean;
  nameservers: string[];
}

export interface DomainRenewalResult {
  success: boolean;
  provider: string;
  providerDomainId: string;
  expiresAt: Date;
  error?: string;
}
