#!/usr/bin/env bash
# setup.sh — run ONCE on a fresh Ubuntu 22.04 VPS to bootstrap everything
# Usage:  sudo bash infra/setup.sh
# Assumes: you have cloned the repo to /var/www/saas already
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash infra/setup.sh"

DEPLOY_USER="${SUDO_USER:-ubuntu}"
APP_DIR="/var/www/saas"
LOG_DIR="/var/log/saas"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  VPS Bootstrap — $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Deploy user: $DEPLOY_USER"
echo "  App dir:     $APP_DIR"
echo "═══════════════════════════════════════════════════"

# ── 1. System packages ────────────────────────────────────────────────────────
echo ""
echo "→ Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl git gnupg2 ufw \
    nginx certbot python3-certbot-nginx \
    redis-server \
    ca-certificates lsb-release wget
ok "System packages installed"

# ── 2. PostgreSQL 16 ─────────────────────────────────────────────────────────
echo ""
echo "→ Installing PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list
    apt-get update -qq
    apt-get install -y -qq postgresql-16 postgresql-client-16
fi
systemctl start postgresql
systemctl enable postgresql
ok "PostgreSQL 16 running"

# ── 3. Redis ─────────────────────────────────────────────────────────────────
echo ""
echo "→ Configuring Redis..."
REDIS_CONF="/etc/redis/redis.conf"
sed -i 's/^appendonly no/appendonly yes/'            "$REDIS_CONF" || true
# Remove any existing maxmemory/policy lines then append clean ones
sed -i '/^maxmemory/d' "$REDIS_CONF"
sed -i '/^maxmemory-policy/d' "$REDIS_CONF"
cat >> "$REDIS_CONF" << 'REDISEOF'
maxmemory 256mb
maxmemory-policy allkeys-lru
REDISEOF
systemctl restart redis
systemctl enable redis
redis-cli ping | grep -q PONG && ok "Redis running" || die "Redis ping failed"

# ── 4. Bun ───────────────────────────────────────────────────────────────────
echo ""
echo "→ Installing Bun for $DEPLOY_USER..."
if ! sudo -u "$DEPLOY_USER" bash -c 'command -v bun &>/dev/null'; then
    sudo -u "$DEPLOY_USER" bash -c 'curl -fsSL https://bun.sh/install | bash'
fi
BUN_BIN="/home/$DEPLOY_USER/.bun/bin/bun"
[[ -f "$BUN_BIN" ]] || BUN_BIN="/root/.bun/bin/bun"
ok "Bun installed: $($BUN_BIN --version)"

# ── 5. Node.js (LTS) + PM2 ───────────────────────────────────────────────────
echo ""
echo "→ Installing Node.js LTS and PM2..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y -qq nodejs
fi
npm install -g pm2 --quiet
ok "PM2 $(pm2 --version) installed"

# ── 6. Firewall ───────────────────────────────────────────────────────────────
echo ""
echo "→ Configuring UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw deny 5432    # Postgres — internal only
ufw deny 6379    # Redis — internal only
ufw --force enable
ok "Firewall enabled"
ufw status

# ── 7. Log directory ─────────────────────────────────────────────────────────
echo ""
echo "→ Creating log directory..."
mkdir -p "$LOG_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$LOG_DIR"
ok "Log dir: $LOG_DIR"

# ── 8. App directory ownership ───────────────────────────────────────────────
echo ""
echo "→ Setting ownership of $APP_DIR..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
ok "Ownership set"

# ── 9. Nginx site ────────────────────────────────────────────────────────────
echo ""
echo "→ Installing Nginx site config..."
cp "$APP_DIR/infra/nginx/saas.conf" /etc/nginx/sites-available/saas
ln -sf /etc/nginx/sites-available/saas /etc/nginx/sites-enabled/saas
rm -f /etc/nginx/sites-enabled/default
nginx -t || die "Nginx config test failed — edit infra/nginx/saas.conf"
systemctl reload nginx
systemctl enable nginx
ok "Nginx configured"

# ── Done — manual steps remaining ────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
ok "Bootstrap complete"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  MANUAL STEPS REMAINING (see DEPLOY_TODO.md):"
echo "  1. Create Postgres user/database"
echo "  2. Fill in /var/www/saas/.env"
echo "  3. Obtain SSL wildcard certificate"
echo "  4. Run: sudo -u $DEPLOY_USER bash infra/first-deploy.sh"
echo ""
