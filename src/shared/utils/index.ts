// Utilities Barrel Exports - Cleaned & Streamlined

// Performance utilities
export * from './performance';
export * from './analytics';

// Authentication utilities
export * from './auth';

// Core utilities
export {
  detectRLSRecursionError,
  generateRLSFixSuggestion,
  handleDatabaseError
} from './errorHandling';
export { isValidUUID as validateUUID, generateUUID } from './uuidValidation';
export { withScrollToTop } from './withScrollToTop';
