# PHASE 7 — SECURITY REMEDIATION

## 1. Original Vulnerabilities
1. **Authentication:** The onboarding endpoint (`/api/platform/onboarding`) improperly trusted `req.headers['x-user-id']` for user identity, allowing full identity spoofing.
2. **Merchant Authorization:** The endpoint accepted a client-provided role, meaning an arbitrary user could choose to become an admin or owner.
3. **Tenant Isolation (RLS):** The PostgreSQL Row Level Security (RLS) policies used a function `is_admin_or_seller()` which checked the global `profiles.role` table, ignoring `store_members`. This meant a user who was a seller in Store A could access products in Store B.
4. **Subdomain Validation:** Subdomains were not strictly validated, allowing path traversals, capitals, underscores, and reserved keywords like `admin` and `api`.
5. **Platform Domain Configuration:** The frontend hardcoded `yourplatform.com` for the launch preview, meaning it didn't scale dynamically across environments.

## 2. Root Cause
- The system heavily relied on Supabase's managed RLS `auth.uid()` and bypassed proper session cookie validations in custom endpoints.
- Store ownership was granted without server-side enforcement.
- `001_rls_policies.sql` checked for the `role` directly inside the global `profiles` table instead of evaluating the user's role per store via `store_members`.

## 3. Remediation Details

### Authentication Model
- **Mechanism:** Removed `req.headers['x-user-id']`.
- **Enforcement:** Applied `requireAuth` middleware to `POST /api/platform/onboarding`.
- **Identity:** Identity is derived strictly from `res.locals.user.id`. Unauthenticated requests and forged IDs are rejected.

### Membership Model & Table `store_members`
- **Who can read it?** Any authenticated user whose transaction context `app.current_store_id` matches the `store_id` (so, scoped to the current store only).
- **Who can insert?** Only an existing `admin` or `owner` of the given store.
- **Who can update roles?** Only an existing `admin` or `owner` of the given store. (A `seller` cannot escalate themselves to owner).
- **Who can delete memberships?** Only an existing `admin` or `owner` of the given store.
- **How is owner protection enforced?** The endpoint `POST /api/platform/onboarding` forcibly overrides any client-supplied role to `'owner'` and binds it to the newly created store. Cross-store owner manufacturing is blocked at the RLS level by the `is_store_admin()` helper.
- **How does the RLS membership helper access it?** `store_members` uses `USING (store_id = public.app_store_id())`. To avoid infinite RLS recursion, the policy helpers (`is_store_merchant` and `is_store_admin`) call a `SECURITY DEFINER` function `public.is_store_member_secure()` owned by superuser. This safely performs the membership existence check while bypassing the RLS evaluation loop for `store_members`, without granting `platform_app` any broad `BYPASSRLS` privileges.

**Exploit Verification:**
If a user submits `{ "business": { "name": "Hack", "subdomain": "hack" }, "store_id": "store-B", "role": "owner" }`, the Express backend entirely ignores the client's `store_id` and `role`. It generates a new store and assigns the membership exclusively to that newly generated store. Furthermore, directly hitting the DB to insert an owner membership for another store violates the `store_members` RLS policy (Test case: "Owner of Store A cannot manufacture an owner membership for Store B" passes).

### Subdomain Validation & Database Constraints
- **Regex Enforcement:** `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`
- **Sanitization:** Forced lowercase.
- **Blocklist:** Rejected reserved names: `www, api, app, admin, test, demo, staging, dev`.
- **Concurrency & Constraints:** Relying on Postgres `UNIQUE` constraints (`stores.hostname`). The Express backend explicitly traps Postgres unique violation code `23505` to ensure exactly one request succeeds during concurrent races.

### Platform Domain
- Removed hardcoded `yourplatform.com` from frontend preview.
- Bound domain launch logic to the `PLATFORM_DOMAIN` backend environment and `VITE_SITE_URL` frontend environment to properly establish a canonical launch URL.

### Database Configuration & Security
- `docker-compose.yml` mounts the `postgres-init` directory with an initialization script creating `platform_app`.
- `platform_app` is explicitly created with `NOSUPERUSER` and `NOBYPASSRLS`.
- Production `DATABASE_URL` will be securely injected via external environment variables.

## 4. Supabase Runtime Audit
A comprehensive sweep for `@supabase/supabase-js` revealed the following dependencies:
- **`src/lib/supabase.ts`:** Active. Used extensively by frontend code for data fetching and realtime subscriptions. **Must be migrated to the Express `/api` layer in a future phase.**
- **`scripts/*` (Seed files):** Legacy / Development Only. Safe to remove or keep purely for local development.
- **`supabase/functions/*` (Edge Functions):** Legacy. No longer deployed, as the Node.js Express server absorbs this functionality.

## 5. Security Tests & Results
Added comprehensive automated test coverage in `tests/security.test.ts`. All executed successfully:
- **A.** unauthenticated onboarding → 401
- **B.** forged X-User-ID → rejected/ignored
- **C-H.** User/Store isolation (Tests confirm user context logic properly sandboxes DB queries)
- **I-K.** Subdomain validation (Regex rejects invalid/reserved names, and DB correctly traps `23505` unique violations on concurrent requests).
- **L.** Launch URL integrity
- **M-O.** Transaction leak prevention and active RLS tested.

**Test Commands Executed:** `npx vitest run tests/security.test.ts` (Passed), `npm run type-check` (Failed - remaining non-security technical debt), `npm run lint` (Passed).

## 6. Remaining Technical Debt
- **Frontend Supabase Migration:** The frontend still bypasses the `/api` backend for many queries, connecting directly via `@supabase/supabase-js`. A dedicated migration phase is necessary to route all traffic through the Express server.
- **Type-Check Failures:** Approximately 1455 TS warnings and minor type-check errors exist across various frontend components (e.g. `ProductDetail.tsx`, `AddressesPage.tsx`).
