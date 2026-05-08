# Bocao.app — TODO

Living task list for the product described in `docs/briefing-materials.md`. Update checkboxes as work lands.

**Current baseline:** Next.js 16 app with Tailwind v4 and shadcn-style UI primitives (`src/components/ui/`). Default landing page; no database or auth wired yet.

---

## Foundation & platform

- [ ] **Repository hygiene** — Replace default `README.md` with project-specific setup, env vars, and scripts.
- [ ] **Environment** — Document required secrets (DB URL, Redis, OpenAI, WhatsApp, Stripe, etc.) in a single env example file (e.g. `.env.example`).
- [ ] **PostgreSQL + ORM** — Add Prisma (or chosen ORM), initial schema, migrations workflow, and `db` scripts in `package.json`.
- [ ] **Multi-tenancy** — Model `Organization` / `Restaurant` (or tenant) and scope all domain data by tenant; decide strategy (row-level `tenantId`, RLS, or separate schemas).
- [ ] **Auth** — Sign-up, login, session, password reset; protect dashboard routes (e.g. Next.js middleware + server session).
- [ ] **Roles & permissions** — At least: owner, manager, staff; gate APIs and UI by role.
- [ ] **Background jobs** — Redis + BullMQ or PgBoss for webhooks, reminders, and async AI tasks.
- [ ] **File storage** — S3-compatible bucket for menu images, receipts, assets; signed URLs where needed.
- [ ] **Observability** — Structured logging, error reporting hook (e.g. Sentry), basic health check route.

---

## Phase 1 — MVP (ship first)

- [ ] **Restaurant onboarding** — Create org/restaurant profile, timezone, currency, basic branding.
- [ ] **App shell** — Dashboard layout: sidebar/nav, dark-first theme aligned with brand (warm primary, charcoal, accent).
- [ ] **Dashboard home** — Placeholder KPIs: today’s revenue, open orders, upcoming reservations (wire to real data when models exist).
- [ ] **Menu management** — Categories, items, prices, availability; foundation for AI and WhatsApp answers.
- [ ] **Order management** — Create/update order states (received → in prep → ready → completed); list and detail views.
- [ ] **WhatsApp Cloud API** — Meta app config, webhook endpoint (verify + receive), outbound send helper, idempotency for events.
- [ ] **WhatsApp inbox** — Thread list, message view, assign/status for staff (even if minimal v1).
- [ ] **AI replies (v1)** — Prompt + context (menu snippets, FAQs); rate limits and logging; human handoff flag.
- [ ] **Reservations (v1)** — Table or capacity model, booking flow (internal + optional customer-facing link), simple calendar view.

---

## Phase 2 — Growth features

- [ ] **Analytics** — Revenue, orders over time, channel breakdown; export CSV.
- [ ] **AI insights** — Natural-language summaries (“sales vs last week”, peak hours) on top of aggregates.
- [ ] **CRM** — Customer profiles, tags, visit history linked to orders/reservations.
- [ ] **Campaigns** — Segment customers, draft WhatsApp/SMS copy; integrate AI for promo text (with review before send).
- [ ] **Kitchen display** — Realtime queue (SSE or WebSocket), station filters, timers, bump/recall actions.

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

- [ ] **Testing** — Critical path tests (auth, webhooks, order state machine); CI running lint + tests.
- [ ] **Security** — Webhook signature verification, CSRF/session hardening, secret rotation notes.
- [ ] **Privacy** — Data retention defaults, export/delete story for tenant customer data (align with market: CL/MX/CO).

---

## Docs & product

- [ ] **Internal docs** — Architecture one-pager (tenancy, WhatsApp flow, AI pipeline).
- [ ] **User-facing help** — Short guides for onboarding, WhatsApp connection, and reservations.
- [ ] **Localize** — Strategy for ES-first UX in LatAm (copy, dates, currency); optional `docs/es/` parity for product briefs.

---

## Done

_Add completed items here with date or PR link for traceability._

<!-- Example:
- [x] **Scaffold Next.js app** — Initial UI kit (2026-05-08)
-->
