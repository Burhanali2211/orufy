/**
 * Automatic retry logic for failed requests
 * Handles 401 (expired token) by refreshing and retrying
 */

import { supabase } from './legacyDb';

interface RetryConfig {
  maxAttempts?: number;
  backoffMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const maxAttempts = config.maxAttempts || 3;
  const backoffMs = config.backoffMs || 500;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If 401 (token expired), refresh and retry
      if (error?.status === 401 || error?.message?.includes('401')) {
        if (attempt < maxAttempts) {
          console.warn(`[RETRY] 401 Unauthorized. Refreshing token (attempt ${attempt}/${maxAttempts})`);

          // Force token refresh
          try {
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !data.session) {
              throw new Error('Token refresh failed');
            }
            console.log('[RETRY] Token refreshed. Retrying request...');
          } catch (refreshErr) {
            console.error('[RETRY] Token refresh failed:', refreshErr);
            throw lastError; // Give up if refresh failed
          }

          // Wait before retrying
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
          }
          continue;
        }
      }

      // For other errors, retry with backoff (network issues, etc)
      if (attempt < maxAttempts && !error?.status) {
        console.warn(`[RETRY] Request failed (attempt ${attempt}/${maxAttempts}). Retrying...`, error?.message);
        await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
        continue;
      }

      // No more retries
      throw lastError;
    }
  }

  throw lastError;
}

/**
 * Wrapper for supabase query with auto-retry
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  options: RetryConfig = {}
): Promise<T> {
  return fetchWithRetry(async () => {
    const { data, error } = await queryFn();
    
    return data;
  }, options);
}
