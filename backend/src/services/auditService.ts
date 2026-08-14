import { db } from '../db/db';
import { audit_logs } from '../db/schema';

export interface AuditLogPayload {
  storeId?: string | null;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Records an immutable audit log entry.
   * Runs non-blockingly so failures in audit recording do not break transactions.
   */
  public static async log(payload: AuditLogPayload): Promise<{ success: boolean; logId?: string }> {
    try {
      const [entry] = await db
        .insert(audit_logs)
        .values({
          store_id: payload.storeId || null,
          actor_user_id: payload.actorUserId || null,
          action: payload.action,
          resource_type: payload.resourceType,
          resource_id: payload.resourceId || null,
          metadata: payload.metadata || {},
          ip_address: payload.ipAddress || null,
          user_agent: payload.userAgent || null,
        })
        .returning();

      return { success: true, logId: entry?.id };
    } catch (error) {
      console.warn('[AuditService] Failed to record audit log:', error);
      return { success: false };
    }
  }
}
