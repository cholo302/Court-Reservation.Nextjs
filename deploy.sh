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
DB_PATH="$APP_DIR/prisma/court_reservation.sqlite"

echo "================================================"
echo "  Court Reservation - Deployment Script"
echo "================================================"

# ── First-time setup ──────────────────────────────
if [ "$1" == "--setup" ]; then
  echo "[1/8] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs

  echo "[2/8] Installing PM2 globally..."
  npm install -g pm2

  echo "[3/8] Cloning repository..."
  if [ -d "$APP_DIR" ]; then
    echo "  Directory already exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
  else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
  fi

  echo "[4/8] Creating .env from template..."
  if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
    # Auto-generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    sed -i "s|REPLACE_WITH_OUTPUT_OF: openssl rand -base64 32|$SECRET|g" "$APP_DIR/.env"
    # Set NEXTAUTH_URL to server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    sed -i "s|YOUR_SERVER_IP_OR_DOMAIN|$SERVER_IP|g" "$APP_DIR/.env"
    echo ""
    echo "⚠️  .env created with auto-generated NEXTAUTH_SECRET."
    echo "⚠️  NEXTAUTH_URL set to: http://$SERVER_IP:3000"
    echo "⚠️  Edit $APP_DIR/.env if you need to change anything."
    echo ""
  else
    echo "✅ .env already exists, skipping."
  fi

  echo "[5/8] Installing dependencies..."
  npm install --production=false

  echo "[6/8] Generating Prisma client & creating database..."
  npx prisma generate
  DATABASE_URL="file:$DB_PATH" npx prisma db push
  
  # Verify database was created
  if [ -f "$DB_PATH" ]; then
    echo "✅ Database created at: $DB_PATH"
  else
    echo "❌ Database file not found at: $DB_PATH"
  fi

  echo "[7/8] Seeding admin user..."
  DATABASE_URL="file:$DB_PATH" node scripts/seed-admin.js || echo "⚠️  Admin seeding failed (may already exist)"

  # Ensure upload directories exist
  mkdir -p "$APP_DIR/public/uploads/proofs"
  mkdir -p "$APP_DIR/public/uploads/users"
  mkdir -p "$APP_DIR/public/uploads/qrcodes"
  mkdir -p "$APP_DIR/public/uploads/courts"

  echo "[8/8] Building Next.js..."
  npm run build

  echo "Starting app with PM2..."
  pm2 kill 2>/dev/null || true
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 1
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup

  echo ""
  echo "✅ First-time setup complete!"
  echo "   App running at: http://$(curl -s ifconfig.me):3000"
  echo "   Admin login: admin@court.com / admin123"
  exit 0
fi

# ── Normal deploy (pull + rebuild + restart) ──────
cd "$APP_DIR"

echo "[1/6] Pulling latest code from GitHub..."
git pull origin main

# Ensure .env exists with at minimum DATABASE_URL
if [ ! -f "$APP_DIR/.env" ]; then
  echo "⚠️  No .env file found! Creating from template..."
  cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
  SECRET=$(openssl rand -base64 32)
  sed -i "s|REPLACE_WITH_OUTPUT_OF: openssl rand -base64 32|$SECRET|g" "$APP_DIR/.env"
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
  sed -i "s|YOUR_SERVER_IP_OR_DOMAIN|$SERVER_IP|g" "$APP_DIR/.env"
  echo "✅ .env created. Edit it if needed: nano $APP_DIR/.env"
fi

# Ensure DATABASE_URL exists in .env
if ! grep -q "^DATABASE_URL" "$APP_DIR/.env"; then
  echo 'DATABASE_URL="file:./court_reservation.sqlite"' >> "$APP_DIR/.env"
  echo "✅ Added DATABASE_URL to .env"
fi

# Ensure NEXTAUTH_SECRET exists in .env
if ! grep -q "^NEXTAUTH_SECRET" "$APP_DIR/.env"; then
  SECRET=$(openssl rand -base64 32)
  echo "NEXTAUTH_SECRET=\"$SECRET\"" >> "$APP_DIR/.env"
  echo "✅ Added NEXTAUTH_SECRET to .env"
fi

echo "[2/6] Installing any new dependencies..."
npm install --production=false

echo "[3/6] Generating Prisma client..."
npx prisma generate

echo "[4/6] Pushing DB schema changes..."
DATABASE_URL="file:$DB_PATH" npx prisma db push

# Verify database exists
if [ ! -f "$DB_PATH" ]; then
  echo "⚠️  Database not found after db push, this shouldn't happen..."
fi

echo "[5/6] Cleaning old build cache..."
rm -rf "$APP_DIR/.next"

# Ensure upload directories exist
mkdir -p "$APP_DIR/public/uploads/proofs"
mkdir -p "$APP_DIR/public/uploads/users"
mkdir -p "$APP_DIR/public/uploads/qrcodes"
mkdir -p "$APP_DIR/public/uploads/courts"

echo "[6/6] Building Next.js..."
npm run build

echo "Restarting app with PM2..."
pm2 kill 2>/dev/null || true
# Kill anything on port 3000
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Deployment complete!"
pm2 status
