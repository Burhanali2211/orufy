/**
 * Retry logic for failed requests
 * Handles transient network errors with exponential backoff
 */

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

      // For network/transient errors, retry with backoff
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
 * Wrapper for a query fn with auto-retry
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  options: RetryConfig = {}
): Promise<T> {
  return fetchWithRetry(async () => {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data;
  }, options);
}
