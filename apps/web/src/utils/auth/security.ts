// Security utilities for input sanitization and validation

// HTML sanitization (basic implementation)
export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// SQL injection prevention for search queries
export function sanitizeSearchQuery(input: string): string {
  if (!input) return '';
  
  // Remove potential SQL injection patterns
  const dangerous = [
    /('|(\\x27)|(\\x22))/i, // quotes
    /(-{2,})/i, // SQL comments
    /(;|\\x3b)/i, // semicolons
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i, // SQL keywords
    /(<|>|&|\\x3c|\\x3e)/i, // HTML/XML tags
    /(javascript|vbscript|onload|onerror|onclick)/i, // Script injection
  ];
  
  let sanitized = input.trim();
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.substring(0, 100); // Limit length
}

// XSS prevention
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone number validation
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

// Credit card validation (basic Luhn algorithm)
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}

// CVV validation
export function isValidCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    suggestions.push('Use at least 8 characters');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('Include lowercase letters');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Include uppercase letters');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    suggestions.push('Include numbers');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    suggestions.push('Include special characters');
  } else {
    score += 1;
  }
  
  return {
    isValid: score >= 3,
    score,
    suggestions
  };
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Content Security Policy helpers
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export const rateLimiter = new RateLimiter();

export class SecurityManager {
  private static instance: SecurityManager;
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private lockedAccounts: Map<string, number> = new Map();

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  recordLoginAttempt(email: string, success: boolean): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };

    if (success) {
      this.loginAttempts.delete(email);
      this.lockedAccounts.delete(email);
      return true;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(email, attempts);

    // Lock account after 5 failed attempts
    if (attempts.count >= 5) {
      this.lockedAccounts.set(email, now + (15 * 60 * 1000)); // 15 minutes
      return false;
    }

    return true;
  }

  isAccountLocked(email: string): boolean {
    const lockUntil = this.lockedAccounts.get(email);
    if (!lockUntil) return false;

    if (Date.now() > lockUntil) {
      this.lockedAccounts.delete(email);
      return false;
    }

    return true;
  }

  getLockoutTimeRemaining(email: string): number {
    const lockUntil = this.lockedAccounts.get(email);
    if (!lockUntil) return 0;
    return Math.max(0, lockUntil - Date.now());
  }

  getLoginAttempts(email: string): number {
    const attempts = this.loginAttempts.get(email);
    return attempts ? attempts.count : 0;
  }

  resetAttempts(email: string): void {
    this.loginAttempts.delete(email);
    this.lockedAccounts.delete(email);
  }
}

// Password validation utilities
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('One number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }

  return { isValid: errors.length === 0, errors };
};

export const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  const validation = validatePassword(password);
  const strength = Math.max(0, 5 - validation.errors.length);

  if (strength === 0) return { strength: 0, label: 'Very Weak', color: 'bg-red-500' };
  if (strength <= 2) return { strength: strength * 20, label: 'Weak', color: 'bg-orange-500' };
  if (strength <= 3) return { strength: strength * 20, label: 'Fair', color: 'bg-yellow-500' };
  if (strength <= 4) return { strength: strength * 20, label: 'Good', color: 'bg-blue-500' };
  return { strength: 100, label: 'Strong', color: 'bg-green-500' };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Session security
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// CSRF protection
export const generateCSRFToken = (): string => {
  return generateSecureToken();
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length === 64;
};
