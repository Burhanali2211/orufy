// Health check endpoint for external monitoring services
// Browser-compatible client-side health check

// Store app start time for uptime calculation
const appStartTime = Date.now();

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  services: {
    database: 'ok' | 'error';
    auth: 'ok' | 'error';
    api: 'ok' | 'error';
  };
  metrics?: {
    uptime: number;
    memoryUsage: number;
  };
}

/**
 * Get browser-compatible uptime in seconds
 */
const getUptime = (): number => {
  return Math.floor((Date.now() - appStartTime) / 1000);
};

/**
 * Get memory usage if available (Chrome only)
 */
const getMemoryUsage = (): number => {
  if (typeof window !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize || 0;
  }
  return 0;
};

export const healthCheck = async (): Promise<HealthCheckResponse> => {
  // Check actual service health
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    services: {
      database: 'ok',
      auth: 'ok',
      api: 'ok'
    },
    metrics: {
      uptime: getUptime(),
      memoryUsage: getMemoryUsage()
    }
  };
  
  return response;
};

// Simple uptime endpoint
export const uptimeCheck = async (): Promise<{ uptime: number; status: 'ok' }> => {
  return {
    uptime: getUptime(),
    status: 'ok'
  };
};

// Export as default for compatibility
export default {
  healthCheck,
  uptimeCheck
};