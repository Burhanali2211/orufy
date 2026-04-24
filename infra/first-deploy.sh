#!/usr/bin/env bash
# first-deploy.sh — run ONCE after setup.sh to install deps, migrate, and start
# Usage (as deploy user, NOT root):  bash infra/first-deploy.sh
# Requires .env to be filled in first
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

APP_DIR="/var/www/saas"
cd "$APP_DIR"

[[ -f ".env" ]] || die ".env missing — copy .env.example and fill in all values"

# Source bun into PATH
export PATH="$HOME/.bun/bin:$PATH"
command -v bun &>/dev/null || die "bun not in PATH — run: source ~/.bashrc"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  First Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════"

echo ""
echo "→ Installing dependencies..."
bun install --frozen-lockfile
ok "Dependencies installed"

echo ""
echo "→ Generating Drizzle migrations (if any pending schema)..."
bunx drizzle-kit generate
ok "Migration files generated"

echo ""
echo "→ Applying migrations to database..."
bunx drizzle-kit migrate
ok "Migrations applied"

echo ""
echo "→ Verifying tables..."
# Pull DATABASE_URL from .env
DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-)
TABLE_COUNT=$(psql "$DB_URL" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
TABLE_COUNT=$(echo "$TABLE_COUNT" | tr -d ' ')
[[ "$TABLE_COUNT" -ge 10 ]] \
    && ok "Database has $TABLE_COUNT tables" \
    || warn "Only $TABLE_COUNT tables found — check migration output"

echo ""
echo "→ Building frontend..."
bun run --filter './apps/web' build
ok "Frontend built"

echo ""
echo "→ Starting API with PM2..."
pm2 start infra/pm2.config.cjs
pm2 save

echo ""
echo "→ Setting up PM2 startup hook..."
# pm2 startup prints a command — capture and run it
STARTUP_CMD=$(pm2 startup | grep 'sudo env' | tail -1)
if [[ -n "$STARTUP_CMD" ]]; then
    eval "$STARTUP_CMD"
    ok "PM2 startup hook installed"
else
    warn "Could not auto-install PM2 startup hook — run 'pm2 startup' manually"
fi

echo ""
echo "→ Waiting for API..."
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:3000/health &>/dev/null; then
        ok "API healthy"
        break
    fi
    [[ $i -eq 15 ]] && die "API not responding — check: pm2 logs saas-api"
    sleep 2
done

echo ""
echo "═══════════════════════════════════════════════════"
ok "First deploy complete"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Health endpoints:"
echo "    curl http://127.0.0.1:3000/health"
echo "    curl http://127.0.0.1:3000/health/db"
echo "    curl http://127.0.0.1:3000/health/redis"
echo ""
echo "  For future deploys, use:  bash infra/deploy.sh"
echo ""
