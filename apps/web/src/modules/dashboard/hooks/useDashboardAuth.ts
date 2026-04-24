/**
 * Typed wrapper around useAuth() that includes the `tenant` field.
 * AuthContext will expose `tenant` once multi-tenant support is wired up;
 * until then this cast keeps dashboard components type-safe without `any`.
 */
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import type { Tenant } from '../types';

export interface DashboardAuth {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useDashboardAuth(): DashboardAuth {
  return useAuth() as unknown as DashboardAuth;
}
