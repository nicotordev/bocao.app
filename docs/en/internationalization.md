# Internationalization (i18n)

Bocao uses [next-intl](https://next-intl.dev) with **cookie-based locale persistence**. URLs stay locale-free — there are no `/es` or `/en` prefixes.

```
✅ Correct:   /
❌ Incorrect: /es, /en, /fr
```

The active language is stored in a `locale` cookie and resolved on every request.

---

## Stack

| Technology | Role |
|---|---|
| Next.js 16 App Router | Framework |
| next-intl | Translation APIs and request config |
| TypeScript (strict) | Type-safe locales and message keys |
| Server Components | Default rendering with `getTranslations()` |
| Server Actions | Persist locale changes via `setLocale()` |
| shadcn/ui Select | Language switcher UI |

---

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── locale.ts              # setLocale() server action
│   ├── layout.tsx                 # html lang, metadata, IntlProvider
│   └── page.tsx                   # getTranslations() example
│
├── i18n/
│   ├── config.ts                  # Cookie name constant
│   ├── locales.ts                 # Supported locales and default
│   ├── request.ts                 # getRequestConfig() — loads messages
│   └── messages/
│       ├── en.json
│       └── es.json
│
├── middleware/
│   └── resolve-locale.ts          # Locale resolution logic
│
├── components/
│   ├── locale-switcher.tsx        # Language selector (client)
│   └── home-client-message.tsx    # useTranslations() example
│
├── providers/
│   └── intl-provider.tsx          # NextIntlClientProvider wrapper
│
└── types/
    └── i18n.d.ts                  # TypeScript augmentation
```

`next.config.ts` registers the next-intl plugin pointing at `src/i18n/request.ts`.

---

## Supported Locales

Defined in `src/i18n/locales.ts`:

```ts
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
```

---

## Locale Resolution

Priority order (implemented in `src/middleware/resolve-locale.ts`):

1. **Cookie** — `locale=es` or `locale=en`
2. **Accept-Language** — browser language header (e.g. `en-US` → `en`)
3. **Default** — `es`

`src/i18n/request.ts` reads the cookie and headers on each request, resolves the locale, and loads only the matching JSON file through a statically analyzable loader map:

```ts
const messageLoaders = {
  es: () => import("./messages/es.json"),
  en: () => import("./messages/en.json"),
};

messages: (await messageLoaders[locale]()).default
```

Only one language bundle is loaded per request, keeping the bundle small and SSR-friendly. Avoid template-literal imports such as `import(\`./messages/${locale}.json\`)`: in Next.js 16.2 with Turbopack, that pattern can break HMR for translation file edits after the first update.

---

## Cookie

| Property | Value |
|---|---|
| Name | `locale` |
| Path | `/` |
| SameSite | `lax` |
| Secure | `true` in production |
| Max-Age | 1 year |

Example values: `locale=es`, `locale=en`.

---

## Provider

`src/providers/intl-provider.tsx` is a **Client Component** that wraps the app with `NextIntlClientProvider`. The root layout (Server Component) resolves `locale` and `messages` on the server and passes them as serializable props — this ensures client hooks like `useTranslations()` receive the provider context correctly.

```tsx
// src/app/layout.tsx (Server Component)
const locale = await getLocale();
const messages = await getMessages();

<body>
  <IntlProvider locale={locale} messages={messages}>
    {children}
  </IntlProvider>
</body>
```

```tsx
// src/providers/intl-provider.tsx (Client Component)
"use client";

export function IntlProvider({ children, locale, messages }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

---

## Using Translations

### Server Components — `getTranslations()`

```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("home");

  return <h1>{t("title")}</h1>;
}
```

### Client Components — `useTranslations()`

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("common");
  return <button>{t("save")}</button>;
}
```

### Current locale — `getLocale()` / `useLocale()`

```tsx
// Server
import { getLocale } from "next-intl/server";
const locale = await getLocale();

// Client
import { useLocale } from "next-intl";
const locale = useLocale();
```

---

## Changing the Language

`LocaleSwitcher` (`src/components/locale-switcher.tsx`) uses a shadcn `Select` component. On change:

1. Calls `setLocale()` server action
2. Updates the `locale` cookie
3. Revalidates the root layout cache
4. Calls `router.refresh()` — updates the UI without a full page reload

```tsx
// src/app/actions/locale.ts
"use server";

export async function setLocale(locale: string): Promise<void> {
  // validates locale, sets cookie, revalidatePath("/", "layout")
}
```

---

## Message Files

Messages are organized by namespace in JSON files under `src/i18n/messages/`.

```json
// src/i18n/messages/es.json
{
  "common": {
    "welcome": "Bienvenido",
    "language": "Idioma",
    "save": "Guardar"
  },
  "metadata": {
    "title": "Bocao",
    "description": "Sistema operativo para restaurantes con IA"
  }
}
```

Keep `en.json` and `es.json` in sync — every key in one file must exist in the other.

---

## SEO

### `html lang`

The root layout sets the attribute from the resolved locale:

```tsx
const locale = await getLocale();
return <html lang={locale}>...</html>;
```

### Metadata

`generateMetadata()` in `src/app/layout.tsx` uses `getTranslations("metadata")` for `title` and `description`, and sets Open Graph locale fields:

```ts
openGraph: {
  locale: locale === "es" ? "es_ES" : "en_US",
  alternateLocale: locale === "es" ? ["en_US"] : ["es_ES"],
}
```

Because URLs are not locale-prefixed, `hreflang` alternate links are not generated automatically. Add them manually in metadata or via a sitemap if needed.

---

## TypeScript

`src/types/i18n.d.ts` augments next-intl with strict locale and message key types:

```ts
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof en;
  }
}
```

This enables autocomplete and compile-time errors for invalid translation keys:

```tsx
const t = useTranslations("common");
t("welcome");  // ✅
t("invalid");  // ❌ TypeScript error
```

---

## Adding a New Locale

1. Add the code to `locales` in `src/i18n/locales.ts`
2. Create `src/i18n/messages/<locale>.json` with all namespaces
3. Add a label in `localeLabels` inside `locale-switcher.tsx`
4. Update Open Graph locale mapping in `layout.tsx` if needed

No URL or routing changes are required.

---

## Adding Translations to a Page

1. Add keys to both `es.json` and `en.json` under a namespace
2. Use `getTranslations("namespace")` in Server Components
3. Use `useTranslations("namespace")` in Client Components

---

## Performance Notes

- Messages are loaded via dynamic `import()` — only the active locale JSON is bundled per request
- No `[locale]` URL segment — no extra routing overhead
- `revalidatePath("/", "layout")` ensures server-rendered content reflects the new locale after switching
- `router.refresh()` re-fetches RSC payloads without a hard navigation

---

## Relationship to Auth Proxy

`src/proxy.ts` handles authentication redirects and is independent of i18n. Locale resolution happens in `getRequestConfig` (server) and does not require changes to the proxy matcher.

---

## Quick Reference

| Task | API / File |
|---|---|
| Read translation (server) | `getTranslations("namespace")` |
| Read translation (client) | `useTranslations("namespace")` |
| Get current locale (server) | `getLocale()` |
| Get current locale (client) | `useLocale()` |
| Change language | `setLocale()` in `src/app/actions/locale.ts` |
| Add message keys | `src/i18n/messages/*.json` |
| Add locale | `src/i18n/locales.ts` + new JSON file |
| Locale resolution logic | `src/middleware/resolve-locale.ts` |
