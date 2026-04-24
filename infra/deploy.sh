#!/usr/bin/env bash
# deploy.sh — zero-downtime redeploy for the VPS
# Usage:  bash infra/deploy.sh
# Run from: /var/www/saas (the monorepo root)
set -euo pipefail

APP_DIR="/var/www/saas"
LOG_DIR="/var/log/saas"
NGINX_CONF="/etc/nginx/sites-available/saas"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

# ── Guards ────────────────────────────────────────────────────────────────────
[[ -f "$APP_DIR/.env" ]]         || die ".env not found at $APP_DIR/.env — aborting"
[[ -f "$APP_DIR/bun.lockb" ]]    || die "Run from the monorepo root: $APP_DIR"
command -v bun   &>/dev/null     || die "bun not found in PATH"
command -v pm2   &>/dev/null     || die "pm2 not found — install with: npm i -g pm2"
command -v nginx &>/dev/null     || die "nginx not found"

mkdir -p "$LOG_DIR"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Deploying SaaS @ $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
echo ""
echo "→ Pulling latest code..."
cd "$APP_DIR"
git pull --ff-only
ok "Code updated  ($(git rev-parse --short HEAD))"

# ── 2. Install / sync dependencies ───────────────────────────────────────────
echo ""
echo "→ Installing dependencies..."
bun install --frozen-lockfile
ok "Dependencies synced"

# ── 3. Run Drizzle migrations ─────────────────────────────────────────────────
echo ""
echo "→ Running database migrations..."
bunx drizzle-kit migrate
ok "Migrations applied"

# ── 4. Build frontend ─────────────────────────────────────────────────────────
echo ""
echo "→ Building frontend..."
bun run --filter './apps/web' build
ok "Frontend built  → apps/web/dist"

# ── 5. Reload Nginx (pick up any config changes) ──────────────────────────────
echo ""
echo "→ Testing Nginx config..."
sudo nginx -t || die "Nginx config test failed — fix before reloading"
sudo systemctl reload nginx
ok "Nginx reloaded"

# ── 6. Restart API via PM2 ───────────────────────────────────────────────────
echo ""
echo "→ Restarting API..."
if pm2 list | grep -q "saas-api"; then
    pm2 restart infra/pm2.config.cjs --update-env
else
    pm2 start infra/pm2.config.cjs
fi
pm2 save
ok "API restarted"

# ── 7. Wait and verify API is healthy ────────────────────────────────────────
echo ""
echo "→ Waiting for API to come up..."
for i in $(seq 1 12); do
    if curl -sf http://127.0.0.1:3000/health &>/dev/null; then
        ok "API health check passed"
        break
    fi
    if [[ $i -eq 12 ]]; then
        die "API did not respond after 12 attempts — check: pm2 logs saas-api"
    fi
    sleep 2
done

# ── 8. Verify DB and Redis health ────────────────────────────────────────────
echo ""
echo "→ Checking DB health..."
curl -sf http://127.0.0.1:3000/health/db | grep -q '"status":"ok"' \
    && ok "Database reachable" \
    || warn "Database health check returned non-ok — check /health/db"

echo "→ Checking Redis health..."
curl -sf http://127.0.0.1:3000/health/redis | grep -q '"status":"ok"' \
    && ok "Redis reachable" \
    || warn "Redis health check returned non-ok — check /health/redis"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
ok "Deploy complete at $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Useful commands:"
echo "    pm2 logs saas-api --lines 50"
echo "    pm2 status"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
