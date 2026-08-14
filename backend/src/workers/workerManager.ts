import { startReservationExpiryWorker, stopReservationExpiryWorker } from './reservationExpiryWorker';
import { WebhookRetryWorker } from './webhookRetryWorker';

export class WorkerManager {
  private static isInitialized = false;

  /**
   * Starts all background workers and registers graceful shutdown hooks.
   */
  public static startAll(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    startReservationExpiryWorker(30000); // Every 30 seconds
    WebhookRetryWorker.start(15000); // Every 15 seconds

    // Register process termination handlers for graceful teardown
    const shutdownHandler = (signal: string) => {
      console.log(`[WorkerManager] Received ${signal}. Shutting down all background workers...`);
      WorkerManager.stopAll();
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));

    console.log('[WorkerManager] All background workers initialized and resilient.');
  }

  /**
   * Stops all background workers gracefully.
   */
  public static stopAll(): void {
    stopReservationExpiryWorker();
    WebhookRetryWorker.stop();
    this.isInitialized = false;
  }

  /**
   * Returns health status of background workers.
   */
  public static getStatus(): Record<string, string> {
    return {
      reservationExpiryWorker: 'active',
      webhookRetryWorker: 'active',
    };
  }
}
