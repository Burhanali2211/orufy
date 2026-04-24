# Production Deploy — Manual Steps

Everything in `infra/` that can run automatically is scripted.
These items cannot be automated — they need credentials, DNS access, or
interactive confirmation that only you have.

Work through these in order. Each step has an exact command.

---

## Step 1 — SSH into the VPS

```bash
ssh root@YOUR_VPS_IP
```

---

## Step 2 — Clone the repo

```bash
mkdir -p /var/www/saas
git clone YOUR_REPO_URL /var/www/saas
```

---

## Step 3 — Run the bootstrap script

This installs Postgres 16, Redis, Bun, Node/PM2, UFW, and Nginx.
Takes ~3 minutes on a fresh VPS.

```bash
sudo bash /var/www/saas/infra/setup.sh
```

---

## Step 4 — Create the Postgres database and user

Replace `YOUR_STRONG_PASSWORD` with something from `openssl rand -base64 24`.
Write it down — you'll need it in Step 5.

```bash
sudo -u postgres psql << 'EOF'
CREATE USER saasuser WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE saasdb OWNER saasuser;
GRANT ALL PRIVILEGES ON DATABASE saasdb TO saasuser;
EOF
```

Allow password auth from localhost (needed by Drizzle):

```bash
# Find pg_hba.conf
sudo -u postgres psql -c "SHOW hba_file;"

# Add these two lines ABOVE the existing local/host rules
# (open the file in nano and paste them at the top of the rules block)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add these lines near the top of the connection rules section:
```
local   saasdb   saasuser                   md5
host    saasdb   saasuser   127.0.0.1/32    scram-sha-256
```

```bash
sudo systemctl reload postgresql

# Verify it works (enter YOUR_STRONG_PASSWORD when prompted)
psql -U saasuser -d saasdb -h 127.0.0.1 -c "SELECT version();"
```

---

## Step 5 — Fill in the .env file

```bash
cp /var/www/saas/.env.example /var/www/saas/.env
nano /var/www/saas/.env
```

Fill in every blank value:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | `postgresql://saasuser:YOUR_STRONG_PASSWORD@127.0.0.1:5432/saasdb` |
| `REDIS_URL` | `redis://127.0.0.1:6379` |
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `https://yourdomain.com` |
| `APP_DOMAIN` | `yourdomain.com` |
| `RAZORPAY_KEY_ID` | Razorpay dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same as above |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay dashboard → Webhooks → Secret |
| `RAZORPAY_PLAN_BASIC` | Razorpay dashboard → Subscriptions → Plans |
| `RAZORPAY_PLAN_STANDARD` | Same |
| `RAZORPAY_PLAN_PREMIUM` | Same |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → top-right account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage R2 API Tokens |
| `R2_SECRET_ACCESS_KEY` | Same (shown once at creation) |
| `R2_BUCKET_NAME` | Name of your R2 bucket |
| `R2_PUBLIC_DOMAIN` | e.g. `https://assets.yourdomain.com` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `VITE_API_URL` | `https://yourdomain.com` |
| `VITE_R2_PUBLIC_DOMAIN` | Same as `R2_PUBLIC_DOMAIN` |
| `VITE_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` (safe to expose) |
| `NODE_ENV` | `production` |

---

## Step 6 — Edit saas.conf to put your actual domain

Replace every occurrence of `yourdomain.com` in the Nginx config:

```bash
sudo sed -i 's/yourdomain\.com/YOURACTUALDOMAIN.com/g' \
    /etc/nginx/sites-available/saas
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7 — Get the wildcard SSL certificate

This is interactive — certbot pauses and asks you to add a DNS TXT record.

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  --agree-tos \
  --email YOUR_EMAIL@example.com \
  -d yourdomain.com \
  -d "*.yourdomain.com"
```

When certbot shows:
```
Please deploy a DNS TXT record under the name:
_acme-challenge.yourdomain.com
with the following value: <SOME_TOKEN>
```

1. Go to your domain registrar DNS panel
2. Add a TXT record: name = `_acme-challenge`, value = `<SOME_TOKEN>`
3. Verify it propagated: `dig TXT _acme-challenge.yourdomain.com +short`
4. Only then press Enter in the certbot prompt

After success:
```bash
sudo certbot certificates
# Confirm both yourdomain.com and *.yourdomain.com are listed
```

Enable auto-renewal:
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo certbot renew --dry-run
```

---

## Step 8 — Set up DNS at your registrar

Add these records (replace `YOUR_VPS_IP`):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_VPS_IP` | 300 |
| A | `*` | `YOUR_VPS_IP` | 300 |
| CNAME | `www` | `yourdomain.com` | 300 |

The `*` wildcard A record is critical — it routes every
`shopname.yourdomain.com` subdomain to your server automatically.

Verify propagation (run from your local machine):
```bash
dig A yourdomain.com +short
dig A anything.yourdomain.com +short
# Both should return YOUR_VPS_IP
```

---

## Step 9 — Run the first deploy

```bash
sudo -u $DEPLOY_USER bash /var/www/saas/infra/first-deploy.sh
```

This: installs deps → generates + runs migrations → builds frontend → starts PM2 → installs startup hook.

---

## Step 10 — Verification checklist

Run each command and confirm the expected output:

```bash
# API alive
curl -s https://yourdomain.com/health
# → {"status":"ok","timestamp":...}

# Database reachable
curl -s https://yourdomain.com/health/db
# → {"status":"ok"}

# Redis reachable
curl -s https://yourdomain.com/health/redis
# → {"status":"ok","response":"PONG"}

# Wildcard subdomain routing works
curl -s https://testshop.yourdomain.com/api/shop/products
# → {"error":"Store not found"}   ← correct, no shop with slug 'testshop' yet

# Frontend loads
curl -sI https://yourdomain.com
# → HTTP/2 200

# PM2 stable
pm2 status
# → saas-api | online

# SSL valid for both apex and wildcard
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null \
    | openssl x509 -noout -subject -dates
# → Domains include yourdomain.com and *.yourdomain.com

# Tables exist
psql "postgresql://saasuser:PASSWORD@127.0.0.1:5432/saasdb" -c "\dt"
# → at least 11 tables listed
```

---

## Step 11 — Set up Razorpay webhook

In Razorpay dashboard → Webhooks → Add webhook:
- URL: `https://yourdomain.com/webhooks/razorpay`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET` in .env
- Events to enable:
  - `subscription.activated`
  - `subscription.halted`
  - `subscription.cancelled`
  - `subscription.completed`
  - `payment.captured`
  - `payment.failed`

---

## Step 12 — Set up Cloudflare R2 CORS

In Cloudflare dashboard → R2 → your bucket → Settings → CORS:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "https://*.yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Future deploys

After the initial setup, every subsequent deploy is one command:

```bash
cd /var/www/saas && bash infra/deploy.sh
```

This runs: git pull → bun install → drizzle migrate → build frontend → nginx reload → pm2 restart → health checks.
