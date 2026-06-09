# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch of the Community Edition. Tagged releases will be added as the project matures.

| Version | Supported |
| --- | --- |
| `main` (latest) | Yes |
| Older commits | Best effort |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

Instead, report them privately by one of these methods:

1. **GitHub Security Advisories** — use [Report a vulnerability](https://github.com/nicotordev/bocao.app/security/advisories/new) on the repository Security tab (preferred).
2. **Email** — contact the maintainer at the address listed on their GitHub profile.

Include as much detail as possible:

- Type of vulnerability (e.g. SQL injection, auth bypass, XSS)
- Full paths of affected source files
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code if available
- Impact assessment

## Response timeline

| Stage | Target |
| --- | --- |
| Initial acknowledgment | Within 72 hours |
| Status update | Within 7 days |
| Fix or mitigation plan | Depends on severity; critical issues prioritized |

## Disclosure policy

- We follow coordinated disclosure — please allow reasonable time to patch before public disclosure.
- Credit will be given to reporters who wish to be acknowledged (unless you prefer anonymity).
- A security advisory will be published on GitHub once a fix is available.

## Scope

In scope:

- Authentication and session management flaws in Bocao.app
- Authorization / RBAC bypasses
- SQL injection, XSS, CSRF in application code
- Tenant isolation failures (cross-organization data leaks)
- Webhook signature verification issues (WhatsApp, Stripe)

Out of scope:

- Vulnerabilities in third-party dependencies already tracked upstream (report to the upstream project; we will update when a fix is released)
- Social engineering attacks
- Denial of service without a demonstrated application-level flaw
- Issues requiring physical access to the server

## Security best practices for self-hosters

- Keep `BETTER_AUTH_SECRET` strong and unique per environment.
- Never commit `.env` or expose `DATABASE_URL` publicly.
- Run PostgreSQL with least-privilege credentials.
- Keep dependencies updated (`bun update`, review Dependabot PRs).
- Use HTTPS in production (`BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`).
- Restrict webhook endpoints with proper signature/token verification.
