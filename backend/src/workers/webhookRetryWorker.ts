import { db } from '../db/db';
import { payment_webhook_events } from '../db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { processWebhookBusinessEvent } from '../routes/payment';

export class WebhookRetryWorker {
  private static intervalTimer: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static isShuttingDown = false;

  public static readonly ADVISORY_LOCK_ID = 847292;

  /**
   * Starts the background retry worker polling every intervalMs (default: 15s).
   */
  public static start(intervalMs: number = 15000): void {
    if (this.intervalTimer) return;
    this.isShuttingDown = false;

    this.intervalTimer = setInterval(async () => {
      if (this.isShuttingDown || this.isRunning) return;
      await this.runSweep();
    }, intervalMs);

    console.log(`[WebhookRetryWorker] Background worker started with ${intervalMs}ms interval.`);
  }

  /**
   * Stops the worker cleanly.
   */
  public static stop(): void {
    this.isShuttingDown = true;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log('[WebhookRetryWorker] Background worker stopped gracefully.');
  }

  /**
   * Executes a single sweep cycle using PostgreSQL advisory locking.
   */
  public static async runSweep(): Promise<{ processed: number; deadLettered: number }> {
    if (this.isRunning) return { processed: 0, deadLettered: 0 };
    this.isRunning = true;

    let processedCount = 0;
    let deadLetteredCount = 0;

    try {
      // 1. Try to acquire PostgreSQL session advisory lock to ensure singleton execution
      const lockRes: any = await db.execute(
        sql`SELECT pg_try_advisory_lock(${this.ADVISORY_LOCK_ID}) as acquired;`
      );
      const lockAcquired = lockRes?.[0]?.acquired || lockRes?.rows?.[0]?.acquired;

      if (!lockAcquired) {
        return { processed: 0, deadLettered: 0 };
      }

      try {
        const now = new Date();

        // 2. Fetch retryable webhook events where next_retry_at <= now
        const retryEvents = await db
          .select()
          .from(payment_webhook_events)
          .where(
            and(
              eq(payment_webhook_events.processing_status, 'RETRY'),
              lte(payment_webhook_events.next_retry_at, now)
            )
          );

        for (const evt of retryEvents) {
          if (this.isShuttingDown) break;

          const nextAttempt = evt.attempt_count + 1;

          if (nextAttempt > evt.max_attempts) {
            // Transition to DEAD_LETTER after max attempts exhausted
            await db
              .update(payment_webhook_events)
              .set({
                processing_status: 'DEAD_LETTER',
                last_attempt_at: sql`now()`,
                updated_at: sql`now()`,
                error_message: `Exhausted all ${evt.max_attempts} retry attempts. Transferred to Dead-Letter queue.`,
              })
              .where(eq(payment_webhook_events.id, evt.id));

            deadLetteredCount++;
            continue;
          }

          // Attempt processing in transaction
          try {
            await db.transaction(async (tx) => {
              await processWebhookBusinessEvent(evt.payload as any, tx);

              await tx
                .update(payment_webhook_events)
                .set({
                  processing_status: 'PROCESSED',
                  attempt_count: nextAttempt,
                  last_attempt_at: sql`now()`,
                  processed_at: sql`now()`,
                  updated_at: sql`now()`,
                  error_message: null,
                })
                .where(eq(payment_webhook_events.id, evt.id));
            });

            processedCount++;
          } catch (retryErr: any) {
            // Calculate exponential backoff (e.g. 30s * 2^(attempt-1))
            const backoffSeconds = Math.min(3600, 30 * Math.pow(2, nextAttempt - 1));
            const nextRetryDate = new Date(Date.now() + backoffSeconds * 1000);

            await db
              .update(payment_webhook_events)
              .set({
                processing_status: nextAttempt >= evt.max_attempts ? 'DEAD_LETTER' : 'RETRY',
                attempt_count: nextAttempt,
                last_attempt_at: sql`now()`,
                next_retry_at: nextRetryDate,
                updated_at: sql`now()`,
                error_message: retryErr?.message || 'Retry attempt failed',
              })
              .where(eq(payment_webhook_events.id, evt.id));

            if (nextAttempt >= evt.max_attempts) {
              deadLetteredCount++;
            }
          }
        }
      } finally {
        // Always release the advisory lock
        await db.execute(sql`SELECT pg_advisory_unlock(${this.ADVISORY_LOCK_ID});`);
      }
    } catch (sweepError) {
      console.error('[WebhookRetryWorker] Sweep error:', sweepError);
    } finally {
      this.isRunning = false;
    }

    return { processed: processedCount, deadLettered: deadLetteredCount };
  }
}
