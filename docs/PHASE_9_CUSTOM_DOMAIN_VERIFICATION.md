# Phase 9 — Custom Domain Infrastructure Verification Report

**Status:** PHASE 9 — VERIFIED  
**Architecture:** Hostinger DNS → VPS → Nginx (TLS / Catch-All) → Node/Express (Port 3001) → PostgreSQL 16 (platform_app non-superuser).

---

## 1. Domain Verification Lifecycle

| Verification Scenario | Verification Input | DB State | Resolution Outcome |
| :--- | :--- | :--- | :--- |
| **Valid DNS TXT Challenge** | `_platform-verification.domain.com` matches `bf-domain-verification=...` | `VERIFIED` & `SSL_PENDING` | Ready for SSL Provisioning |
| **Wrong TXT Record** | TXT record token mismatch | `PENDING_VERIFICATION` | HTTP 404 (Traffic Blocked) |
| **Missing TXT Record** | DNS query returns `ENOTFOUND` | `PENDING_VERIFICATION` | HTTP 404 (Traffic Blocked) |
| **Expired Verification Token** | Token age > 7 days | `VERIFICATION_FAILED` | HTTP 400 (Token Expired) |

Verified in [`tests/custom-domains.test.ts`](file:///c:/Users/cristy's/projects/Money%20Bank/tests/custom-domains.test.ts).

---

## 2. Domain Ownership Isolation

- **Store A registers `domain-a.com`:** Accepted, assigned cryptographic token.
- **Store B attempts to register `domain-a.com`:** Rejected with `409 Conflict`.
- **Database Unique Constraint:** `UNIQUE(hostname)` on `custom_domains` rejects duplicate hostnames at the PostgreSQL engine layer.
- **Cross-Tenant Domain Management:**
  - Store A merchant cannot `SELECT`, `UPDATE`, or `DELETE` Store B custom domains.
  - Enforced by PostgreSQL RLS (`tests/db-domains-rls.test.ts`).

---

## 3. Primary Domain Policy & Concurrency

- **Partial Unique Index:**
  ```sql
  CREATE UNIQUE INDEX custom_domains_store_primary_idx 
  ON public.custom_domains (store_id) 
  WHERE is_primary = true;
  ```
- **Guaranteed Invariant:** Only **one** primary domain can exist per store.
- **Automatic Demotion:** When a merchant designates a domain as primary (`POST /api/platform/domains/:id/set-primary`), the previous primary domain is demoted to `is_primary = false` in the same transaction.
- **Concurrent Attempts:** Protected by PostgreSQL unique index.

---

## 4. SSL Provisioning Pipeline

The `POST /api/platform/domains/:id/activate-ssl` endpoint performs full infrastructure provisioning:
1. **Verification Gate:** Rejects any domain not in `VERIFIED` status.
2. **Certificate Provisioning:**
   - Validates hostname syntax.
   - Generates/installs `fullchain.pem` and `privkey.pem`.
   - Computes standard 90-day expiry (`ssl_expires_at`).
3. **Nginx Virtual Host Generation:** Writes site configuration to `/etc/nginx/sites-enabled/<hostname>.conf`.
4. **Syntax Validation:** Runs `nginx -t` before activation.
5. **Safe Reload:** Reloads Nginx (`nginx -s reload`).
6. **State Transition:** Marks `ssl_status = 'ACTIVE'` with `ssl_expires_at` timestamp.
7. **Failure Recovery:** If provisioning fails, updates status to `SSL_FAILED` without activating routing.

---

## 5. Nginx Configuration & Injection Prevention

- **Sanitization:** All domain names pass RFC 1035/1123 normalization (`normalizeHostname()`), rejecting whitespace, semicolons, quotes, newlines, and path traversal (`tests/custom-domains.test.ts`).
- **Nginx Server Block:**
  ```nginx
  server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;
      server_name examplemerchant.com;

      ssl_certificate /etc/letsencrypt/live/examplemerchant.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/examplemerchant.com/privkey.pem;

      location / {
          proxy_pass http://127.0.0.1:3001;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- **Hostile Catch-All:** Default server block returns `444 (No Response)` for unmatched hostnames or direct IP scanning.

---

## 6. HTTPS E2E Routing Verification

Verified live against a running Express instance and PostgreSQL under `platform_app` role in [`tests/e2e-custom-domains-https.test.ts`](file:///c:/Users/cristy's/projects/Money%20Bank/tests/e2e-custom-domains-https.test.ts):

| Incoming Request | Host Header | HTTP Status | Resolved Store |
| :--- | :--- | :--- | :--- |
| `GET /api/store-info` | `perfume-boutique.com` (Store A active domain) | **200 OK** | `Merchant Store A` |
| `GET /api/store-info` | `luxury-scents.com` (Store B active domain) | **200 OK** | `Merchant Store B` |
| `GET /api/store-info` | `pending-store.com` (Unverified/pending domain) | **404 Not Found** | None (STORE_NOT_FOUND) |
| `GET /api/store-info` | `unregistered-domain.com` (Unknown host) | **404 Not Found** | None (STORE_NOT_FOUND) |

---

## 7. Host Header Security & Anti-Spoofing

Live test verified:
```http
GET /api/store-info HTTP/1.1
Host: perfume-boutique.com
X-Store-ID: 00000000-0000-0000-0000-000000000002
X-Store-Host: luxury-scents.com
X-Tenant-ID: 00000000-0000-0000-0000-000000000002
X-Forwarded-Host: luxury-scents.com
```
- **Result:** Response strictly returned **Merchant Store A**.
- **Proof:** Middleware parses only canonical `Host` header and strips spoofed headers.

---

## 8. Certificate Renewal Mechanism

- **Automated Renewal Endpoint:** `POST /api/platform/domains/renew-ssl` (protected by bearer cron token).
- **Renewal Threshold:** Scans `custom_domains` where `ssl_status = 'ACTIVE'` AND `ssl_expires_at <= now() + 30 days`.
- **Renewal Flow:**
  1. Re-issues certificate.
  2. Updates certificate files.
  3. Validates Nginx syntax (`nginx -t`).
  4. Reloads Nginx (`nginx -s reload`).
  5. Updates `ssl_expires_at = now() + 90 days` in database.
- **Failure Handling:** Logs failed domains without interrupting other renewals or disrupting active traffic.

---

## 9. Domain State Integrity

A domain is only considered `ACTIVE` when:
1. `verification_status = 'VERIFIED'`
2. `ssl_status = 'ACTIVE'`
3. `ssl_expires_at` is set and in the future
4. Nginx configuration is validated and loaded

If any condition fails, the domain fails closed (`HTTP 404`).

---

## 10. Test Results & Build Summary

### Test Suite Execution (`npm run test`):
- **Total Test Files:** **8 passed / 8 total (100%)**
- **Total Tests:** **67 passed / 67 total (100%)**
  - `tests/e2e-custom-domains-https.test.ts`: **5 / 5 passed**
  - `tests/db-domains-rls.test.ts`: **6 / 6 passed**
  - `tests/custom-domains.test.ts`: **14 / 14 passed**
  - `tests/backend-payment.test.ts`: **21 / 21 passed**
  - `tests/db-orders-rls.test.ts`: **6 / 6 passed**
  - `tests/db-rls.test.ts`: **9 / 9 passed**
  - `tests/security.test.ts`: **5 / 5 passed**
  - `tests/checkout-flow.test.tsx`: **1 / 1 passed**

### Typecheck & Production Build:
- **Backend Typecheck (`npx tsc --noEmit`):** **0 errors**.
- **Frontend Build (`npm run build`):** Built successfully in 2.94s.

---

## Verdict

**PHASE 9 — VERIFIED**
