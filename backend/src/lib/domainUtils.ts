import crypto from 'crypto';
import dns from 'dns';

/**
 * Normalizes a raw hostname into its canonical representation.
 * - Strips ports (:3000, :5000, etc.)
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips trailing dot (.)
 * - Validates against RFC-compliant domain formatting
 */
export function normalizeHostname(rawHost: string): string {
  if (!rawHost || typeof rawHost !== 'string') {
    throw new Error('Invalid hostname: Hostname must be a non-empty string');
  }

  let host = rawHost.trim().toLowerCase();

  // Prevent path traversal, spaces, protocol prefixes, or control characters
  if (host.includes('/') || host.includes('\\') || host.includes(' ') || host.startsWith('http:') || host.startsWith('https:')) {
    throw new Error('Invalid hostname: Hostname contains illegal characters');
  }

  // Strip port if present
  host = host.split(':')[0].trim();

  // Strip trailing dot
  if (host.endsWith('.')) {
    host = host.slice(0, -1);
  }

  // RFC 1035 / RFC 1123 Hostname Validation
  // Allow localhost or standard domain names (labels separated by dots)
  if (host === 'localhost') {
    return host;
  }

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (!domainRegex.test(host)) {
    throw new Error(`Invalid hostname format: "${host}" is not a valid domain`);
  }

  return host;
}

/**
 * Generates a cryptographically secure verification token for DNS TXT challenge.
 */
export function generateVerificationToken(): string {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `bf-domain-verification=${randomHex}`;
}

/**
 * Verifies DNS TXT record for domain ownership challenge.
 * Checks for record at `_platform-verification.<hostname>`.
 */
export async function verifyDnsTxtRecord(
  hostname: string,
  expectedToken: string
): Promise<{ success: boolean; foundRecords: string[]; error?: string }> {
  const normalized = normalizeHostname(hostname);
  const verificationHost = `_platform-verification.${normalized}`;

  try {
    const records = await dns.promises.resolveTxt(verificationHost);
    // records is string[][] (chunks per TXT record)
    const flatRecords = records.map(chunkArray => chunkArray.join(''));
    const matched = flatRecords.some(rec => rec.trim() === expectedToken.trim());

    return {
      success: matched,
      foundRecords: flatRecords,
    };
  } catch (err: any) {
    return {
      success: false,
      foundRecords: [],
      error: err.code || err.message || 'DNS_LOOKUP_FAILED',
    };
  }
}
