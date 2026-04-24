/**
 * Production-ready logging utility
 * Provides structured logging with different levels
 * Automatically disabled in production for sensitive operations
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogOptions {
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    const levelUpper = level.toUpperCase().padEnd(7);
    return `${timestamp} ${levelUpper} ${context} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  info(message: string, options?: LogOptions): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, options));
      if (options?.data && this.isDevelopment) {
        console.log('  Data:', options.data);
      }
    }
  }

  success(message: string, options?: LogOptions): void {
    if (this.shouldLog('success')) {
      console.log('✅', this.formatMessage('success', message, options));
      if (options?.data && this.isDevelopment) {
        console.log('  Data:', options.data);
      }
    }
  }

  warn(message: string, options?: LogOptions): void {
    if (this.shouldLog('warn')) {
      console.warn('⚠️ ', this.formatMessage('warn', message, options));
      if (options?.data) {
        console.warn('  Data:', options.data);
      }
    }
  }

  error(message: string, error?: Error | any, options?: LogOptions): void {
    if (this.shouldLog('error')) {
      console.error('❌', this.formatMessage('error', message, options));
      if (error) {
        if (error instanceof Error) {
          console.error('  Error:', error.message);
          if (this.isDevelopment && error.stack) {
            console.error('  Stack:', error.stack);
          }
        } else {
          console.error('  Error:', error);
        }
      }
      if (options?.data) {
        console.error('  Data:', options.data);
      }
    }
  }

  debug(message: string, options?: LogOptions): void {
    if (this.isDevelopment && this.shouldLog('debug')) {
      console.debug('🔍', this.formatMessage('debug', message, options));
      if (options?.data) {
        console.debug('  Data:', options.data);
      }
    }
  }

  // Database query logging
  query(text: string, duration?: number): void {
    if (this.isDevelopment) {
      const msg = duration 
        ? `Query executed in ${duration}ms: ${text.substring(0, 100)}`
        : `Query: ${text.substring(0, 100)}`;
      this.debug(msg, { context: 'Database' });
    }
  }

  // HTTP request logging
  request(method: string, path: string, status?: number, duration?: number): void {
    if (this.shouldLog('info')) {
      const statusEmoji = status && status >= 400 ? '❌' : status && status >= 300 ? '⚠️' : '✅';
      const msg = status 
        ? `${statusEmoji} ${method} ${path} [${status}] ${duration}ms`
        : `→ ${method} ${path}`;
      this.info(msg, { context: 'HTTP' });
    }
  }

  // Payment logging (sanitized)
  payment(message: string, orderId?: string, amount?: number): void {
    this.info(message, {
      context: 'Payment',
      data: this.isProduction ? { orderId } : { orderId, amount }
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export default logger;

