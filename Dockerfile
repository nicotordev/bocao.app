# Dockerfile - Production build with Bun + Next.js standalone + Prisma

FROM oven/bun:1 AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY next.config.* ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY public ./public
COPY src ./src

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"

RUN bun install --frozen-lockfile

RUN bunx prisma generate

RUN bun run build


FROM oven/bun:1 AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nextjs /build/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /build/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /build/public ./public
COPY --from=builder --chown=nextjs:nextjs /build/prisma ./prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD bun -e "fetch('http://127.0.0.1:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "server.js"]