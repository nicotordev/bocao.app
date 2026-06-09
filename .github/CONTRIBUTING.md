# Contributing to Bocao.app

Thank you for your interest in contributing to the **Community Edition** of Bocao.app.

## Before you start

1. Read the [licensing guide](../docs/en/licensing.md) — contributions are licensed under **AGPL-3.0**.
2. Check [open issues](https://github.com/nicotordev/bocao.app/issues) and [discussions](https://github.com/nicotordev/bocao.app/discussions) to avoid duplicate work.
3. For large changes, open an issue or discussion first to align on approach.

## Development setup

```bash
git clone git@github.com:nicotordev/bocao.app.git
cd bocao.app
bun install
cp .env.example .env
# configure DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
bun run db:migrate
bun run db:seed    # optional
bun dev
```

See [README.md](../README.md) and [AGENTS.md](../AGENTS.md) for full project conventions.

## Pull request guidelines

- Keep PRs focused — one feature or fix per PR when possible.
- Run `bunx tsc --noEmit` and `bun run lint` before submitting.
- Keep `en.json` and `es.json` message files structurally in sync when adding i18n keys.
- Use Server Components by default; add `"use client"` only when needed.
- Do not commit `.env`, secrets, or generated artifacts that should stay local.

## Commit messages

Follow the repository style — short imperative subject, optional body for context:

```
Add kitchen station category labels

Support custom labels per station so staff can filter orders
by prep area without hardcoded category names.
```

## Code style

- TypeScript strict mode.
- Match existing patterns in the surrounding code.
- Prefer existing helpers in `src/lib/` over new abstractions.
- Use shadcn-style primitives from `src/components/ui/`.
- Read Next.js 16 docs in `node_modules/next/dist/docs/` before changing framework behavior.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml). Include:

- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Bun version, Node if relevant)
- Screenshots or logs when helpful

## Feature requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) or start a Discussion for open-ended ideas.

## Security issues

Do **not** open public issues for security vulnerabilities. See [SECURITY.md](../SECURITY.md).

## Commercial edition

Contributions to this repository apply to the AGPL-3.0 Community Edition. The commercial edition sold on CodeCanyon is a separate distribution channel with different licensing. See [COMMERCIAL-LICENSE.md](../COMMERCIAL-LICENSE.md).
