// Comprehensive validation utilities for user management

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface UserValidationData {
  email: string;
  name: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
}

// Email validation with comprehensive checks
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Length validation
  if (email.length > 254) {
    errors.push('Email address is too long (maximum 254 characters)');
  }

  // Local part validation (before @)
  const localPart = email.split('@')[0];
  if (localPart && localPart.length > 64) {
    errors.push('Email local part is too long (maximum 64 characters)');
  }

  // Domain validation
  const domain = email.split('@')[1];
  if (domain) {
    if (domain.length > 253) {
      errors.push('Email domain is too long (maximum 253 characters)');
    }
    
    // Check for valid domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      errors.push('Email domain format is invalid');
    }
  }

  // Common typo detection
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const typoSuggestions: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com'
  };

  if (domain && typoSuggestions[domain.toLowerCase()]) {
    warnings.push(`Did you mean ${typoSuggestions[domain.toLowerCase()]}?`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name) {
    errors.push('Name is required');
    return { isValid: false, errors, warnings };
  }

  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (name.length > 100) {
    errors.push('Name is too long (maximum 100 characters)');
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  if (!nameRegex.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Check for excessive spaces or special characters
  if (name.includes('  ')) {
    warnings.push('Name contains multiple consecutive spaces');
  }

  if (name.startsWith(' ') || name.endsWith(' ')) {
    warnings.push('Name has leading or trailing spaces');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Phone validation
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!phone) {
    return { isValid: true, errors, warnings }; // Phone is optional
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }

  if (digitsOnly.length > 15) {
    errors.push('Phone number is too long (maximum 15 digits)');
  }

  // Check for valid phone format (international or local)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(digitsOnly)) {
    errors.push('Please enter a valid phone number');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Role validation
export const validateRole = (role: string): ValidationResult => {
  const errors: string[] = [];
  const validRoles = ['admin', 'seller', 'customer'];

  if (!role) {
    errors.push('Role is required');
    return { isValid: false, errors };
  }

  if (!validRoles.includes(role.toLowerCase())) {
    errors.push('Invalid role. Must be admin, seller, or customer');
  }

  return { isValid: errors.length === 0, errors };
};

// Date of birth validation
export const validateDateOfBirth = (dateOfBirth: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateOfBirth) {
    return { isValid: true, errors, warnings }; // DOB is optional
  }

  const date = new Date(dateOfBirth);
  const now = new Date();

  if (isNaN(date.getTime())) {
    errors.push('Please enter a valid date');
    return { isValid: false, errors, warnings };
  }

  // Check if date is in the future
  if (date > now) {
    errors.push('Date of birth cannot be in the future');
  }

  // Check if person is too old (over 120 years)
  const maxAge = new Date();
  maxAge.setFullYear(maxAge.getFullYear() - 120);
  if (date < maxAge) {
    errors.push('Date of birth seems unrealistic (over 120 years ago)');
  }

  // Check if person is too young (under 13 years for COPPA compliance)
  const minAge = new Date();
  minAge.setFullYear(minAge.getFullYear() - 13);
  if (date > minAge) {
    warnings.push('User appears to be under 13 years old. Additional parental consent may be required.');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Comprehensive user validation
export const validateUser = (userData: UserValidationData): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate each field
  const emailResult = validateEmail(userData.email);
  const nameResult = validateName(userData.name);
  const roleResult = validateRole(userData.role);
  const phoneResult = validatePhone(userData.phone || '');
  const dobResult = validateDateOfBirth(userData.dateOfBirth || '');

  // Collect all errors and warnings
  allErrors.push(...emailResult.errors);
  allErrors.push(...nameResult.errors);
  allErrors.push(...roleResult.errors);
  allErrors.push(...phoneResult.errors);
  allErrors.push(...dobResult.errors);

  allWarnings.push(...(emailResult.warnings || []));
  allWarnings.push(...(nameResult.warnings || []));
  allWarnings.push(...(phoneResult.warnings || []));
  allWarnings.push(...(dobResult.warnings || []));

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

// Password strength validation
export const validatePasswordStrength = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password is too long (maximum 128 characters)');
  }

  // Check for character variety
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLowercase) {
    warnings.push('Password should include lowercase letters');
  }

  if (!hasUppercase) {
    warnings.push('Password should include uppercase letters');
  }

  if (!hasNumbers) {
    warnings.push('Password should include numbers');
  }

  if (!hasSpecialChars) {
    warnings.push('Password should include special characters');
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      warnings.push('Password contains common patterns that are easy to guess');
      break;
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Rate limiting helper
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const userRequests = requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);

    return true;
  };
};

// Create rate limiters for different operations
export const userCreationLimiter = createRateLimiter(5, 60000); // 5 requests per minute
export const emailSendLimiter = createRateLimiter(3, 300000); // 3 emails per 5 minutes
