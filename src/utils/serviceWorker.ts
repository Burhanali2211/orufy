/**
 * Service Worker Management
 * 
 * Currently disabled in production due to caching issues with dynamic imports.
 * Service Workers can cache corrupted assets and cause intermittent failures.
 * 
 * To re-enable:
 * 1. Implement proper cache versioning
 * 2. Add cache invalidation strategy
 * 3. Test thoroughly in staging
 */

/**
 * Unregister all Service Workers
 * This is called on app initialization to prevent caching issues
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      try {
        const unregistered = await registration.unregister();
        if (unregistered) {
          console.info('[SW] Service Worker unregistered:', registration.scope);
        }
      } catch (error) {
        console.warn('[SW] Error unregistering Service Worker:', error);
      }
    }

    // Also try to unregister by scope
    if (registrations.length === 0) {
      try {
        await navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            return reg.unregister();
          }
        });
      } catch (error) {
        // Ignore errors if no registration exists
      }
    }
  } catch (error) {
    console.warn('[SW] Error getting Service Worker registrations:', error);
  }
}

/**
 * Register Service Worker (currently disabled in production)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Temporarily disable service worker in production due to caching issues
  // TODO: Re-enable after fixing cache invalidation strategy
  if (import.meta.env.PROD) {
    // Unregister any existing workers
    await unregisterServiceWorkers();
    console.warn('[SW] Service Worker disabled in production - caching issues detected');
    return null;
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.info('[SW] Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('[SW] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Initialize Service Worker management
 * Called on app startup
 */
export async function initServiceWorker(): Promise<void> {
  // Always unregister existing workers first to prevent caching issues
  await unregisterServiceWorkers();
  
  // Service Worker is currently disabled to prevent caching issues and registration errors.
  /*
  // Only register in development
  if (!import.meta.env.PROD) {
    await registerServiceWorker();
  }
  */
}

