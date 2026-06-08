<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Guide

Use this file as the operating contract for automated coding agents working in this repository.

## Project Snapshot

- Product: Bocao.app, an AI-assisted operating system for restaurants.
- Runtime/package manager: Bun (`packageManager` is authoritative).
- Framework: Next.js 16 App Router with Turbopack, React 19, TypeScript strict mode, Tailwind CSS v4.
- Auth: Better Auth with Prisma adapter, email/password, magic link, and email OTP.
- Data: PostgreSQL through Prisma 7. Generated client output lives in `src/generated/prisma`.
- UI: shadcn-style primitives in `src/components/ui`, Tabler/Lucide icons, Sonner toasts.
- i18n: `next-intl`, cookie-based locale persistence, no locale prefixes in URLs.

## Before Editing

1. Read the relevant installed Next.js documentation in `node_modules/next/dist/docs/` before changing App Router, routing, metadata, Server Components, Client Components, caching, public assets, forms, or middleware/proxy behavior.
2. Inspect the current files before making assumptions. Prefer `rg` and `rg --files`.
3. Check the working tree with `git status --short`. This repo often has active local changes; never revert unrelated changes.
4. Keep changes scoped to the user's request. Avoid broad refactors unless they are required to fix the issue.

## Commands

- Install dependencies: `bun install`
- Dev server: `bun dev`
- Type check: `bunx tsc --noEmit`
- Lint: `bun run lint`
- Production build: `bun run build`
- Prisma generate: `bun run db:generate`
- Prisma migration: `bun run db:migrate`
- Prisma Studio: `bun run db:studio`
- Seed database: `bun run db:seed`
- Better Auth generated artifacts: `bun run auth:generate`

Run the narrowest useful verification first. For behavior changes, prefer `bunx tsc --noEmit` plus a focused browser/manual check. Report unrelated lint failures instead of editing unrelated files.

## Code Conventions

- Use TypeScript and existing local helpers before adding new abstractions.
- Use Server Components by default. Add `"use client"` only where state, effects, browser APIs, or event handlers are required.
- Props passed from Server Components to Client Components must be serializable. Do not pass functions, Sets, Maps, class instances, or Prisma records with non-serializable fields across that boundary.
- Public assets under `public/` are referenced from the root path, e.g. `public/sounds/button.wav` -> `/sounds/button.wav`.
- Use `next-intl` ICU values correctly: messages with placeholders require `t("key", {value})`; use `t.raw("key")` only when intentionally passing an unformatted template string to the client.
- Keep UI consistent with existing primitives in `src/components/ui`. Prefer Tabler or Lucide icons over custom inline SVGs.
- Keep comments rare and useful. Do not add narration comments for obvious code.

## Important Areas

- `src/app`: App Router routes, layouts, actions, API route handlers, and providers.
- `src/components/dashboard`: dashboard shell and feature UI.
- `src/components/dashboard/orders`: order list, filters, kanban, timeline, and drawer UI.
- `src/lib/dashboard`: dashboard session/context assembly.
- `src/lib/rbac` and `src/lib/permissions.ts`: roles, permissions, and navigation gating.
- `src/lib/query`: TanStack Query clients, query options, mutations, and API clients.
- `src/i18n`: locale config, request config, and message catalogs.
- `prisma/schema.prisma`: database schema and generated Prisma client source.

## Database And Auth Notes

- `DATABASE_URL` is read by `prisma.config.ts`, not by a datasource URL inside `schema.prisma`.
- The Prisma generator outputs to `src/generated/prisma`; imports should use the existing local Prisma wrapper where possible.
- Better Auth config is in `src/lib/auth.ts`.
- Dashboard access is resolved through membership/role data. Preserve tenant scoping by organization and restaurant.

## i18n Notes

- Supported locales are defined in `src/i18n/locales.ts`.
- Locale resolution is cookie-first, then `Accept-Language`, then default locale.
- URLs do not include `/es` or `/en`.
- Keep `en.json` and `es.json` structurally in sync when adding messages.

## Safety

- Do not run destructive git commands (`reset --hard`, checkout/revert unrelated files, mass cleanups) unless the user explicitly asks.
- Do not commit secrets. `.env` is local only; `.env.example` documents expected variables.
- If a command fails because of unrelated existing errors, state the exact files and errors in the final response.
