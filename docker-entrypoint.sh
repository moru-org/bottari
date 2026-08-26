#!/bin/sh
set -e

echo "[BOTTARI] Initializing database schema..."
npx prisma db push --skip-generate

echo "[BOTTARI] Seeding initial templates..."
npx tsx prisma/seed.ts || true

echo "[BOTTARI] Starting Next.js standalone server on port ${PORT:-3000}..."
exec node server.js
