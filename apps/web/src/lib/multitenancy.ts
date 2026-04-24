/**
 * Multitenancy Utility
 * 
 * Logic to differentiate between the main SaaS platform and individual storefronts.
 */

export function isStorefront(): boolean {
  const hostname = window.location.hostname;

  // Local development handling
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Optional: Use a query param or specific port to test storefront on localhost
    // For now, default to SaaS on localhost unless specified
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'storefront') return true;
    
    // Check if we're using a local subdomain like store.localhost
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[parts.length-1] === 'localhost') {
        return true;
    }
    
    return false;
  }

  // Production handling
  const parts = hostname.split('.');
  
  // Example main domains
  const mainDomains = ['orufy.com', 'aligarh-attars.pages.dev'];
  const currentDomain = parts.slice(-2).join('.');
  
  // If it's the main domain (or www.maindomain), it's the SaaS site
  if (mainDomains.includes(currentDomain)) {
    // If it's a subdomain other than www, it's a storefront
    return parts.length > 2 && parts[0] !== 'www';
  }

  // If it's any other domain, it's a custom TLD storefront
  return true;
}

export const IS_STOREFRONT = isStorefront();
