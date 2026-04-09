# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/validators/package.json packages/validators/
COPY apps/api/package.json apps/api/
RUN bun install --frozen-lockfile --production

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.2 AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN cd apps/api && bun build src/index.ts --target=bun --outdir=./dist

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM oven/bun:1.2-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bun

COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/package.json ./

USER bun
EXPOSE 3000

# Note: BullMQ/FCM workers require Node.js runtime — deploy as a separate
# Node.js worker service. The API enqueues jobs via Redis.
CMD ["bun", "run", "dist/index.js"]
