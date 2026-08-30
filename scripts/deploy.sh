#!/usr/bin/env bash
set -euo pipefail

cd /opt/uberloxa/app

echo "==> Actualizando código (main)"
git fetch origin main
git reset --hard origin/main

echo "==> Instalando dependencias"
corepack enable
pnpm install --frozen-lockfile

echo "==> Creando backup preventivo de la base de datos..."
mkdir -p /opt/uberloxa/backups
BACKUP_FILE="/opt/uberloxa/backups/backup_$(date +%Y%m%d_%H%M%S).sql"

if docker ps --format '{{.Names}}' | grep -q "^uberloxa_db$"; then
  docker exec uberloxa_db pg_dump -U uberloxa uberloxa_db > "$BACKUP_FILE" || true
  if [ -s "$BACKUP_FILE" ]; then
    echo "✅ Backup preventivo creado: $BACKUP_FILE"
    # Rotar backups para conservar los últimos 20
    ls -t /opt/uberloxa/backups/backup_*.sql 2>/dev/null | tail -n +21 | xargs -r rm -f || true
  else
    echo "⚠️ No se pudo generar backup automático o base vacía, continuando..."
  fi
fi

echo "==> Backend: generate, migrate, build"
cd apps/backend
rm -f tsconfig.tsbuildinfo tsconfig.build.tsbuildinfo
npx prisma generate
npx prisma migrate deploy
npx nest build

echo "==> Frontend: build"
cd ../frontend
VITE_API_URL=https://uberloxa.org/api npx vite build

echo "==> Recargando backend (PM2 Zero-Downtime)"
pm2 reload uberloxa-backend --update-env || pm2 restart uberloxa-backend

echo "==> Deploy OK: $(cd /opt/uberloxa/app && git rev-parse --short HEAD)"
