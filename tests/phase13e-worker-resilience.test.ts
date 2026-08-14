import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  expirePendingReservationsOnce,
  RESERVATION_EXPIRY_LOCK_ID
} from '../backend/src/workers/reservationExpiryWorker';
import { WorkerManager } from '../backend/src/workers/workerManager';

const { mockDb } = vi.hoisted(() => {
  const mockDb: any = {
    execute: vi.fn().mockImplementation(() => [{ acquired: true }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation(async (cb: any) => cb(mockDb)),
  };
  return { mockDb };
});

vi.mock('../backend/src/db/db', () => ({
  db: mockDb,
}));

describe('Phase 13E — Worker Resilience & Advisory Locking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('attempts to acquire PostgreSQL advisory lock before executing sweep', async () => {
    mockDb.execute.mockResolvedValueOnce([{ acquired: true }]); // Lock acquired
    mockDb.execute.mockResolvedValueOnce([{ unlocked: true }]); // Lock unlocked

    await expirePendingReservationsOnce(mockDb);

    expect(mockDb.execute).toHaveBeenCalledTimes(2);
  });

  it('skips sweep if advisory lock cannot be acquired (e.g. concurrent worker active)', async () => {
    mockDb.execute.mockResolvedValueOnce([{ acquired: false }]); // Lock NOT acquired

    const count = await expirePendingReservationsOnce(mockDb);

    expect(count).toBe(0);
    // Should NOT proceed to query inventory_reservations
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('WorkerManager initializes and stops workers cleanly without unhandled rejections', () => {
    expect(() => {
      WorkerManager.startAll();
      const status = WorkerManager.getStatus();
      expect(status.reservationExpiryWorker).toBe('active');
      expect(status.webhookRetryWorker).toBe('active');
      WorkerManager.stopAll();
    }).not.toThrow();
  });
});
