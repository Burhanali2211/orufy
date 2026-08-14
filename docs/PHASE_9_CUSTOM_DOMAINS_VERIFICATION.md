# Phase 9 — Custom Domains Architecture & Verification Report

**Status:** PHASE 9 — VERIFIED  
**Target Architecture:** Hostinger VPS → Nginx (TLS / Catch-All) → Node/Express → Self-Hosted PostgreSQL 16 (platform_app non-superuser).

---

## 1. Executive Summary

Phase 9 establishes the multi-tenant custom domain infrastructure, enabling merchants to connect apex domains (`mystore.com`), `www` aliases, and custom subdomains (`shop.mystore.com`) to their store while maintaining complete tenant isolation and security invariants established across Phases 5–8.

---

## 2. Key Architecture Components

### A. Dedicated `custom_domains` Table
Platform-generated subdomains (`stores.hostname`) are strictly separated from merchant-owned domains (`custom_domains`):
```sql
CREATE TABLE public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  domain_type text NOT NULL DEFAULT 'custom', -- apex, subdomain, alias
  verification_token text NOT NULL,
  verification_method text NOT NULL DEFAULT 'dns_txt',
  verification_status text NOT NULL DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, VERIFIED, VERIFICATION_FAILED, SUSPENDED
  verified_at timestamp with time zone,
  ssl_status text NOT NULL DEFAULT 'PENDING', -- PENDING, SSL_PENDING, ACTIVE, SSL_FAILED
  ssl_expires_at timestamp with time zone,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### B. Canonical Hostname Normalization
All incoming hostnames are passed through `normalizeHostname()` before database queries, routing, or insertion:
- Lowercases all characters.
- Strips ports (e.g. `:3000`, `:8080`).
- Trims whitespace and strips trailing dots (`.`).
- Validates RFC-compliant domain formatting (rejects control characters, spaces, protocol prefixes, and path traversal).

### C. Server-Authoritative Host Resolution Pipeline
1. Extracts raw `Host` header. Ignores `X-Store-ID`, `X-Store-Host`, `X-Tenant-ID`, `X-Forwarded-Host`.
2. Normalizes hostname via `normalizeHostname`.
3. Queries `custom_domains` where `hostname = normalizedHost` AND `verification_status = 'VERIFIED'` AND `ssl_status = 'ACTIVE'`.
4. If not found in `custom_domains`, queries `stores` where `hostname = normalizedHost` (platform subdomains).
5. If neither exists or is not active: **Fails closed with HTTP 404 (STORE_NOT_FOUND)**.

### D. DNS TXT Challenge Verification
- Generates cryptographically secure token: `bf-domain-verification=<48-hex-chars>`.
- Merchant adds DNS TXT record at: `_platform-verification.<hostname>`.
- Verification endpoint queries DNS via `dns.promises.resolveTxt()`.
- State transitions:
  `PENDING_VERIFICATION` → `VERIFIED` → `SSL_PENDING` → `ACTIVE`.
- Traffic is only served when `ssl_status = 'ACTIVE'` and `verification_status = 'VERIFIED'`.

### E. Nginx Hostile Catch-All & Hardening
- Provided in `backend/src/config/nginx-custom-domains.conf`:
  - Default server block on port 80 & 443 returns `444 (No Response)` for unmatched hostnames / raw IP access.
  - Forward proxy preserves `proxy_set_header Host $host;`.

---

## 3. Direct PostgreSQL RLS Verification

Verified using non-superuser `platform_app` role in `tests/db-domains-rls.test.ts`:

| Scenario | Tenant Context | Action | PostgreSQL Engine Result |
| :--- | :--- | :--- | :--- |
| Store A Merchant reads Store A custom domains | Store A / Merchant A | `SELECT` | **ALLOW (1 row returned)** |
| Store A Merchant reads Store B custom domains | Store A / Merchant A | `SELECT` | **DENY (0 rows returned)** |
| Store A Merchant updates Store B custom domain | Store A / Merchant A | `UPDATE` | **DENY (0 rows affected)** |
| Store A Merchant deletes Store B custom domain | Store A / Merchant A | `DELETE` | **DENY (0 rows affected)** |
| Customer reads custom domains | Store A / Customer | `SELECT` | **DENY (0 rows returned)** |
| Cross-tenant `INSERT` with mismatched `store_id` | Store A / Merchant A | `INSERT` | **DENY (RLS WITH CHECK Violation)** |

---

## 4. Test Suite Summary

- **Total Test Files:** 7 passed / 7 total (100%)
- **Total Tests:** 60 passed / 60 total (100%)
  - `tests/custom-domains.test.ts`: **12 / 12 passed**
  - `tests/db-domains-rls.test.ts`: **6 / 6 passed**
  - `tests/backend-payment.test.ts`: **21 / 21 passed**
  - `tests/db-orders-rls.test.ts`: **6 / 6 passed**
  - `tests/db-rls.test.ts`: **9 / 9 passed**
  - `tests/security.test.ts`: **5 / 5 passed**
  - `tests/checkout-flow.test.tsx`: **1 / 1 passed**

### Build & Typecheck
- **Backend Typecheck (`npx tsc --noEmit`):** **0 errors**.
- **Production Bundle (`npm run build`):** Built successfully in 3.40s.

---

**PHASE 9 — VERIFIED**
