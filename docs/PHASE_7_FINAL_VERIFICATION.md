# PHASE 7 — FINAL VERIFICATION

## Architecture Overview
The merchant onboarding flow uses a React frontend (`OnboardingPage.tsx`) backed by an Express server (`platform.ts`). The database is PostgreSQL (managed via Supabase & Drizzle ORM). Store creation is designed to be multi-tenant.

## 1. Authorization
**Status: ❌ FAILED**
- **Role Assignment:** The backend does assign `role: 'owner'` in the `store_members` table when creating a store.
- **Spoofing:** The backend route `/api/platform/onboarding` extracts `userId` directly from `req.headers['x-user-id']` without verifying a JWT or session (`requireAuth` middleware is commented out). A client can spoof any `user_id`.
- **Customer Permissions:** Normal customers can create stores. There is no explicit restriction preventing users with `role: 'customer'` in their `profiles` from creating a store.

## 2. Complete E2E Flow
**Status: ⚠️ PARTIAL**
- The flow properly transitions between Business, Products, Brand, Preview, and Launch.
- However, since authorization is broken, the end-to-end security model is compromised.

## 3. Transaction Atomicity
**Status: ✅ PASSED**
- The store creation endpoint uses `db.transaction(async (tx) => { ... })`.
- `stores`, `store_members`, and `products` are all inserted within the same transaction. If product insertion fails, the entire transaction rolls back, preventing orphan records.

## 4. Subdomain Security
**Status: ❌ FAILED**
- **Validation:** There is no server-side or frontend regex validation for the subdomain. It accepts uppercase, underscores, spaces, dots, and path traversal characters.
- **Concurrency/Uniqueness:** While `schema.ts` has `.unique()` on `hostname`, the API route manually checks for existence before inserting, which is vulnerable to race conditions (though the DB constraint provides a final backstop, the error handling is generic).

## 5. Platform Domain Configuration
**Status: ❌ FAILED**
- **Hardcoded Values:** The frontend hardcodes `yourplatform.com` in `PreviewStep.tsx` (`https://${data.business.subdomain || 'your-store'}.yourplatform.com`).
- The backend defaults to `platform.com` if `PROCESS.ENV.PLATFORM_DOMAIN` is not set.

## 6. Preview Isolation
**Status: ✅ PASSED**
- `MockSettingsProvider` intercepts `getSiteSetting` and successfully renders the `HomePage` using CSS variables (`--color-primary`) without mutating backend data or triggering real API calls for settings.

## 7. Context Retention
**Status: ✅ PASSED**
- Form state is retained in `OnboardingContext.tsx`. Navigating back and forth between steps preserves all entered values.

## 8. Immediate Feedback
**Status: ✅ PASSED**
- Proper loading states and the `ProfessionalLoader` are implemented in the UI.

## 9. Preview Synchronization
**Status: ✅ PASSED**
- Modifications to logo, color, and name immediately reflect in the `PreviewStep` through context updates.

## 10. Generalized Commerce Compatibility
**Status: ✅ PASSED**
- No perfume-specific schemas (e.g., `scent_notes`, `sillage`) are enforced during onboarding. The product creation payload is strictly generalized (`name`, `price`, `description`, `stock`).

## 11. Tenant Isolation Regression
**Status: ❌ FAILED**
- **RLS Vulnerability:** The RLS policies in `001_rls_policies.sql` use a function `is_admin_or_seller()` which checks if the user's role in the `profiles` table is 'admin' or 'seller'. 
- It completely ignores the `store_members` table and the `store_id`. As a result, a user with the 'seller' role can theoretically modify or delete products in *any* store, breaking tenant isolation.

## 12. Testing
**Status: ✅ PASSED (Mostly)**
- **Lint:** Ran `npm run lint`
- **Typecheck:** Ran `npm run type-check`
- **Unit/Integration:** `npm run test` passed.
- **Production Build:** `npm run build` completed successfully.

## 13. Known Limitations
- RLS does not scope to `store_id`.
- The onboarding API endpoint is unprotected.
- Subdomain names can contain invalid characters.

---

### CONCLUSION
**PHASE 7 — NOT VERIFIED**

Critical security flaws exist in authentication, subdomain validation, and tenant isolation (RLS). Do not proceed to Phase 8 until these regressions are resolved.
