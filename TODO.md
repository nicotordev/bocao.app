# Bocao.app — TODO

Living task list for the product described in `docs/briefing-materials.md`. Update checkboxes as work lands.

**Current baseline (2026-06-10):** Next.js 16 App Router, React 19, Tailwind v4, Prisma 7 + PostgreSQL, Better Auth, RBAC, `next-intl` (en/es). Dashboard with orders, kitchen (WebSocket realtime), menu, reservations, floor plan, customers/CRM, and onboarding. Redis used for kitchen pub/sub; no job queue or WhatsApp/Stripe wiring in app code yet.

---

## Foundation & platform

- [x] **Repository hygiene** — Project-specific `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, CI badge, scripts table.
- [x] **Environment** — `.env.example` documents DB, auth, Redis, kitchen realtime, Resend, OpenAI, WhatsApp, Stripe, and R2 variables.
- [x] **PostgreSQL + ORM** — Prisma 7 schema, migrations, generated client in `src/generated/prisma`, `db:*` scripts.
- [x] **Multi-tenancy** — `Organization` / `Restaurant` models; row-level scoping via `organizationId` / `restaurantId` and membership RBAC.
- [x] **Auth** — Better Auth (email/password, magic link, email OTP); session protection via `src/proxy.ts`; forgot/reset password flows.
- [x] **Roles & permissions** — System roles, permission catalog, `src/lib/rbac`, UI/API gating via `PERMISSIONS`.
- [ ] **Background jobs** — Redis in use for kitchen realtime only; BullMQ or PgBoss for webhooks, reminders, and async AI tasks.
- [x] **File storage** — Cloudflare R2 (S3-compatible) client and `src/lib/upload/image-upload.ts` for image uploads.
- [ ] **Observability** — Structured logging, error reporting hook (e.g. Sentry), basic health check route.

---

## Phase 1 — MVP (ship first)

- [x] **Restaurant onboarding** — Wizard at `/onboarding` (org, restaurant profile, timezone, currency, goals).
- [x] **App shell** — Dashboard layout, sidebar/nav, dark-first theme, restaurant switcher.
- [x] **Dashboard home** — KPIs (revenue, open orders, reservations), recent orders, team activity wired to Prisma.
- [x] **Menu management** — Categories, items, prices, availability, tags, images, product purchase flows.
- [x] **Order management** — Create/update states, list, filters, kanban, timeline, detail drawer, new order flow.
- [ ] **WhatsApp Cloud API** — Meta app config, webhook endpoint (verify + receive), outbound send helper, idempotency for events.
- [ ] **WhatsApp inbox** — Thread list, message view, assign/status for staff (home card UI exists; not connected to Meta).
- [ ] **AI replies (v1)** — Prompt + context (menu snippets, FAQs); rate limits and logging; human handoff flag.
- [x] **Reservations (v1)** — Booking model, dashboard list/calendar views, customer linkage.

---

## Phase 2 — Growth features

- [ ] **Analytics** — Revenue, orders over time, channel breakdown; export CSV (nav entry exists; no `/dashboard/analytics` page yet).
- [ ] **AI insights** — Natural-language summaries on aggregates (insights card UI exists; data layer returns empty).
- [x] **CRM** — Customer profiles, tags, segments, saved segments, import/export templates, profile drawer.
- [ ] **Campaigns** — Segment customers, draft WhatsApp/SMS copy; AI promo text with review before send.
- [x] **Kitchen display** — Realtime queue (Redis + WebSocket gateway + `AppEventLog`), station filters, timers, pause/resume, kanban/cards/timeline, print ticket, new order dialog.

---

## Phase 3 — Scale & ecosystem

- [ ] **Voice** — Voice note transcription (WhatsApp); optional voice ordering path.
- [ ] **Franchises** — Parent org, locations, consolidated reporting.
- [ ] **Advanced automation** — Rules engine (e.g. low stock alerts, auto-replies by schedule).
- [ ] **Public API** — API keys per tenant, webhooks, documentation.

---

## Monetization & billing

- [ ] **Stripe** — Products/plans (Starter, Growth, Enterprise), checkout, customer portal, webhook sync to tenant subscription state.
- [ ] **Usage metering** — Track WhatsApp/AI/SMS usage for overages or credits.

---

## Quality & compliance

- [ ] **Testing** — Critical path tests (auth, webhooks, order state machine); CI currently runs lint + typecheck only (`.github/workflows/ci.yml`).
- [ ] **Security** — Webhook signature verification, CSRF/session hardening beyond current proxy, secret rotation runbook (`SECURITY.md` exists for disclosure policy).
- [ ] **Privacy** — Data retention defaults, export/delete story for tenant customer data (align with market: CL/MX/CO).

---

## Docs & product

- [ ] **Internal docs** — Architecture one-pager (tenancy, WhatsApp flow, AI pipeline).
- [ ] **User-facing help** — Short guides for onboarding, WhatsApp connection, and reservations.
- [x] **Localize** — `next-intl` en/es, cookie-based locale, `docs/es/` parity for licensing, i18n guide, and product brief.

---

## Done

Completed items with traceability. Also check `[x]` marks in sections above.

### Foundation & platform

- [x] **Repository hygiene** — `README.md`, `AGENTS.md`, `.github/CONTRIBUTING.md` (2026)
- [x] **Environment** — `.env.example` with all integration placeholders (2026)
- [x] **PostgreSQL + ORM** — Prisma 7, `prisma/schema.prisma`, migrations workflow (2026)
- [x] **Multi-tenancy** — `Organization`, `Restaurant`, `Membership`, tenant-scoped queries (2026)
- [x] **Auth** — Better Auth + Prisma adapter, sign-in/sign-up, magic link, OTP, password reset (2026)
- [x] **Roles & permissions** — `Permission`, `Role`, `RolePermission`, dashboard gating (2026)
- [x] **File storage** — R2 client (`src/lib/r2.ts`) and image upload helper (2026)

### Phase 1 — MVP

- [x] **Restaurant onboarding** — `src/components/onboarding/`, `/onboarding` (2026)
- [x] **App shell** — Dashboard layout, navigation, theme (2026)
- [x] **Dashboard home** — `getDashboardHomeData`, metric cards, recent orders (2026)
- [x] **Menu management** — `/dashboard/menu`, categories, items, product flows (2026)
- [x] **Order management** — `/dashboard/orders`, kanban, timeline, drawer, `/orders/new` (2026)
- [x] **Reservations (v1)** — `/dashboard/reservations` (2026)

### Phase 2 — Growth

- [x] **CRM** — `/dashboard/customers`, tags, segments, profile dialog, lazy options API (2026-06)
- [x] **Kitchen display** — `/dashboard/kitchen`, stations, realtime via `services/kitchen-realtime` (2026-06)

### Docs & product

- [x] **Localize** — `next-intl`, `src/i18n/messages/{en,es}.json`, `docs/es/` (2026)

### Shipped beyond original checklist

- [x] **Floor plan** — Dining surfaces, table layout, multi-floor navigation (`/dashboard/floor-plan`) (2026)
- [x] **Kitchen stations** — Per-restaurant station config (`/dashboard/kitchen/stations`) (2026)
- [x] **Kitchen realtime pipeline** — `AppEventLog` outbox, Redis pub/sub, JWT WebSocket gateway, TanStack Query invalidation (2026-06)
- [x] **Organizations** — Multi-restaurant management (`/dashboard/organizations`) (2026)
- [x] **CI** — Lint + typecheck on push/PR to `main` (2026)
- [x] **Demo seed** — `bun run db:seed:demo` for local/staging demos (2026)
