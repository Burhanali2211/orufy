// Error types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Custom error class
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

// Database error class
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown, originalError?: Error) {
    super(ErrorCode.DATABASE_ERROR, message, details, originalError);
    this.name = 'DatabaseError';
  }
}

// Network error class
export class NetworkError extends AppError {
  constructor(message: string, details?: unknown, originalError?: Error) {
    super(ErrorCode.NETWORK_ERROR, message, details, originalError);
    this.name = 'NetworkError';
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.AUTHENTICATION_ERROR, message, details);
    this.name = 'AuthenticationError';
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.AUTHORIZATION_ERROR, message, details);
    this.name = 'AuthorizationError';
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.NOT_FOUND_ERROR, message, details);
    this.name = 'NotFoundError';
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: unknown): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    const err = error as Error & { details?: unknown; name?: string; message?: string };

    // Handle different types of errors
    if (err.name === 'ValidationError') {
      return new ValidationError(err.message || 'Validation Error', err.details);
    }

    if (err.name === 'DatabaseError' || err.name === 'PostgrestError') {
      return new DatabaseError(err.message || 'Database Error', err.details, error instanceof Error ? error : undefined);
    }

    if (err.name === 'NetworkError' || err.name === 'FetchError') {
      return new NetworkError(err.message || 'Network Error', err.details, error instanceof Error ? error : undefined);
    }

    if (err.name === 'AuthError') {
      return new AuthenticationError(err.message || 'Authentication Error', err.details);
    }

    // Default to internal error
    return new AppError(ErrorCode.INTERNAL_ERROR, err.message || 'An unexpected error occurred', undefined, error instanceof Error ? error : undefined);
  }

  static formatError(error: AppError): { success: false; error: { code: string; message: string; details?: unknown } } {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }
}

// Validation utilities
export class Validation {
  // Validate required fields
  static required(data: Record<string, unknown>, fields: string[]): void {
    const missing = fields.filter(field => {
      const value = this.getNestedValue(data, field);
      return value === undefined || value === null || value === '';
    });
    
    if (missing.length > 0) {
      throw new ValidationError(`Required fields missing: ${missing.join(', ')}`, { missingFields: missing });
    }
  }

  // Validate email format
  static email(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', { email });
    }
  }

  // Validate that a value is a positive number
  static positiveNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`, { fieldName, value });
    }
  }

  // Validate that a value is a non-negative number
  static nonNegativeNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value < 0) {
      throw new ValidationError(`${fieldName} must be a non-negative number`, { fieldName, value });
    }
  }

  // Validate string length
  static stringLength(value: string, fieldName: string, min?: number, max?: number): void {
    if (min !== undefined && value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`, { fieldName, value, min });
    }
    
    if (max !== undefined && value.length > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max} characters long`, { fieldName, value, max });
    }
  }

  // Validate URL format
  static url(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new ValidationError('Invalid URL format', { url });
    }
  }

  // Validate array minimum length
  static arrayMinLength(array: unknown[], fieldName: string, minLength: number): void {
    if (!Array.isArray(array) || array.length < minLength) {
      throw new ValidationError(`${fieldName} must have at least ${minLength} items`, { fieldName, arrayLength: array?.length, minLength });
    }
  }

  // Validate enum value
  static enumValue(value: string, fieldName: string, validValues: string[]): void {
    if (!validValues.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${validValues.join(', ')}`, { fieldName, value, validValues });
    }
  }

  // Helper to get nested value from object
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

// Retry utility for network operations
export class Retry {
  static async withBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    throw lastError;
  }
}

/**
 * Detect if an error is caused by RLS infinite recursion
 * @param error The error to check
 * @returns boolean indicating if this is an RLS recursion error
 */
export function detectRLSRecursionError(error: Error): boolean {
  if (!error || !error.message) return false;
  
  const rlsRecursionIndicators = [
    'infinite recursion',
    'recursive reference',
    'row-level security policy',
    'rls recursion',
    'policy recursion'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return rlsRecursionIndicators.some(indicator => errorMessage.includes(indicator));
}

/**
 * Generate a fix suggestion for RLS recursion errors
 * @param error The error to analyze
 * @returns A string with fix suggestions
 */
export function generateRLSFixSuggestion(error: Error): string {
  if (!detectRLSRecursionError(error)) {
    return 'Run the rls_policies_fix.sql script in your Supabase SQL Editor to fix Row Level Security policies.';
  }
  
  return `RLS Infinite Recursion Detected:
1. Run the rls_policies_fix.sql script in your Supabase SQL Editor
2. This script replaces problematic policies with safe alternatives
3. The fix includes role caching to prevent future recursion issues
4. After running the script, refresh this page`;
}

/**
 * Handle database errors with appropriate user-friendly messages
 * @param error The database error
 * @returns A user-friendly error message
 */
export function handleDatabaseError(error: Error): string {
  if (detectRLSRecursionError(error)) {
    return 'Database security policy error detected. Please run the RLS fix script.';
  }
  
  if (error.message.includes('connection') || error.message.includes('network')) {
    return 'Database connection error. Please check your network connection and try again.';
  }
  
  if (error.message.includes('row-level security') || error.message.includes('policy')) {
    return 'Database security policy error. Please contact support or run the RLS fix script.';
  }
  
  return 'A database error occurred. Please try again or contact support if the issue persists.';
}
