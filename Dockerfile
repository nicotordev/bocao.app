# ============================================================================
# Stage 1: Builder
# ============================================================================

FROM oven/bun:1 AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Dependencies first for layer caching
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# Application files
COPY tsconfig.json ./
COPY next.config.* ./
COPY components.json ./
COPY prisma.config.ts ./

COPY prisma ./prisma
COPY public ./public
COPY src ./src

# Build env
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Dummy value required only for prisma generate during build
ENV DATABASE_URL="postgresql://user:password@localhost:5432/bocao?schema=public"

# Debug (remove later if desired)
RUN bun pm ls tw-animate-css
RUN bun pm ls shadcn

# Prisma
RUN bunx prisma generate

# Next.js standalone build
RUN bun run build

# Verify standalone exists
RUN test -f .next/standalone/server.js


# ============================================================================
# Stage 2: Runtime
# ============================================================================

FROM oven/bun:1 AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 bocao

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output
COPY --from=builder --chown=bocao:bocao /build/.next/standalone ./

# Static assets
COPY --from=builder --chown=bocao:bocao /build/.next/static ./.next/static
COPY --from=builder --chown=bocao:bocao /build/public ./public

# Prisma schema (optional but useful for scripts/migrations)
COPY --from=builder --chown=bocao:bocao /build/prisma ./prisma

USER bocao

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "server.js"]