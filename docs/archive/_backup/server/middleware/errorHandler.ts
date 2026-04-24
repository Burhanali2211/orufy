import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  userMessage?: string;
}

/**
 * Get user-friendly error message based on error code
 */
function getUserFriendlyMessage(code: string, originalMessage: string): string {
  const messages: Record<string, string> = {
    'VALIDATION_ERROR': originalMessage || 'The information provided is invalid. Please check your input and try again.',
    'UNAUTHORIZED': 'You need to be logged in to access this resource.',
    'FORBIDDEN': 'You do not have permission to access this resource.',
    'NOT_FOUND': 'The requested resource was not found.',
    'INSUFFICIENT_STOCK': 'The requested quantity is not available in stock.',
    'DUPLICATE_ENTRY': 'This item already exists in the system.',
    'DATABASE_ERROR': 'A database error occurred. Please try again later.',
    'PAYMENT_ERROR': 'Payment processing failed. Please check your payment details and try again.',
    'RATE_LIMIT_ERROR': 'Too many requests. Please wait a moment and try again.',
    'INTERNAL_ERROR': 'An unexpected error occurred. Our team has been notified.',
  };

  return messages[code] || originalMessage;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Detect CORS errors and handle them properly
  if (err.message?.includes('CORS') || err.message?.includes('Not allowed by CORS')) {
    return res.status(403).json({
      error: {
        status: 403,
        code: 'CORS_ERROR',
        message: 'CORS request rejected',
        originalMessage: err.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        hint: process.env.NODE_ENV === 'development' 
          ? 'Check CORS configuration. Ensure your origin is in the allowed list.'
          : 'CORS configuration issue. Contact administrator.'
      }
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';
  const userMessage = err.userMessage || getUserFriendlyMessage(code, message);

  // Log error with full details for debugging
  logger.error(`[${status}] ${code}: ${message}`, err, {
    context: 'API',
    data: {
      path: req.path,
      method: req.method,
      userId: (req as any).userId,
      details: err.details
    }
  });

  // Send appropriate response based on environment
  // For VALIDATION_ERROR, always show the original message (it's user-friendly)
  const shouldShowOriginalMessage = code === 'VALIDATION_ERROR' || process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    error: {
      status,
      code,
      message: shouldShowOriginalMessage ? message : userMessage,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // Include original message in development, or if it's a known error type
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.originalMessage = message;
  } else if (code !== 'INTERNAL_ERROR' && code !== 'VALIDATION_ERROR' && message !== userMessage) {
    // For non-generic errors (except VALIDATION_ERROR which already shows original), include the actual message even in production
    errorResponse.error.originalMessage = message;
  }

  // Include details in development mode, or for specific error types
  if (err.details) {
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.details = err.details;
    } else if (code === 'DATABASE_ERROR' || code === 'VALIDATION_ERROR') {
      // Include details for specific error types even in production
      errorResponse.error.details = err.details;
    }
  }

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // For INTERNAL_ERROR in production, include a hint about checking logs
  if (code === 'INTERNAL_ERROR' && process.env.NODE_ENV === 'production') {
    errorResponse.error.hint = 'Check server logs for detailed error information';
  }

  res.status(status).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom API error with enhanced details
 */
export function createError(
  message: string,
  status: number = 500,
  code: string = 'ERROR',
  details?: any,
  userMessage?: string
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  error.details = details;
  error.userMessage = userMessage;
  return error;
}

