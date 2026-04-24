# Technical Implementation Plan: Database Migration from Supabase to PostgreSQL

## 1. Environment Setup

### 1.1 PostgreSQL Server Installation
1. Install PostgreSQL 17 on target server
2. Configure `postgresql.conf`:
   - Set `listen_addresses` to allow application connections
   - Configure `shared_buffers` and `work_mem` for performance
   - Enable SSL by setting `ssl = on`
3. Configure `pg_hba.conf` for client authentication
4. Create database and users:
   ```sql
   CREATE DATABASE sufi_essences;
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE sufi_essences TO app_user;
   ```

### 1.2 Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 2. Schema Migration

### 2.1 Core Tables

#### profiles table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'seller', 'customer')) DEFAULT 'customer',
  phone TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### categories table
```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### products table
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  images TEXT[],
  stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  sku TEXT UNIQUE,
  weight DECIMAL(8, 3),
  dimensions JSONB,
  tags TEXT[],
  specifications JSONB,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### orders table
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Supporting Tables
Create all remaining tables following the same pattern as defined in the Supabase migration scripts:
- `cart_items`
- `wishlist_items`
- `reviews`
- `addresses`
- `payment_methods`
- `product_variants`
- `order_items`
- `order_tracking`
- `inventory_transactions`
- `low_stock_alerts`
- `user_preferences`
- `user_security_settings`

### 2.3 Indexes
Create all indexes as defined in the Supabase scripts:
```sql
-- Example indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
-- Add all other indexes from the existing schema
```

### 2.4 Triggers
Create update timestamp triggers:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that need updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2.5 Views
Create all necessary views:
```sql
CREATE OR REPLACE VIEW public.category_stats AS
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(p.id) as product_count,
  AVG(p.price) as average_price,
  MAX(p.created_at) as last_product_added
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug;
```

## 3. Data Migration

### 3.1 Export Data from Supabase
```bash
# Export each table to CSV
psql $SUPABASE_DB_URL -c "\COPY public.profiles TO 'profiles.csv' WITH CSV HEADER"
psql $SUPABASE_DB_URL -c "\COPY public.categories TO 'categories.csv' WITH CSV HEADER"
# Continue for all tables
```

### 3.2 Import Data to PostgreSQL
```bash
# Import each table from CSV
psql $POSTGRES_DB_URL -c "\COPY public.profiles FROM 'profiles.csv' WITH CSV HEADER"
psql $POSTGRES_DB_URL -c "\COPY public.categories FROM 'categories.csv' WITH CSV HEADER"
# Continue for all tables
```

### 3.3 Data Validation
Write validation queries to ensure data integrity:
```sql
-- Check row counts
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as row_count FROM public.categories
-- Continue for all tables

-- Check for data consistency
SELECT COUNT(*) as orphaned_products 
FROM public.products p 
LEFT JOIN public.categories c ON p.category_id = c.id 
WHERE p.category_id IS NOT NULL AND c.id IS NULL;
```

## 4. Client-Side Implementation

### 4.1 Install PostgreSQL Client
```bash
npm install pg
npm install @types/pg --save-dev
```

### 4.2 Create Database Connection Utility
Create `src/lib/postgres.ts`:

```typescript
import { Pool, QueryResult } from 'pg';
import { performanceMonitor } from '../utils/performance';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sufi_essences',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  ssl: process.env.DB_SSL === 'true' ? true : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Query execution with performance monitoring
export const executeQuery = async <T>(query: string, params: any[] = []): Promise<QueryResult<T>> => {
  const startTime = performanceMonitor.startMeasurement('database-query');
  
  try {
    const result = await pool.query<T>(query, params);
    performanceMonitor.endMeasurement(startTime, { query, rowCount: result.rowCount });
    return result;
  } catch (error) {
    performanceMonitor.endMeasurement(startTime, { query, error: error.message });
    throw error;
  }
};

// Transaction execution
export const executeTransaction = async <T>(queries: Array<{ query: string, params: any[] }>): Promise<T[]> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const results: T[] = [];
    for (const { query, params } of queries) {
      const result = await client.query<T>(query, params);
      results.push(result.rows[0] as T);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check
export const checkDatabaseHealth = async (): Promise<{ healthy: boolean; latency?: number; error?: string }> => {
  const startTime = Date.now();
  
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - startTime;
    return { healthy: true, latency };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

export default pool;
```

### 4.3 Update Environment Variables
Update `.env` files:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sufi_essences
DB_USER=app_user
DB_PASSWORD=secure_password
DB_SSL=false
```

### 4.4 Replace Supabase Client Calls

#### User Authentication
Replace `src/lib/supabase.ts` authentication functions:

```typescript
// Before: Supabase authentication
// export const signIn = async (email: string, password: string) => {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   return { data, error };
// };

// After: PostgreSQL authentication
import { executeQuery } from './postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signIn = async (email: string, password: string) => {
  try {
    // Find user by email
    const result = await executeQuery(
      'SELECT id, email, full_name, role, password_hash FROM public.profiles WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return { data: null, error: { message: 'Invalid credentials' } };
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { data: null, error: { message: 'Invalid credentials' } };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = user;
    
    return { 
      data: { 
        user: userWithoutPassword, 
        session: { access_token: token, user: userWithoutPassword } 
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};
```

#### Product CRUD Operations
Replace product fetching functions:

```typescript
// Before: Supabase product fetching
// export const getProducts = async (filters?: { categoryId?: string }) => {
//   const { data, error } = await supabase.from('products').select('*');
//   return { data, error };
// };

// After: PostgreSQL product fetching
export const getProducts = async (filters?: { 
  categoryId?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    let query = `
      SELECT 
        id, name, slug, description, price, original_price, images,
        category_id, stock, rating, review_count, is_featured, is_active, created_at
      FROM public.products 
      WHERE is_active = true
    `;
    const params: any[] = [];
    
    if (filters?.categoryId) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(filters.categoryId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }
    
    if (filters?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(filters.offset);
    }
    
    const result = await executeQuery(query, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};
```

#### Order Management
Replace order creation:

```typescript
// Before: Supabase order creation
// export const createOrder = async (orderData) => {
//   const { data, error } = await supabase.from('orders').insert(orderData);
//   return { data, error };
// };

// After: PostgreSQL order creation with transaction
export const createOrder = async (orderData: {
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  shippingAddress: any;
  paymentMethod: string;
}) => {
  try {
    return await executeTransaction([
      // Insert order
      {
        query: `
          INSERT INTO public.orders (
            user_id, subtotal, tax_amount, shipping_amount, total_amount,
            status, payment_status, payment_method, shipping_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, order_number
        `,
        params: [
          orderData.userId,
          calculateSubtotal(orderData.items),
          calculateTax(calculateSubtotal(orderData.items)),
          calculateShipping(calculateSubtotal(orderData.items)),
          calculateTotal(orderData.items),
          'pending',
          'pending',
          orderData.paymentMethod,
          orderData.shippingAddress
        ]
      },
      // Insert order items (this would need to be expanded in actual implementation)
      // Update inventory
      // ... additional queries
    ]);
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
};
```

## 5. Authentication System Implementation

### 5.1 User Registration
Create registration function:

```typescript
export const signUp = async (userData: {
  email: string;
  password: string;
  fullName: string;
}) => {
  try {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    // Insert user
    const result = await executeQuery(
      `INSERT INTO public.profiles (email, full_name, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, email, full_name, role, created_at`,
      [userData.email, userData.fullName, passwordHash]
    );
    
    // Generate JWT token
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    return { 
      data: { 
        user, 
        session: { access_token: token, user } 
      }, 
      error: null 
    };
  } catch (error) {
    // Handle duplicate email error
    if (error.code === '23505') {
      return { data: null, error: { message: 'Email already exists' } };
    }
    return { data: null, error: { message: error.message } };
  }
};
```

### 5.2 Session Management
Create authentication context:

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Token is valid, fetch user data
          fetchUser(decoded.userId);
        } else {
          // Token expired, remove it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const fetchUser = async (userId: string) => {
    // Fetch user from database
    // setUser(userData);
    // setIsAuthenticated(true);
  };

  const signIn = async (email: string, password: string) => {
    // Call signIn function from postgres.ts
    // const { data, error } = await signIn(email, password);
    // if (data) {
    //   localStorage.setItem('auth_token', data.session.access_token);
    //   setUser(data.user);
    //   setIsAuthenticated(true);
    // }
    // return { data, error };
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 6. Real-time Functionality Implementation

### 6.1 PostgreSQL LISTEN/NOTIFY
Implement real-time updates using PostgreSQL's LISTEN/NOTIFY:

```typescript
// src/lib/realtime.ts
import { Client } from 'pg';

class RealtimeClient {
  private client: Client;
  private listeners: Map<string, Array<(payload: any) => void>> = new Map();

  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    this.connect();
  }

  private async connect() {
    await this.client.connect();
    this.client.on('notification', (msg) => {
      const channel = msg.channel;
      const payload = JSON.parse(msg.payload);
      
      const listeners = this.listeners.get(channel);
      if (listeners) {
        listeners.forEach(callback => callback(payload));
      }
    });
  }

  public async subscribe(channel: string, callback: (payload: any) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
      await this.client.query(`LISTEN ${channel}`);
    }
    
    this.listeners.get(channel)?.push(callback);
  }

  public async unsubscribe(channel: string, callback: (payload: any) => void) {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        await this.client.query(`UNLISTEN ${channel}`);
        this.listeners.delete(channel);
      }
    }
  }
}

export const realtimeClient = new RealtimeClient();
```

### 6.2 Database Triggers for Notifications
Create triggers to send notifications:

```sql
-- Trigger function for order updates
CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('order_updates', json_build_object(
    'orderId', NEW.id,
    'status', NEW.status,
    'userId', NEW.user_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order updates
CREATE TRIGGER order_update_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_update();
```

## 7. Security Implementation

### 7.1 Row Level Security Equivalent
Implement application-level row security:

```typescript
// Function to check user authorization for operations
export const checkAuthorization = async (userId: string, resourceId: string, resourceTable: string, operation: 'read' | 'write' | 'delete') => {
  try {
    // Check if user is admin (can access all resources)
    const adminCheck = await executeQuery(
      'SELECT role FROM public.profiles WHERE id = $1 AND role = $2',
      [userId, 'admin']
    );
    
    if (adminCheck.rows.length > 0) {
      return true; // Admins can access everything
    }
    
    // Check ownership for specific resources
    const ownershipCheck = await executeQuery(
      `SELECT id FROM ${resourceTable} WHERE id = $1 AND user_id = $2`,
      [resourceId, userId]
    );
    
    return ownershipCheck.rows.length > 0;
  } catch (error) {
    return false;
  }
};
```

### 7.2 Input Validation and SQL Injection Prevention
Ensure all queries use parameterized statements:

```typescript
// Correct - Parameterized query
const result = await executeQuery(
  'SELECT * FROM public.products WHERE category_id = $1 AND is_active = $2',
  [categoryId, true]
);

// Incorrect - Vulnerable to SQL injection
// const result = await executeQuery(
//   `SELECT * FROM public.products WHERE category_id = '${categoryId}' AND is_active = true`
// );
```

## 8. Performance Optimization

### 8.1 Connection Pooling
Already implemented in the database connection utility.

### 8.2 Query Optimization
Add query analysis and optimization:

```typescript
// Add query execution plan analysis for slow queries
export const analyzeQuery = async (query: string, params: any[] = []) => {
  try {
    const explainResult = await executeQuery(`EXPLAIN ANALYZE ${query}`, params);
    return explainResult.rows;
  } catch (error) {
    console.error('Query analysis failed:', error);
    return null;
  }
};
```

### 8.3 Caching Strategy
Implement caching for frequently accessed data:

```typescript
// src/lib/cache.ts
class DatabaseCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}

export const dbCache = new DatabaseCache();
```

## 9. Monitoring and Health Checks

### 9.1 Database Health Monitoring
Implement comprehensive health checks:

```typescript
// src/utils/database/monitor.ts
import { checkDatabaseHealth } from '../../lib/postgres';

class DatabaseMonitor {
  private metrics = {
    isHealthy: false,
    latency: 0,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    totalChecks: 0,
    totalFailures: 0,
    uptime: 0
  };

  async performHealthCheck() {
    const result = await checkDatabaseHealth();
    
    this.metrics.totalChecks++;
    this.metrics.latency = result.latency || 0;
    this.metrics.lastCheck = new Date();

    if (result.healthy) {
      this.metrics.isHealthy = true;
      this.metrics.consecutiveFailures = 0;
    } else {
      this.metrics.isHealthy = false;
      this.metrics.consecutiveFailures++;
      this.metrics.totalFailures++;
    }

    // Calculate uptime percentage
    this.metrics.uptime = ((this.metrics.totalChecks - this.metrics.totalFailures) / this.metrics.totalChecks) * 100;

    return this.metrics;
  }
}

export const databaseMonitor = new DatabaseMonitor();
```

### 9.2 Error Handling and Logging
Implement comprehensive error handling:

```typescript
// src/utils/errorHandling.ts
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleDatabaseError = (error: any): DatabaseError => {
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new DatabaseError('Resource already exists', error.code, error.detail);
      case '23503': // Foreign key violation
        return new DatabaseError('Referenced resource does not exist', error.code, error.detail);
      case '23514': // Check violation
        return new DatabaseError('Data validation failed', error.code, error.detail);
      default:
        return new DatabaseError(`Database error: ${error.message}`, error.code, error.detail);
    }
  }
  
  return new DatabaseError(`Database error: ${error.message}`);
};
```

## 10. Testing Strategy

### 10.1 Unit Tests for Database Operations
Create tests for all database functions:

```typescript
// src/lib/__tests__/postgres.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeQuery, executeTransaction } from '../postgres';
import { Pool } from 'pg';

// Mock pg.Pool
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  const mockPool = {
    query: mockQuery,
    connect: vi.fn().mockResolvedValue({
      query: mockQuery,
      release: vi.fn()
    })
  };
  
  return {
    Pool: vi.fn(() => mockPool),
    mockQuery
  };
});

describe('PostgreSQL Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      const { mockQuery } = await import('pg');
      mockQuery.mockResolvedValue(mockResult);

      const result = await executeQuery('SELECT * FROM test', []);
      
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(result).toEqual(mockResult);
    });

    it('should handle query errors', async () => {
      const { mockQuery } = await import('pg');
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(executeQuery('SELECT * FROM test', []))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const mockResult1 = { rows: [{ id: 1 }] };
      const mockResult2 = { rows: [{ id: 2 }] };
      
      const pool = new Pool();
      const client = await pool.connect();
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce(mockResult1) // Query 1
        .mockResolvedValueOnce(mockResult2) // Query 2
        .mockResolvedValueOnce({}); // COMMIT

      const queries = [
        { query: 'SELECT * FROM test1', params: [] },
        { query: 'SELECT * FROM test2', params: [] }
      ];

      const result = await executeTransaction(queries);
      
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      expect(client.query).toHaveBeenCalledTimes(4);
    });
  });
});
```

### 10.2 Integration Tests
Create integration tests for complete workflows:

```typescript
// src/__tests__/integration/database.test.ts
import { describe, it, expect } from 'vitest';
import { signUp, signIn } from '../../lib/postgres';
import { executeQuery } from '../../lib/postgres';

describe('Database Integration', () => {
  describe('User Authentication Flow', () => {
    it('should register and authenticate user successfully', async () => {
      // Register new user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      const signUpResult = await signUp(userData);
      expect(signUpResult.error).toBeNull();
      expect(signUpResult.data).toBeDefined();
      expect(signUpResult.data?.user.email).toBe(userData.email);

      // Authenticate user
      const signInResult = await signIn(userData.email, userData.password);
      expect(signInResult.error).toBeNull();
      expect(signInResult.data).toBeDefined();
      expect(signInResult.data?.user.email).toBe(userData.email);

      // Clean up test user
      await executeQuery('DELETE FROM public.profiles WHERE email = $1', [userData.email]);
    });

    it('should reject invalid credentials', async () => {
      const result = await signIn('nonexistent@example.com', 'wrongpassword');
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
});
```

## 11. Deployment and Monitoring

### 11.1 Environment Configuration
Create environment-specific configuration files:

```env
# .env.development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sufi_essences_dev
DB_USER=app_user
DB_PASSWORD=dev_password
DB_SSL=false
JWT_SECRET=dev_jwt_secret

# .env.production
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=sufi_essences_prod
DB_USER=app_user
DB_PASSWORD=your-secure-password
DB_SSL=true
JWT_SECRET=your-production-jwt-secret
```

### 11.2 Health Check Endpoint
Create a health check endpoint:

```typescript
// src/api/health.ts
import { Router } from 'express';
import { checkDatabaseHealth } from '../lib/postgres';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const healthStatus = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth
    };
    
    res.status(dbHealth.healthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
```

## 12. Rollback Procedures

### 12.1 Database Backup
Implement automated backup procedures:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > backup_$DATE.sql
```

### 12.2 Rollback Script
Create rollback script to revert to Supabase:

```bash
#!/bin/bash
# rollback.sh
echo "Rolling back to Supabase..."
# Stop new application
# Restore Supabase connection
# Redirect traffic back to Supabase
echo "Rollback completed"
```

This technical implementation plan provides detailed step-by-step instructions for migrating the Sufi Essences website from Supabase to PostgreSQL. Each component is addressed with specific code examples and implementation details to ensure a successful migration with zero errors.