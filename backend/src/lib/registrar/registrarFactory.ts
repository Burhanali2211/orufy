import { DomainRegistrarProvider } from './provider.interface';
import { HostingerProvider } from './hostingerProvider';
import { ResellerClubProvider } from './resellerClubProvider';
import { MockRegistrarProvider } from './mockProvider';

let registrarInstance: DomainRegistrarProvider | null = null;

/**
 * Returns the active DomainRegistrarProvider instance.
 * Defaults to HostingerProvider in production, MockRegistrarProvider in test/development.
 */
export function getRegistrarProvider(overrideProvider?: 'HOSTINGER' | 'RESELLERCLUB' | 'MOCK'): DomainRegistrarProvider {
  if (overrideProvider) {
    switch (overrideProvider) {
      case 'HOSTINGER':
        return new HostingerProvider();
      case 'RESELLERCLUB':
        return new ResellerClubProvider();
      case 'MOCK':
      default:
        return new MockRegistrarProvider();
    }
  }

  if (registrarInstance) {
    return registrarInstance;
  }

  const configuredProvider = (process.env.REGISTRAR_PROVIDER || '').toUpperCase();

  if (configuredProvider === 'HOSTINGER' && process.env.HOSTINGER_API_TOKEN) {
    registrarInstance = new HostingerProvider();
  } else if (configuredProvider === 'RESELLERCLUB' && process.env.RESELLERCLUB_API_KEY) {
    registrarInstance = new ResellerClubProvider();
  } else {
    // Default to Mock provider for local development and deterministic testing
    registrarInstance = new MockRegistrarProvider();
  }

  return registrarInstance;
}

/**
 * Resets the active registrar instance (useful for test suites)
 */
export function setRegistrarProvider(provider: DomainRegistrarProvider | null) {
  registrarInstance = provider;
}
