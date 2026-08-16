/**
 * Environment Variable Validation
 * Validates env vars gracefully for self-hosted and cloud execution
 */

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  razorpayKeyId: string;
  siteUrl: string;
  isDevelopment: boolean;
}

function getEnvVar(key: string, defaultValue: string = ''): string {
  const value = import.meta.env[key];
  return value || defaultValue;
}

export function validateEnvironment(): AppConfig {
  const isDevelopment = import.meta.env.MODE === 'development';

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://self-hosted-platform.local');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'self_hosted_fallback');
  const razorpayKeyId = getEnvVar('VITE_RAZORPAY_KEY_ID', 'rzp_test_platform_mock');
  const siteUrl = getEnvVar('VITE_SITE_URL', 'http://localhost:5173');

  return {
    supabaseUrl,
    supabaseAnonKey,
    razorpayKeyId,
    siteUrl,
    isDevelopment,
  };
}

// Validate on import
let appConfig: AppConfig | null = null;

try {
  appConfig = validateEnvironment();
} catch (error) {
  console.warn('[ENV] Configuration fallback active:', error);
  appConfig = {
    supabaseUrl: 'https://self-hosted-platform.local',
    supabaseAnonKey: 'self_hosted_fallback',
    razorpayKeyId: 'rzp_test_platform_mock',
    siteUrl: 'http://localhost:5173',
    isDevelopment: true,
  };
}

export function getAppConfig(): AppConfig {
  return appConfig || {
    supabaseUrl: 'https://self-hosted-platform.local',
    supabaseAnonKey: 'self_hosted_fallback',
    razorpayKeyId: 'rzp_test_platform_mock',
    siteUrl: 'http://localhost:5173',
    isDevelopment: true,
  };
}
