# Phase 6: VPS Hostname & Subdomain Architecture

## Architecture Overview

The platform uses a strict hostname-based resolution architecture, hosted entirely on a dedicated Virtual Private Server (VPS). Nginx acts as the single reverse proxy for the entire platform, routing traffic to the Node.js backend while preserving the original `Host` header. 

The backend API remains the authoritative source of store identity, determining context via `req.hostname`. It does not accept client-provided `store_id` parameters, ensuring absolute tenant isolation enforced by PostgreSQL Row-Level Security (RLS).

### Topology
```text
              HOSTINGER
          Domain + DNS
                │
                ▼
        *.yourplatform.com
                │
                ▼
             YOUR VPS
                │
          ┌─────┴─────┐
          ▼           ▼
        Nginx      PostgreSQL
          │
      ┌───┴───┐
      ▼       ▼
  Frontend  Backend
              │
              ▼
          Store Resolver
              │
              ▼
        PostgreSQL RLS
```

## Hostname Resolution Flow
1. **Request Ingress:** A request hits the VPS IP and is accepted by Nginx.
2. **Nginx Reverse Proxy:** Nginx is configured to blindly forward the request to the backend while preserving the original `Host` header (e.g., `proxy_set_header Host $host;`). It does not need a dynamic configuration for every merchant.
3. **Express Proxy Trust:** The Express backend is configured with `app.set('trust proxy', 'loopback, uniquelocal')`. This strictly trusts proxies located on the local machine or Docker internal network (like Nginx), preventing remote attackers from spoofing `X-Forwarded-Host`.
4. **Reserved Domain Check:** The `storeResolver` middleware converts the hostname to lowercase and checks if it matches a reserved platform domain (e.g., `www.yourplatform.com`).
   - If reserved: The request is flagged with `res.locals.isPlatform = true` and allowed to proceed without a store context.
5. **Cache Lookup:** The middleware checks a high-performance in-memory LRU cache (`storeCache`) for the hostname.
   - If cached: The store context is attached to the request instantly.
6. **Database Lookup:** On a cache miss, the backend queries the PostgreSQL `stores` table.
   - If found: The store context is cached and attached.
   - If not found: The negative lookup is cached to prevent DDoS, and the request is immediately rejected with a `404 STORE_NOT_FOUND`.

## Reserved Domains
The following subdomains are strictly reserved for platform operations and cannot be claimed by merchants:
- `www` (Main marketing site)
- `app` (Merchant dashboard)
- `api` (Global API operations)
- `admin` (Platform super-admin)

Store-specific API routes (e.g., `/api/products`) are protected by a `requireStore` middleware, which guarantees that platform domains cannot arbitrarily read or mutate storefront data.

## Caching Strategy
An in-memory LRU Cache (`lru-cache`) is utilized in the Node.js process:
- **Max Items:** 1000 hostnames
- **TTL:** 5 minutes
- **Negative Caching:** Unknown hostnames are immediately cached with a `null` value. This is critical to prevent database connection exhaustion during brute-force sub-domain enumeration or DDoS attacks.

## DNS & Nginx Configuration

### Hostinger DNS vs TLS Certificates
It is critical to distinguish between DNS wildcards and TLS (SSL) wildcards.

1. **DNS Wildcard**: 
   - Add an A Record: `*` -> `[VPS IP]` in Hostinger.
   - Add an A Record: `@` -> `[VPS IP]` in Hostinger.
   - This ensures any subdomain (e.g., `store1.yourplatform.com`) routes to the VPS.

2. **TLS Wildcard Certificate**: 
   - A DNS wildcard does NOT automatically secure the subdomains with HTTPS. 
   - You must obtain a **Wildcard SSL Certificate** (`*.yourplatform.com`).
   - Using Let's Encrypt / Certbot, a wildcard certificate *requires* a **DNS-01 ACME challenge**. You cannot use the standard HTTP-01 challenge for wildcards.
   - Certbot must verify ownership by creating a TXT record in Hostinger. You will need to use a Certbot DNS plugin (or run it manually/via API script for Hostinger) to automatically provision and renew the wildcard certificate.

### Nginx Configuration (Conceptual)
Nginx handles SSL termination and forwards traffic natively:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name .yourplatform.com; # Matches all subdomains and root

    ssl_certificate /etc/letsencrypt/live/yourplatform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourplatform.com/privkey.pem;

    location /api {
        proxy_pass http://platform_backend:3001; # Uses internal Docker network DNS
        # Overwrite any spoofed forwarded hosts with the actual requested Host
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host; 
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://platform_frontend:5173; # Frontend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Custom Domains (Future)
When a merchant purchases `mystore.com`, they simply create an A Record pointing to the VPS IP. Nginx natively passes `Host: mystore.com` to the Node.js backend. The Node.js `storeResolver` searches the `domains` (or `stores`) table for `mystore.com`, finds the exact same `store_id`, and serves the exact same application. No server configuration changes are required.

## Tests Performed
The backend routing logic was verified locally using the same proxy headers Nginx will inject:
- `store-a.yourplatform.com` -> Correctly returned Store A's JSON context.
- `store-b.yourplatform.com` -> Correctly returned Store B's JSON context.
- `unknown.yourplatform.com` -> Safely rejected with `404 STORE_NOT_FOUND` (no auto-creation).
- `www.yourplatform.com` -> Safely bypassed store lookup and was rejected by the `requireStore` middleware with `400 STORE_REQUIRED`.
- `X-Store-Host` spoofing -> Completely ineffective as the backend only parses `req.hostname`.
- `X-Forwarded-Host` spoofing -> Ineffective from external clients because Nginx explicitly overwrites `X-Forwarded-Host $host;` before proxying to the backend.
- Backend Port Isolation -> The Node.js container (`platform_backend`) maps no ports to the host machine in `docker-compose.yml`. It is exclusively accessible via Nginx over the internal Docker bridge network (`172.28.0.0/16`), fulfilling the proxy trust requirement securely.

## Rollback Procedure
If the hostname resolution architecture causes outages:
1. Ensure the `PLATFORM_DOMAIN` environment variable exactly matches your Hostinger domain.
2. Revert `trust proxy` in `index.ts` if running in an obscure network topology.
3. Restart the Node.js backend Docker container/PM2 process.
