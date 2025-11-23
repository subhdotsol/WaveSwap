FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bun run db:generate

# Development stage
FROM base AS development
COPY . .
RUN bun run db:migrate || true # Allow migration to fail if already applied
CMD ["bun", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN bun run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create non-root user directories
RUN mkdir -p /app/.prisma && chown -R backend:nodejs /app

USER backend

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]