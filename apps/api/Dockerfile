FROM node:20-alpine AS builder

WORKDIR /repo

# Copy workspace root files
COPY ../../package.json ../../package-lock.json ./
COPY ../../tsconfig.json ./
COPY ../../packages/ ./packages/

# Copy API app
COPY . ./apps/api/

# Install all workspace dependencies
RUN npm ci

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build TypeScript
RUN cd apps/api && npm run build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma
COPY --from=builder /repo/apps/api/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
