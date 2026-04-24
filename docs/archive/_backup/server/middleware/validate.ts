import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from specified source
      const data = req[source];

      // Validate data against schema
      const validated = schema.parse(data);

      // Replace request data with validated data
      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        // Create detailed error message
        const message = errors.map(e => `${e.field}: ${e.message}`).join(', ');

        next(createError(
          message,
          400,
          'VALIDATION_ERROR',
          { errors },
          'The provided data is invalid. Please check your input and try again.'
        ));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validate URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

