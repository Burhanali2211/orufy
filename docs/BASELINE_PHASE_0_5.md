# Phase 0.5: Production Read-Only Baseline

This document serves as the immutable snapshot of the existing "YourCommerce" architecture before any multi-store transformation begins. This baseline guarantees that we can verify data integrity during and after migrations.

## 1. Database Row Counts (Snapshot: Pre-Migration)
*Recorded using `@supabase/supabase-js` via Service Role Key.*

- **profiles**: 5
- **categories**: 19
- **products**: 42
- **product_variants**: 0
- **addresses**: 0
- **cart_items**: 3
- **wishlist_items**: 1
- **orders**: 4
- **order_items**: 0
- **order_tracking**: 0
- **payment_logs**: 0
- **payment_methods**: 0
- **reviews**: 0
- **notification_preferences**: 0
- **site_settings**: 26
- **contact_information**: 4
- **social_media_accounts**: 4
- **uploaded_files**: 0

*Total Core Commerce Records to Migrate:* 42 Products, 19 Categories, 4 Orders, 5 Users.

## 2. Current Routes
**Public Routes:**
- `/`, `/products`, `/products/:id`, `/search`, `/compare`, `/new-arrivals`, `/deals`, `/categories`, `/categories/:slug`, `/cart`, `/about`, `/contact`
- Legal: `/privacy-policy`, `/terms-of-service`, `/refund-policy`, `/shipping-policy`
- Auth: `/auth`, `/reset-password`, `/auth/callback`

**Protected Routes:**
- Customer: `/checkout`, `/wishlist`, `/orders/:orderId`, `/track-order/:orderId`, `/order-confirmation/:orderId`, `/profile`
- Admin: `/admin/*`, `/dashboard/*`

## 3. Current Environment Variables (`.env`)
- `DATABASE_URL` (Direct Postgres connection)
- `SUPABASE_URL` (PostgREST API)
- `SUPABASE_ANON_KEY` (Public client key)
- `SUPABASE_SERVICE_ROLE_KEY` (Privileged bypass key)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV` (production)
- `VITE_SITE_URL` (https://aligarhattarhouse.vercel.app)
- `FRONTEND_URL`

## 4. Current Deployment Configuration
- **Hosting**: Vercel
- **Config file**: `vercel.json` contains SPA routing rewrites (`"source": "/(.*)", "destination": "/index.html"`) and aggressive CORS headers allowing `*`.
- **Backend Function**: `api/payment-process.js` running as a Vercel Serverless Function.
- **Docker**: `Dockerfile.client`, `Dockerfile.server`, and `docker-compose.yml` exist but are not the active production deployment (Vercel is active).

## 5. Current Supabase Policies (RLS)
The database enforces user isolation using PostgreSQL Row-Level Security (RLS) primarily found in `supabase/schema/005_rls_policies.sql` and `006_rls_policies.sql`:
- **Admin Full Access**: Policies use `auth.uid()` checked against `role = 'admin'` in `profiles`.
- **Public Read Access**: `products`, `categories`, `product_variants`, `reviews`, `site_settings`.
- **Authenticated User Isolation**: `cart_items`, `wishlist_items`, `orders`, `addresses`, `profiles`. Users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` where `user_id = auth.uid()`.

## 6. Migration & Rollback Strategy

### Automated Tests
A suite of tests will be written in Phase 1 before migration starts:
- **Payment Integrity**: Verify malicious `order_id` injection is blocked.
- **Cross-Store Isolation**: Enforce strictly that `store_id` is validated server-side.

### Rollback Plan
- The existing Supabase project will remain 100% active and untouched.
- The existing Vercel deployment will continue serving traffic using the old `.env` variables.
- If the Phase 11 cutover to the new self-hosted Postgres fails, DNS will be immediately switched back to Vercel, restoring the exact state documented in this baseline.
