#!/bin/sh
set -e

cd /app/apps/backend

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  pnpm exec prisma migrate deploy --schema prisma/schema.prisma
fi

exec "$@"
