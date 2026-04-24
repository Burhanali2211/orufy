# Archived Code - Original Architecture Migration Back

**Date Archived**: January 30, 2026
**Migration Reason**: Migration from Express + PostgreSQL to pure Supabase architecture
**Migration Phase**: Phase 1 of 5

## What Was Archived

### 1. `/server/` Directory
Complete Express.js backend server with the following structure:
- **Main Application**: `server/index.ts` - Full Express server with middleware
- **Database Layer**: `server/db/connection.ts` - PostgreSQL connection pool
- **API Routes**: All route handlers in `/server/routes/`:
  - `products.ts` - Product CRUD operations
  - `categories.ts` - Category management
  - `cart.ts` - Shopping cart operations
  - `wishlist.ts` - Wishlist management
  - `addresses.ts` - Address management
  - `orders.ts` - Order processing
  - `auth.ts` - Authentication endpoints
  - `contact.ts` - Contact form handling
  - `health.ts` - Health check endpoint
  - `public/` - Public routes (sitemap, etc.)
  - `seller/` - Seller-specific routes
  - `admin/` - Admin routes (analytics, users, orders, settings, POS, inventory)
  - `payment-methods.ts` - Payment method management
  - `notifications.ts` - Notification system
  - `shipping.ts` - Shipping operations
  - `razorpay.ts` - Razorpay payment integration
  - `upload.ts` - File upload handling
- **Middleware**: Performance monitoring, rate limiting, etc.
- **Services**: Email, shipping, sitemap, WhatsApp
- **Scripts**: Database initialization, seeding, migrations
- **Validators**: Request validation schemas
- **Utils**: Authentication, caching (Redis + hybrid), logging, serverless helpers

### 2. `/api/` Directory
Vercel serverless functions:
- `api/index.ts` - Wrapper for Express app (Vercel entry point)
- `api/products.ts` - Standalone product API (conflicted with vercel.json routing)

## Why This Was Archived

The original architecture had critical issues:
1. **Dual API System Conflict**: Express routes (`/server/routes/`) and Vercel functions (`/api/`) created confusion
2. **Inefficient Serverless Implementation**: Express designed for long-running connections but wrapped in stateless Vercel functions
3. **Vercel Configuration Conflicts**: `vercel.json` routed all `/api/*` to `/api/index.ts` but standalone `api/products.ts` existed
4. **Underutilized Supabase Client**: Frontend had comprehensive Supabase client (`src/lib/supabase.ts`) but used HTTP API instead

## Migration Details

**New Architecture**: Pure Supabase client architecture
- Frontend calls Supabase client directly for all database operations
- Supabase Edge Functions for sensitive operations (payment webhooks, admin functions)
- Complete removal of Express server layer
- Built-in authentication, caching, and storage via Supabase

**Database**: PostgreSQL database with all tables and Row Level Security (RLS) policies already configured in Supabase. Migration preserves all data.

## How to Restore (If Needed)

If you need to revert to the original Express architecture:

1. **Move archives back**:
   ```bash
   move _backup\server server
   move _backup\api api
   ```

2. **Restore dependencies**:
   - Express-related packages were already in `package.json`
   - Reinstall if needed: `npm install`

3. **Restore environment variables**:
   - All Supabase and API environment variables remain unchanged
   - Original `.env` files not modified

4. **Restart development server**:
   ```bash
   npm run dev
   # This starts the Express server on port 5001 and Vite on port 5173
   ```

5. **Restore Vercel deployment** (if needed):
   - Original `vercel.json` configuration remains unchanged
   - Redeploy to restore Express wrapper

## Important Notes

- **NO CODE WAS DELETED**: All original files are preserved in this backup
- **DATABASE UNCHANGED**: Supabase database structure and data remain intact
- **ENVIRONMENT UNCHANGED**: All `.env` files remain the same
- **EASY ROLLBACK**: Moving directories back restores original architecture
- **IDENTIFICATOR CODE**: Related ticket/migration: AP-2025-001

## Migration Progress

This backup is part of a 5-phase migration:
- ✅ Phase 1: Archive Express/API code (COMPLETED)
- ⏳ Phase 2: Create Supabase Edge Functions (payment + admin)
- ⏳ Phase 3: Migrate frontend to use Supabase client directly
- ⏳ Phase 4: Update configuration files (Vercel, package.json, Vite)
- ⏳ Phase 5: Test locally and deploy to Vercel

## Original Configuration References

**Express Server Setup** (`server/index.ts`):
- Port: 5001 (development)
- CORS enabled for frontend on port 5173
- Middleware: body-parser, JSON, URL encoding, compression, security headers
- Error handling for all routes
- Only starts server when `NODE_ENV !== 'production'`

**Vite Configuration** (`vite.config.ts`):
- Port: 5173
- Proxy: `/api` -> Express server at `http://127.0.0.1:5001`

**Vercel Configuration** (`vercel.json`):
- Routes: `/api/*` -> `/api/index.ts`, `/*` -> `/index.html`
- Functions configured with different timeouts/memory limits

**Database Setup**:
- Original: PostgreSQL with connection pooling
- New: Supabase (PostgreSQL) with native client and RLS

---
**Archived By**: Automated Migration Script (Phase 1)
**Migration Plan**: See root-level `MIGRATION_PLAN.md` for complete details
**Questions**: Refer to migration documentation or contact development team