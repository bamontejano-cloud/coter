#!/bin/sh
set -e

echo "Running prisma db push..."
npx prisma db push --schema=./apps/api/prisma/schema.prisma --accept-data-loss

echo "Starting API server..."
node apps/api/dist/server.js
