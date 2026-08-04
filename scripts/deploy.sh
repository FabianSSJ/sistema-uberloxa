#!/usr/bin/env bash
set -euo pipefail

cd /opt/uberloxa/app

echo "==> Actualizando código (main)"
git fetch origin main
git reset --hard origin/main

echo "==> Instalando dependencias"
corepack enable
pnpm install --frozen-lockfile

echo "==> Backend: generate, migrate, build"
cd apps/backend
rm -f tsconfig.tsbuildinfo tsconfig.build.tsbuildinfo
npx prisma generate
npx prisma migrate deploy
npx nest build

echo "==> Frontend: build"
cd ../frontend
VITE_API_URL=https://uberloxa.org/api npx vite build

echo "==> Reiniciando backend (PM2)"
pm2 restart uberloxa-backend

echo "==> Deploy OK: $(cd /opt/uberloxa/app && git rev-parse --short HEAD)"
