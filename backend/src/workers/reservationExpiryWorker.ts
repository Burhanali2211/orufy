import { db } from '../db/db';
import { inventory_reservations, products, orders } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';

export const RESERVATION_EXPIRY_LOCK_ID = 847291;

/**
 * Runs a single sweep to find and expire all stale inventory reservations.
 * Atomically releases reserved_stock and marks orders as PAYMENT_EXPIRED.
 * Uses PostgreSQL advisory locking to ensure singleton execution.
 */
export async function expirePendingReservationsOnce(customDb: any = db): Promise<number> {
  let expiredCount = 0;

  try {
    // 1. Try to acquire PostgreSQL advisory lock if execute is available
    let lockAcquired = true;
    if (typeof customDb.execute === 'function') {
      const lockRes: any = await customDb.execute(
        sql`SELECT pg_try_advisory_lock(${RESERVATION_EXPIRY_LOCK_ID}) as acquired;`
      );
      if (lockRes && Array.isArray(lockRes) && lockRes[0]?.acquired === false) {
        lockAcquired = false;
      } else if (lockRes?.rows && Array.isArray(lockRes.rows) && lockRes.rows[0]?.acquired === false) {
        lockAcquired = false;
      }
    }

    if (!lockAcquired) {
      return 0;
    }

    try {
      const now = new Date();
      
      // Find all expired reservations that are still in RESERVED status
      const expiredList = await customDb
        .select()
        .from(inventory_reservations)
        .where(
          and(
            eq(inventory_reservations.status, 'RESERVED'),
            lt(inventory_reservations.expires_at, now)
          )
        );

      if (!expiredList || expiredList.length === 0) {
        return 0;
      }

      for (const resItem of expiredList) {
        try {
          await customDb.transaction(async (tx: any) => {
            // 1. Lock and update product reserved stock
            const prodRows = await tx
              .select()
              .from(products)
              .where(eq(products.id, resItem.product_id));
            
            const prod = prodRows?.[0];
            if (prod) {
              const newReserved = Math.max(0, (prod.reserved_stock || 0) - resItem.quantity);
              await tx
                .update(products)
                .set({
                  reserved_stock: newReserved,
                  updated_at: sql`now()`,
                })
                .where(eq(products.id, prod.id));
            }

            // 2. Mark reservation as EXPIRED
            await tx
              .update(inventory_reservations)
              .set({
                status: 'EXPIRED',
                updated_at: sql`now()`,
              })
              .where(eq(inventory_reservations.id, resItem.id));

            // 3. Mark corresponding order as PAYMENT_EXPIRED if it was still PAYMENT_PENDING
            await tx
              .update(orders)
              .set({
                status: 'PAYMENT_EXPIRED',
                payment_status: 'PAYMENT_EXPIRED',
                updated_at: sql`now()`,
              })
              .where(
                and(
                  eq(orders.id, resItem.order_id),
                  eq(orders.payment_status, 'PAYMENT_PENDING')
                )
              );

            expiredCount++;
          });
        } catch (err) {
          console.error(`Failed to expire reservation ${resItem.id}:`, err);
        }
      }
    } finally {
      // 3. Release advisory lock
      await customDb.execute(sql`SELECT pg_advisory_unlock(${RESERVATION_EXPIRY_LOCK_ID});`);
    }
  } catch (lockErr) {
    console.error('[Worker] Advisory lock error during sweep:', lockErr);
  }

  return expiredCount;
}

let activeInterval: NodeJS.Timeout | null = null;
let isShuttingDown = false;

/**
 * Starts the periodic reservation expiry worker.
 */
export function startReservationExpiryWorker(intervalMs: number = 30000): NodeJS.Timeout {
  if (activeInterval) return activeInterval;
  isShuttingDown = false;

  console.log(`[Worker] Reservation expiry worker started with advisory lock (sweep interval: ${intervalMs}ms)`);
  
  activeInterval = setInterval(async () => {
    if (isShuttingDown) return;
    try {
      const expiredCount = await expirePendingReservationsOnce();
      if (expiredCount > 0) {
        console.log(`[Worker] Expired ${expiredCount} stale inventory reservations.`);
      }
    } catch (err) {
      console.error('[Worker] Error during reservation expiry sweep:', err);
    }
  }, intervalMs);

  return activeInterval;
}

/**
 * Stops the reservation expiry worker gracefully.
 */
export function stopReservationExpiryWorker(): void {
  isShuttingDown = true;
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  console.log('[Worker] Reservation expiry worker stopped gracefully.');
}
