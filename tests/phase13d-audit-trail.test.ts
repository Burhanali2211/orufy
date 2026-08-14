import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../backend/src/services/auditService';
import { audit_logs } from '../backend/src/db/schema';

const { mockDb } = vi.hoisted(() => {
  const mockDb: any = {
    insert: vi.fn().mockImplementation(() => mockDb),
    values: vi.fn().mockImplementation((vals) => ({
      returning: vi.fn().mockResolvedValue([{ id: 'audit_log_1', ...vals }]),
    })),
  };
  return { mockDb };
});

vi.mock('../backend/src/db/db', () => ({
  db: mockDb,
}));

describe('Phase 13D — Append-Only Immutable Audit Trail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records audit log entry for security-critical merchant mutations', async () => {
    const result = await AuditService.log({
      storeId: 'store_101',
      actorUserId: 'user_merchant_1',
      action: 'PAYMENT_ACCOUNT_CONNECTED',
      resourceType: 'payment',
      resourceId: 'acc_rzp_linked_1',
      metadata: { previousAccount: null, newAccount: 'acc_rzp_linked_1' },
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 Admin Browser',
    });

    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalledWith(audit_logs);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: 'store_101',
        actor_user_id: 'user_merchant_1',
        action: 'PAYMENT_ACCOUNT_CONNECTED',
        resource_type: 'payment',
        resource_id: 'acc_rzp_linked_1',
        metadata: { previousAccount: null, newAccount: 'acc_rzp_linked_1' },
        ip_address: '192.168.1.50',
        user_agent: 'Mozilla/5.0 Admin Browser',
      })
    );
  });

  it('handles audit recording gracefully without throwing exceptions on transient failure', async () => {
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Simulated DB audit constraint issue');
    });

    const result = await AuditService.log({
      storeId: 'store_101',
      action: 'DOMAIN_REMOVED',
      resourceType: 'domain',
      resourceId: 'old-brand.com',
    });

    expect(result.success).toBe(false);
  });
});
