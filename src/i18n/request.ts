import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE } from "@/i18n/config";
import type enMessages from "@/i18n/messages/en.json";
import type { Locale } from "@/i18n/locales";
import { resolveLocale } from "@/middleware/resolve-locale";

type Messages = typeof enMessages;

const messageLoaders = {
  es: () => import("./messages/es.json"),
  en: () => import("./messages/en.json"),
} satisfies Record<Locale, () => Promise<{ default: Messages }>>;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headersList.get("accept-language"),
  });

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});
