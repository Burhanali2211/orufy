/**
 * Nuclear Storage Wipe & Recovery Utility
 * 
 * This utility identifies if a page hang or crash occurred during initialization
 * and performs a full storage purge to recover the application state.
 */

const RECOVERY_KEY = 'sb_recovery_active';

export function initializeRecoverySystem(): void {
  if (typeof window === 'undefined') return;
  
  const entries = performance.getEntriesByType("navigation");
  const isRefresh = entries.length > 0 && (entries[0] as PerformanceNavigationTiming).type === 'reload';
  
  if (isRefresh && sessionStorage.getItem(RECOVERY_KEY)) {
    console.warn('[RECOVERY] Refresh detected during hang. Purging auth storage...');
    
    // Specifically target Supabase keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    });

    // Specifically target Supabase keys in sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if ((key.startsWith('sb-') || key.includes('supabase')) && key !== RECOVERY_KEY) {
        sessionStorage.removeItem(key);
      }
    });
    
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(k => {
          if (k.includes('supabase') || k.includes('api')) {
            caches.delete(k);
          }
        });
      });
    }
    
    // Only unregister if strictly necessary, but maybe leave it for now
  }
  
  // Set the recovery flag — it should be cleared by AuthContext if initialization succeeds
  sessionStorage.setItem(RECOVERY_KEY, 'true');
}

/**
 * Clear the recovery flag once initialization is successful
 */
export function clearRecoveryFlag(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(RECOVERY_KEY);
  }
}
