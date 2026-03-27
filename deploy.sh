#!/bin/bash
# ==============================================================
# Court Reservation - Ubuntu VPS Deployment Script
# ==============================================================
# First-time setup:  bash deploy.sh --setup
# Normal deploy:     bash deploy.sh
# ==============================================================

set -e  # Exit on any error

APP_DIR="/root/Court-Reservation.Nextjs"
REPO_URL="https://github.com/cholo302/Court-Reservation.Nextjs.git"

echo "================================================"
echo "  Court Reservation - Deployment Script"
echo "================================================"

# ── First-time setup ──────────────────────────────
if [ "$1" == "--setup" ]; then
  echo "[1/7] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs

  echo "[2/7] Installing PM2 globally..."
  npm install -g pm2

  echo "[3/7] Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"

  echo "[4/7] Creating .env from template..."
  if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
    # Auto-generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    sed -i "s|REPLACE_WITH_OUTPUT_OF: openssl rand -base64 32|$SECRET|g" "$APP_DIR/.env"
    echo ""
    echo "⚠️  .env created with auto-generated NEXTAUTH_SECRET."
    echo "⚠️  Edit $APP_DIR/.env and set:"
    echo "     NEXTAUTH_URL=http://YOUR_SERVER_IP_OR_DOMAIN:3000"
    echo "     (and any other values you need)"
    echo ""
  else
    echo "✅ .env already exists, skipping."
  fi

  echo "[5/7] Installing dependencies..."
  npm install --production=false

  echo "[6/7] Generating Prisma client & pushing DB schema..."
  npx prisma generate
  npx prisma db push

  echo "[7/7] Building Next.js..."
  npm run build

  echo "[8/8] Starting app with PM2..."
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup

  echo ""
  echo "✅ First-time setup complete!"
  echo "   App running at: http://$(curl -s ifconfig.me):3000"
  exit 0
fi

# ── Normal deploy (pull + rebuild + restart) ──────
cd "$APP_DIR"

echo "[1/5] Pulling latest code from GitHub..."
git pull origin main

echo "[2/5] Installing any new dependencies..."
npm install --production=false

echo "[3/5] Generating Prisma client..."
npx prisma generate

echo "[4/5] Pushing DB schema changes..."
npx prisma db push

echo "[5/5] Building Next.js..."
npm run build

echo "Restarting app with PM2..."
pm2 reload ecosystem.config.js --update-env

echo ""
echo "✅ Deployment complete!"
pm2 status
