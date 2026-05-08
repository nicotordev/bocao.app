# Bocao.app

AI-powered operating system for restaurants: WhatsApp, reservations, kitchen ops, and analytics in one place. Product brief: [`docs/briefing-materials.md`](docs/briefing-materials.md). Task list: [`TODO.md`](TODO.md).

## Stack

- **App:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn-style UI (`src/components/ui/`)
- **Database:** PostgreSQL, Prisma ORM (`prisma/schema.prisma`)

## Prerequisites

- Node.js 20+
- A PostgreSQL database and its connection string (`DATABASE_URL`)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set **`DATABASE_URL`** to your Postgres URL (any host: Neon, Supabase, Railway, local `psql`, etc.). Add other keys when you wire integrations.

3. **Migrations**

   ```bash
   npm run db:migrate
   ```

   On a fresh database, this applies all SQL in `prisma/migrations/`.

4. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Next.js dev server                                     |
| `npm run build`       | `prisma generate` + production build                   |
| `npm run lint`        | ESLint                                                 |
| `npm run db:migrate`  | Create/apply dev migrations (`prisma migrate dev`)     |
| `npm run db:push`     | Push schema without migration files (prototyping only) |
| `npm run db:studio`   | Prisma Studio                                          |
| `npm run db:generate` | Regenerate Prisma Client                               |

## Health check

`GET /api/health` returns JSON with `database: "up"` | `"down"` (uses `SELECT 1`).

## License

Private — not licensed for public use unless stated otherwise.
