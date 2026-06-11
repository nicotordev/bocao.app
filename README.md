# Bocao.app

[![CI](https://github.com/nicotordev/bocao.app/actions/workflows/ci.yml/badge.svg)](https://github.com/nicotordev/bocao.app/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.3+-black?logo=bun)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)

AI-assisted operating system for restaurants — dashboard, order operations, WhatsApp workflows, reservations, kitchen views, customer data, marketing, and analytics in one product.

## Editions

| Edition        | License                                     | Get it                              |
| -------------- | ------------------------------------------- | ----------------------------------- |
| **Community**  | [AGPL-3.0](LICENSE)                         | This repository (free, open source) |
| **Commercial** | [Commercial License](COMMERCIAL-LICENSE.md) | Contact the author                  |

The community edition is free to self-host under AGPL-3.0 terms. The commercial edition is for buyers who need proprietary licensing without copyleft obligations. See the [licensing guide](docs/en/licensing.md) for details.

## Features

- **Multi-tenant dashboard** — organization/restaurant scoping with RBAC
- **Order management** — list, filters, kanban, timeline, detail drawer
- **Kitchen display** — station-based order queue with category labels
- **Reservations & floor plans** — table management and booking flows
- **Menu management** — categories, items, pricing, availability
- **Auth** — Better Auth with email/password, magic link, and OTP
- **i18n** — English and Spanish via `next-intl` (cookie-based, no URL prefixes)
- **Integrations** — WhatsApp Cloud API, Stripe, Resend, OpenAI, R2 storage _(configurable)_

## Stack

| Area                  | Technology                                                     |
| --------------------- | -------------------------------------------------------------- |
| Runtime / packages    | Bun 1.3.x                                                      |
| Framework             | Next.js 16 App Router, Turbopack                               |
| UI                    | React 19, TypeScript, Tailwind CSS v4, shadcn-style primitives |
| Data                  | PostgreSQL, Prisma 7                                           |
| Auth                  | Better Auth, Prisma adapter                                    |
| State / data fetching | TanStack Query                                                 |
| i18n                  | next-intl                                                      |
| Email                 | React Email, Resend                                            |

## Requirements

- [Bun](https://bun.sh) 1.3+ (`packageManager` in `package.json` is authoritative)
- PostgreSQL 14+
- A configured `.env` file (see [`.env.example`](.env.example))

## Quick Start

```bash
git clone git@github.com:nicotordev/bocao.app.git
cd bocao.app
bun install
cp .env.example .env
```

Set at minimum in `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/bocao?schema=public"
BETTER_AUTH_SECRET="..."   # generate: bunx auth@latest secret
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Then:

```bash
bun run db:migrate
bun run db:seed          # optional — seed data
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `bun dev`               | Start the Next.js dev server                           |
| `bun run build`         | Generate Prisma client and build for production        |
| `bun start`             | Start the production server after a build              |
| `bun run lint`          | Run ESLint                                             |
| `bunx tsc --noEmit`     | Run TypeScript type checking                           |
| `bun run db:generate`   | Regenerate Prisma client                               |
| `bun run db:migrate`    | Create/apply development migrations                    |
| `bun run db:push`       | Push schema without migration files (prototyping only) |
| `bun run db:studio`     | Open Prisma Studio                                     |
| `bun run db:seed`       | Run `prisma/seed.ts`                                   |
| `bun run db:seed:demo`  | Run demo seed with admin emails                        |
| `bun run auth:generate` | Run Better Auth generation                             |

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
  i18n/                   Locale config and message catalogs
  lib/
    dashboard/            Dashboard context/session assembly
    orders/               Order data, filters, repository, schemas
    query/                TanStack Query API/query/mutation helpers
    rbac/                 Permission catalog and role definitions
prisma/
  schema.prisma           Database schema
  seed.ts                 Seed script
public/
  sounds/                 UI sound effects served from /sounds/*
```

## Documentation

| Document                                            | Description                                       |
| --------------------------------------------------- | ------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                              | Instructions for AI coding agents                 |
| [CONTRIBUTING.md](.github/CONTRIBUTING.md)          | How to contribute                                 |
| [SECURITY.md](SECURITY.md)                          | Security policy and vulnerability reporting       |
| [Licensing (EN)](docs/en/licensing.md)              | Dual licensing model explained                    |
| [Licenciamiento (ES)](docs/es/licensing.md)         | Modelo de licencia dual                           |
| [i18n guide](docs/en/internationalization.md)       | Internationalization conventions                  |
| [Orders & payments](docs/en/orders-and-payments.md) | Order lifecycle, POS flow, payment abstraction    |
| [Pedidos y pagos](docs/es/pedidos-y-pagos.md)       | Ciclo de pedidos, flujo POS, abstracción de pagos |
| [Product brief](docs/en/briefing-materials.md)      | Product vision and scope                          |
| [TODO.md](TODO.md)                                  | Roadmap and task list                             |

## Environment Variables

`.env.example` documents all expected variables. Key groups:

| Group    | Variables                                                                     |
| -------- | ----------------------------------------------------------------------------- |
| Database | `DATABASE_URL`                                                                |
| Auth     | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                                       |
| App      | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEFAULT_TIMEZONE`                         |
| Email    | `RESEND_API_KEY`, `EMAIL_FROM`                                                |
| AI       | `OPENAI_API_KEY`                                                              |
| WhatsApp | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`  |
| Billing  | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                                  |
| Storage  | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |

Never commit `.env`.

## Health Check

`GET /api/health` returns JSON with database status:

```json
{
  "ok": true,
  "database": "up"
}
```

## Contributing

Contributions are welcome to the Community Edition. Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) before opening a PR. By contributing, you agree that your work is licensed under AGPL-3.0.

- [Report a bug](.github/ISSUE_TEMPLATE/bug_report.yml)
- [Request a feature](.github/ISSUE_TEMPLATE/feature_request.yml)
- [Start a discussion](https://github.com/nicotordev/bocao.app/discussions)

## Security

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/nicotordev/bocao.app/security/advisories/new). See [SECURITY.md](SECURITY.md).

## License

**Community Edition** — [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

**Commercial Edition** — available under a separate commercial license. See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

Copyright (c) 2026 Nicolas Torres.
