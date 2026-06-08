# Bocao.app

Bocao.app is an AI-assisted operating system for restaurants: dashboard, order operations, WhatsApp workflows, reservations, kitchen views, customer data, marketing, and analytics in one product.

- Product brief: [docs/en/briefing-materials.md](docs/en/briefing-materials.md)
- Roadmap and task list: [TODO.md](TODO.md)
- Agent instructions: [AGENTS.md](AGENTS.md)
- i18n guide: [docs/en/internationalization.md](docs/en/internationalization.md)

## Stack

| Area | Technology |
| --- | --- |
| Runtime / packages | Bun 1.3.x |
| Framework | Next.js 16 App Router, Turbopack |
| UI | React 19, TypeScript, Tailwind CSS v4, shadcn-style primitives |
| Data | PostgreSQL, Prisma 7 |
| Auth | Better Auth, Prisma adapter, email/password, magic link, email OTP |
| State / data fetching | TanStack Query |
| i18n | next-intl with cookie-based locale persistence |
| Email | React Email, Resend |
| Notifications | Sonner |

## Requirements

- Bun 1.3+ (`packageManager` in `package.json` is authoritative)
- PostgreSQL
- A configured `.env` file

## Quick Start

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create local environment variables:

   ```bash
   cp .env.example .env
   ```

   At minimum, set:

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/bocao?schema=public"
   BETTER_AUTH_SECRET="..."
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   Generate a Better Auth secret with:

   ```bash
   bunx auth@latest secret
   ```

3. Apply database migrations:

   ```bash
   bun run db:migrate
   ```

4. Seed local data when needed:

   ```bash
   bun run db:seed
   ```

5. Start the dev server:

   ```bash
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `bun dev` | Start the Next.js dev server |
| `bun run build` | Generate Prisma client and build for production |
| `bun start` | Start the production server after a build |
| `bun run lint` | Run ESLint |
| `bunx tsc --noEmit` | Run TypeScript type checking |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Create/apply development migrations |
| `bun run db:push` | Push schema without migration files; use only for prototyping |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:seed` | Run `prisma/seed.ts` |
| `bun run auth:generate` | Run Better Auth generation |

## Environment

`.env.example` documents the expected variables. Current important groups:

- `DATABASE_URL`: PostgreSQL connection string.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: Better Auth runtime config.
- `NEXT_PUBLIC_APP_URL`: public app URL for browser-facing code.
- `RESEND_API_KEY`, `EMAIL_FROM`: email delivery.
- `OPENAI_API_KEY`: AI features.
- `WHATSAPP_*`: Meta WhatsApp Cloud API integration.
- `STRIPE_*`: billing integration.
- `REDIS_URL`: future queue/cache work.

Do not commit `.env`.

## Project Structure

```txt
src/
  app/                    App Router routes, layouts, providers, actions, APIs
  components/
    ui/                   Shared shadcn-style primitives
    dashboard/            Dashboard shell and feature UI
    dashboard/orders/     Orders table, filters, kanban, timeline, drawer
    auth/                 Authentication UI
    onboarding/           Restaurant onboarding UI
  emails/                 React Email templates
  generated/prisma/       Generated Prisma client
  hooks/                  Shared React hooks
  i18n/                   Locale config and message catalogs
  lib/
    dashboard/            Dashboard context/session assembly
    orders/               Order data, filters, repository, schemas
    query/                TanStack Query API/query/mutation helpers
    rbac/                 Permission catalog and role definitions
  middleware/             Request helpers such as locale resolution
  providers/              Client providers
prisma/
  schema.prisma           Database schema
  seed.ts                 Seed script
public/
  sounds/                 UI sound effects served from /sounds/*
```

## Database

Prisma 7 is configured through [prisma.config.ts](prisma.config.ts). The datasource URL comes from `DATABASE_URL`.

The Prisma client generator writes to `src/generated/prisma`. Prefer importing database access through existing local wrappers such as `src/lib/prisma.ts` rather than importing generated modules directly in feature code.

Useful commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:studio
```

## Auth And Access

Authentication is configured in [src/lib/auth.ts](src/lib/auth.ts) with Better Auth:

- email/password
- email verification
- magic link
- email OTP
- Prisma adapter

Dashboard access is scoped through organization membership, roles, and permissions. Permission/navigation helpers live in `src/lib/rbac`, `src/lib/permissions.ts`, and `src/lib/navigation.ts`.

## Internationalization

Bocao uses `next-intl` with cookie-based locale persistence. URLs are not locale-prefixed.

- Supported locales: `src/i18n/locales.ts`
- Request config: `src/i18n/request.ts`
- Messages: `src/i18n/messages/en.json`, `src/i18n/messages/es.json`
- Detailed guide: [docs/en/internationalization.md](docs/en/internationalization.md)

When adding copy, keep English and Spanish message files structurally aligned. ICU placeholders must be formatted with values, e.g. `t("activeCount", {count})`.

## Static Assets

Files in `public/` are served from the root path. For example:

```txt
public/sounds/button.wav -> /sounds/button.wav
```

UI sounds are wired through `src/lib/ui-sounds.ts` and `src/providers/ui-sound-provider.tsx`.

## Health Check

`GET /api/health` returns JSON with database status:

```json
{
  "ok": true,
  "database": "up"
}
```

## Development Notes

- Next.js 16 has breaking changes. Before changing framework behavior, read the relevant installed docs in `node_modules/next/dist/docs/`.
- Server Components are the default. Use Client Components only for state, effects, browser APIs, or event handlers.
- Props crossing from Server Components to Client Components must be serializable.
- This repository may have local uncommitted work. Check `git status --short` before editing and avoid reverting unrelated changes.

## Troubleshooting

### Prisma client is missing or stale

Run:

```bash
bun run db:generate
```

### Prisma migration has runtime issues

Use Bun explicitly:

```bash
bunx --bun prisma migrate dev
```

### Better Auth complains about missing config

Check:

```bash
BETTER_AUTH_SECRET
BETTER_AUTH_URL
DATABASE_URL
```

### Lint fails in unrelated files

Fix the reported files if they are part of your change. Otherwise, report the existing failures and keep your change scoped.

## License

Private. Not licensed for public use unless stated otherwise.
