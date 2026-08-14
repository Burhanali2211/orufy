/**
 * Base DataService class
 * Provides common functionality for services
 */
export class DataService {
  protected static serviceName = 'DataService';

  /**
   * Get the current authenticated user
   * Override in subclasses if needed
   */
  protected static async getCurrentUser(): Promise<{ id: string } | null> {
    return null;
  }

  /**
   * Get request identifier for rate limiting
   * Override in subclasses if needed
   */
  protected static getRequestIp(): string {
    // In browser environment, use a random identifier
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Log method for debugging
   */
  protected static log(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      console.log(`[${this.serviceName}] ${message}`, ...args);
    }
  }

  /**
   * Error log method
   */
  protected static logError(message: string, error: any) {
    console.error(`[${this.serviceName}] ${message}`, error);
  }
}

export default DataService;
