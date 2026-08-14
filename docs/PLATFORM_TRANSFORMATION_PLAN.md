# Platform Transformation Plan

## 1. Architectural Principles

**Security Invariant:** Store isolation must be treated as a security invariant, not merely an application feature. Every store-owned operation must have an explicitly established store context, and cross-store access must fail even when a malicious client manipulates identifiers, hostnames, request bodies, query parameters, or URLs.

**Backend-Enforced Authorization:** No application database role used by ordinary request handling may bypass RLS. Any privileged/bypass role must be isolated to explicit administrative/migration operations.

## 2. Current Architecture
The application is currently a single-tenant, serverless e-commerce website heavily customized for "YourCommerce". 
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, React Context.
- **Backend**: Fully reliant on Supabase (PostgreSQL, Auth, Storage) and a single Vercel serverless function (`api/payment-process.js`) for Razorpay integration.
- **Database**: PostgreSQL (via Supabase) with 22 tables. Advanced schema including RLS policies for user isolation, but **no** tenant isolation.
- **Data Model**: The `products` table contains fragrance-specific fields (`scent_notes`, `longevity`, `sillage`, `fragrance_family`).
- **Branding**: Hardcoded text, colors, and email addresses (`noreply@aligarhattarhouse.com`) throughout the codebase.
- **Payments**: Razorpay credentials stored globally in Vercel environment variables.

## 3. Problems
1. **No Multi-Store Capability**: The database lacks `store_id` boundaries. All products and orders are treated as belonging to a single business.
2. **Supabase Lock-in**: The architecture heavily relies on Supabase Auth, Storage, and client-side database querying via `@supabase/supabase-js`.
3. **Hardcoded Identity**: "YourCommerce" references are baked into components, terms of service, SEO, and emails.
4. **Specialized Schema**: The product schema mandates fragrance-specific fields, preventing a generalized commerce approach.
5. **Payment Verification Vulnerability**: `api/payment-process.js` blindly trusts client-provided `order_id` values when marking orders as paid.
6. **Global Payment Credentials**: Razorpay keys are global, preventing merchants from using their own accounts.
7. **CSS Rigidity**: Tailwind colors are compiled at build time, preventing dynamic theming per store.

## 4. Target Architecture

```text
                         ┌───────────────────┐
                         │     PLATFORM      │
                         │   yourdomain.com  │
                         └─────────┬─────────┘
                                   │
                           Store Builder
                                   │
                                   ▼
                         ┌─────────────────┐
                         │     STORES      │
                         └────────┬────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
              Store A          Store B          Store C
              ID = 1           ID = 2           ID = 3
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
                            Shared App
                                  │
                            Backend API
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
             Authorization                   Store Context
                   │                             │
                   └──────────────┬──────────────┘
                                  ▼
                           PostgreSQL VPS
                                  │
                             PostgreSQL RLS
                                  │
                   ┌──────────────┼──────────────┐
                   ▼              ▼              ▼
                Store 1        Store 2        Store 3
                 Data           Data           Data
```

- **Infrastructure Flow**: Cloudflare -> Vercel (Frontend) -> Backend API -> VPS (PostgreSQL & Object Storage).
- **Store Resolution**: The Backend API independently resolves the store context based on the requested hostname (e.g., `Host: kashmircrafts.platform.com` -> `store_id = 27`). The frontend must **never** be trusted to declare its own `store_id`.
- **Frontend**: React (Vite) deployed on Vercel. 
- **Backend API**: A new Node.js/TypeScript backend API layer to intermediate all database access, replacing direct Supabase client queries.
- **Database**: Self-hosted PostgreSQL on a VPS (firewalled, no public 5432). Isolation is achieved via **Application-level authorization + PostgreSQL Row-Level Security as defense in depth**.
- **Storage**: The platform will evaluate VPS filesystem + CDN vs Cloudflare R2 vs AWS S3 based on Cost, Scaling, Backups, and Image Delivery before deciding.
- **Payments**: Razorpay Linked Accounts (Platform/Route model). The platform will handle merchant onboarding and link accounts, preventing the need to store raw merchant secrets.
- **Theming**: Dynamic injection of CSS variables (`--color-primary`, etc.) based on store configuration.

## 5. Migration Strategy & Database Table Classification
**Production Safety**: Existing Supabase production data remains untouched until the new system passes extensive validation.

Tables will be strictly classified before migration:

**GLOBAL**
- `platform_settings`, system configuration, etc.

**STORE-OWNED**
- `stores`, `products`, `categories`, `inventory`, `orders`, `reviews`, `discounts`, `payment_accounts`, `payment_configuration`.

**USER-OWNED**
- `profiles`, authentication data.

**STORE + USER**
- `store_members` (maps users to stores with roles/permissions), `merchant_settings`.

**ORDER-SCOPED**
- `order_items`, `payment_attempts`, `payment_transactions`.

## 6. Generalized Product Model
Core commerce properties must remain strictly relational:
- `id`, `store_id`, `name`, `slug`, `description`, `price`, `SKU`, `brand`, `category_id`, `inventory`.
Category-specific properties will use an `attributes` JSONB column (e.g., Perfume -> `fragrance_family`, Shoes -> `size`).

## 7. UX Principles for Onboarding
- **Cognitive Load Reduction**: Ask only what is necessary at each stage.
- **Hick's Law**: Reduce simultaneous choices.
- **Context Retention**: Pre-fill data across steps. Keep context visible.
- **Spatial Memory**: Keep controls in predictable locations.
- **Immediate System Status**: Show loading and success states instantly.
- **Feedback Loops**: Every action needs a visible response.
- **Clear Affordance**: Buttons look like buttons, clickable items are clear.
- **Goal Gradient Effect**: Use a progress indicator showing approaching completion.
- **Recognition over Recall**: Let users pick from curated lists instead of typing everything.
- **Progressive Disclosure**: Limit the initial onboarding funnel to exactly 5 stages:
  1. Business -> 2. Products -> 3. Brand -> 4. Preview -> 5. Launch

## 8. Phase-by-Phase Implementation

***CRITICAL DIRECTIVE: Do not implement the entire roadmap in one pass. Complete exactly one phase, validate it, document it, and stop for approval before moving to the next phase.***

### PHASE 0: Discovery & Planning
- ✅ Architecture analyzed.
- ✅ Transformation plan created and approved.

### PHASE 0.5: Architecture Safety Baseline
Before modifying anything, record a Production Read-Only Baseline:
- Current routes, database schema, row counts, users, products, categories, orders, payment records, uploaded assets, environment variables, deployment configuration, and Supabase policies.
- Establish automated tests, migration scripts, and rollback strategies.

### PHASE 1: Security Stabilization
- Fix Razorpay payment verification vulnerability.
- Fix CORS.
- Audit authentication, authorization, IDOR risks, admin endpoints, service-role/privileged database access, and file uploads.
- Add payment verification tests and regression tests for existing checkout.

### PHASE 2: Generalize Commerce Model
- Migrate `scent_notes`, `longevity`, `sillage`, etc., into a generalized `attributes` JSONB column.
- Abstract hardcoded "YourCommerce" text from components into configuration.

### PHASE 3: Self-Hosted PostgreSQL + Backend API
- Setup a private PostgreSQL instance on the VPS.
- Select ORM (Evaluate Drizzle vs Kysely based on TS support and migration handling).
- Create the Backend API to handle all data access securely.

### PHASE 4: Self-Hosted Authentication
- Migrate off Supabase Auth.
- Implement standard JWT/Session authentication.
- Migrate users safely (transferable hashes or password resets).

### PHASE 5: Store / Multi-Tenant Architecture
- 5.1 Create `stores` table.
- 5.2 Create `store_members` table.
- 5.3 Establish ownership model.
- 5.4 Add store-scoped database relationships (`store_id` FKs).
- 5.5 Implement backend authorization rules.
- 5.6 Implement PostgreSQL RLS.
- 5.7 Run **Cross-Store Security Tests** (Verify Store A cannot access/modify Store B products/orders/customers/settings, and test malicious `?store_id=B` injections).
- 5.8 Migrate YourCommerce -> Store #1.

### PHASE 6: Hostname Resolution & Subdomains
- Implement Backend API middleware to resolve `store_id` from the incoming hostname.
- Configure Vercel wildcard domains.

### PHASE 7: Store Builder / Onboarding
- Build the 5-stage onboarding flow applying all documented UX principles.

### PHASE 8: Merchant Payment Accounts
- Integrate Razorpay Linked Accounts/Route API for merchant onboarding and dynamic payment routing.

### PHASE 9: Custom Domains
- Integrate Vercel Domains API to map custom apex/subdomains (e.g., `www.mystore.com`).

### PHASE 10: Domain Purchasing
- Integrate a registrar API for native domain purchases (later phase).

### PHASE 11: Production Migration / Cutover
- Final data sync from existing Supabase to the new architecture.
- Final validation against the Phase 0.5 Baseline.
- DNS switch.

## 9. Testing Strategy
- **Multi-Store Security Tests**: Mandatory test suite ensuring authorization failures (not just empty responses) when attempting cross-store data access.
- **Unit & Integration**: Test Backend API endpoints.
- **E2E Testing**: Complete checkout flows.
- **Payment Mocking**: Thoroughly test Razorpay webhooks in staging.

## 10. Rollback Strategy
- Keep the existing Supabase instance and Vercel deployment untouched during development.
- Staging environments will be used to dry-run cutovers.
- If the new platform fails post-cutover, immediately switch DNS back to the Vercel deployment that points to Supabase.
