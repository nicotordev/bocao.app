FROM oven/bun:1 AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY prisma.config.ts ./
COPY prisma ./prisma

ENV DATABASE_URL="postgresql://user:password@localhost:5432/bocao?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEFAULT_TIMEZONE
ARG BETTER_AUTH_URL

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY next.config.* ./
COPY postcss.config.mjs ./
COPY components.json ./
COPY public ./public
COPY src ./src

ENV NODE_ENV=production

RUN bun run build
RUN test -f .next/standalone/server.js


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

COPY --from=builder --chown=bocao:bocao /build/.next/standalone ./
COPY --from=builder --chown=bocao:bocao /build/.next/static ./.next/static
COPY --from=builder --chown=bocao:bocao /build/public ./public
COPY --from=builder --chown=bocao:bocao /build/prisma ./prisma

USER bocao

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["bun", "server.js"]
