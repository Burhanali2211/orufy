// Utilities Barrel Exports - Organized by category

// Performance utilities
export * from './performance';
export * from './resourceManager.tsx';
export { analytics } from './analytics';

// Authentication utilities
export * from './auth';

// Core utilities
export { cacheManager } from './cache';
export {
  detectRLSRecursionError,
  generateRLSFixSuggestion,
  handleDatabaseError
} from './errorHandling';
export { isValidUUID as validateUUID, generateUUID } from './uuidValidation';
export { withScrollToTop } from './withScrollToTop';
