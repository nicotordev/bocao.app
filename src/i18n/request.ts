import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocale } from "@/middleware/resolve-locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headersList.get("accept-language"),
  });

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
