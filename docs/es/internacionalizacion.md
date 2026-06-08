# Internacionalización (i18n)

Bocao utiliza [next-intl](https://next-intl.dev) con **persistencia de idioma basada en cookies**. Las URLs no incluyen prefijos de idioma — no existen rutas `/es` ni `/en`.

```
✅ Correcto:   /
❌ Incorrecto: /es, /en, /fr
```

El idioma activo se almacena en la cookie `locale` y se resuelve en cada solicitud.

---

## Stack

| Tecnología | Rol |
|---|---|
| Next.js 16 App Router | Framework |
| next-intl | APIs de traducción y configuración por request |
| TypeScript (strict) | Locales y claves de mensajes tipados |
| Server Components | Renderizado por defecto con `getTranslations()` |
| Server Actions | Persistencia del cambio de idioma vía `setLocale()` |
| shadcn/ui Select | Interfaz del selector de idioma |

---

## Estructura de Archivos

```
src/
├── app/
│   ├── actions/
│   │   └── locale.ts              # Server action setLocale()
│   ├── layout.tsx                 # html lang, metadata, IntlProvider
│   └── page.tsx                   # Ejemplo con getTranslations()
│
├── i18n/
│   ├── config.ts                  # Constante del nombre de la cookie
│   ├── locales.ts                 # Locales soportados y default
│   ├── request.ts                 # getRequestConfig() — carga mensajes
│   └── messages/
│       ├── en.json
│       └── es.json
│
├── middleware/
│   └── resolve-locale.ts          # Lógica de resolución de idioma
│
├── components/
│   ├── locale-switcher.tsx        # Selector de idioma (client)
│   └── home-client-message.tsx    # Ejemplo con useTranslations()
│
├── providers/
│   └── intl-provider.tsx          # Wrapper de NextIntlClientProvider
│
└── types/
    └── i18n.d.ts                  # Augmentación de TypeScript
```

`next.config.ts` registra el plugin de next-intl apuntando a `src/i18n/request.ts`.

---

## Locales Soportados

Definidos en `src/i18n/locales.ts`:

```ts
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
```

---

## Resolución del Idioma

Orden de prioridad (implementado en `src/middleware/resolve-locale.ts`):

1. **Cookie** — `locale=es` o `locale=en`
2. **Accept-Language** — cabecera del navegador (ej. `en-US` → `en`)
3. **Default** — `es`

`src/i18n/request.ts` lee la cookie y las cabeceras en cada request, resuelve el locale y carga solo el JSON correspondiente mediante un mapa de loaders estáticamente analizable:

```ts
const messageLoaders = {
  es: () => import("./messages/es.json"),
  en: () => import("./messages/en.json"),
};

messages: (await messageLoaders[locale]()).default
```

Solo se carga un bundle de idioma por request, manteniendo el bundle pequeño y compatible con SSR. Evita imports con template literals como `import(\`./messages/${locale}.json\`)`: en Next.js 16.2 con Turbopack, ese patrón puede romper el HMR de archivos de traducción después de la primera actualización.

---

## Cookie

| Propiedad | Valor |
|---|---|
| Nombre | `locale` |
| Path | `/` |
| SameSite | `lax` |
| Secure | `true` en producción |
| Max-Age | 1 año |

Valores de ejemplo: `locale=es`, `locale=en`.

---

## Provider

`src/providers/intl-provider.tsx` es un **Client Component** que envuelve la aplicación con `NextIntlClientProvider`. El layout raíz (Server Component) resuelve `locale` y `messages` en el servidor y los pasa como props serializables — esto garantiza que hooks de cliente como `useTranslations()` reciban el contexto del provider correctamente.

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

## Uso de Traducciones

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

### Locale actual — `getLocale()` / `useLocale()`

```tsx
// Servidor
import { getLocale } from "next-intl/server";
const locale = await getLocale();

// Cliente
import { useLocale } from "next-intl";
const locale = useLocale();
```

---

## Cambiar el Idioma

`LocaleSwitcher` (`src/components/locale-switcher.tsx`) usa el componente `Select` de shadcn. Al cambiar:

1. Llama a la server action `setLocale()`
2. Actualiza la cookie `locale`
3. Revalida la caché del layout raíz
4. Ejecuta `router.refresh()` — actualiza la UI sin recargar la página completa

```tsx
// src/app/actions/locale.ts
"use server";

export async function setLocale(locale: string): Promise<void> {
  // valida locale, establece cookie, revalidatePath("/", "layout")
}
```

---

## Archivos de Mensajes

Los mensajes se organizan por namespace en archivos JSON bajo `src/i18n/messages/`.

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

Mantén `en.json` y `es.json` sincronizados — cada clave de un archivo debe existir en el otro.

---

## SEO

### `html lang`

El layout raíz establece el atributo según el locale resuelto:

```tsx
const locale = await getLocale();
return <html lang={locale}>...</html>;
```

### Metadata

`generateMetadata()` en `src/app/layout.tsx` usa `getTranslations("metadata")` para `title` y `description`, y configura los campos de locale de Open Graph:

```ts
openGraph: {
  locale: locale === "es" ? "es_ES" : "en_US",
  alternateLocale: locale === "es" ? ["en_US"] : ["es_ES"],
}
```

Como las URLs no tienen prefijo de idioma, los enlaces alternativos `hreflang` no se generan automáticamente. Agrégalos manualmente en metadata o mediante un sitemap si es necesario.

---

## TypeScript

`src/types/i18n.d.ts` augmenta next-intl con tipos estrictos para locales y claves de mensajes:

```ts
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof en;
  }
}
```

Esto habilita autocompletado y errores en tiempo de compilación para claves inválidas:

```tsx
const t = useTranslations("common");
t("welcome");  // ✅
t("invalid");  // ❌ Error de TypeScript
```

---

## Agregar un Nuevo Idioma

1. Añade el código a `locales` en `src/i18n/locales.ts`
2. Crea `src/i18n/messages/<locale>.json` con todos los namespaces
3. Añade una etiqueta en `localeLabels` dentro de `locale-switcher.tsx`
4. Actualiza el mapeo de locale de Open Graph en `layout.tsx` si aplica

No se requieren cambios en URLs ni en el routing.

---

## Agregar Traducciones a una Página

1. Añade las claves en `es.json` y `en.json` bajo un namespace
2. Usa `getTranslations("namespace")` en Server Components
3. Usa `useTranslations("namespace")` en Client Components

---

## Notas de Rendimiento

- Los mensajes se cargan con `import()` dinámico — solo el JSON del locale activo se incluye por request
- Sin segmento `[locale]` en la URL — sin overhead de routing adicional
- `revalidatePath("/", "layout")` asegura que el contenido server-rendered refleje el nuevo idioma tras el cambio
- `router.refresh()` re-obtiene los payloads RSC sin una navegación completa

---

## Relación con el Proxy de Auth

`src/proxy.ts` gestiona redirecciones de autenticación y es independiente de i18n. La resolución del idioma ocurre en `getRequestConfig` (servidor) y no requiere cambios en el matcher del proxy.

---

## Referencia Rápida

| Tarea | API / Archivo |
|---|---|
| Leer traducción (servidor) | `getTranslations("namespace")` |
| Leer traducción (cliente) | `useTranslations("namespace")` |
| Obtener locale actual (servidor) | `getLocale()` |
| Obtener locale actual (cliente) | `useLocale()` |
| Cambiar idioma | `setLocale()` en `src/app/actions/locale.ts` |
| Añadir claves de mensaje | `src/i18n/messages/*.json` |
| Añadir idioma | `src/i18n/locales.ts` + nuevo archivo JSON |
| Lógica de resolución de idioma | `src/middleware/resolve-locale.ts` |
