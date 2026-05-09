# Bocao.app

AI-powered operating system for restaurants: WhatsApp, reservations, kitchen ops, and analytics in one place. Product brief: [`docs/briefing-materials.md`](docs/briefing-materials.md). Task list: [`TODO.md`](TODO.md).

## Stack

- **Runtime / package manager:** [Bun](https://bun.sh)
- **App:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn-style UI (`src/components/ui/`)
- **Database:** PostgreSQL, Prisma ORM (`prisma/schema.prisma`)
- **Auth:** NextAuth.js v5 beta (`next-auth@beta`, Auth.js)

## Prerequisites

- [Bun](https://bun.sh/docs/installation) 1.3+ (see `packageManager` in `package.json`)
- A PostgreSQL database and its connection string (`DATABASE_URL`)

## Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set **`DATABASE_URL`** to your Postgres URL (any host: Neon, Supabase, Railway, local `psql`, etc.). Add other keys when you wire integrations.

3. **Migrations**

   ```bash
   bun run db:migrate
   ```

   On a fresh database, this applies all SQL in `prisma/migrations/`.

   For Prisma CLI with the Bun runtime (if you hit Node-related issues), use: `bunx --bun prisma migrate dev`.

4. **Dev server**

   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `bun dev`             | Next.js dev server (`next dev`)                        |
| `bun run build`       | `prisma generate` + production build                   |
| `bun run lint`        | ESLint                                                 |
| `bun run db:migrate`  | Create/apply dev migrations (`prisma migrate dev`)     |
| `bun run db:push`     | Push schema without migration files (prototyping only) |
| `bun run db:studio`   | Prisma Studio                                          |
| `bun run db:generate` | Regenerate Prisma Client                               |

## Health check

`GET /api/health` returns JSON with `database: "up"` | `"down"` (uses `SELECT 1`).

## License

Private — not licensed for public use unless stated otherwise.
