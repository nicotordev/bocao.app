import { defaultLocale, locales, type Locale } from "@/i18n/locales";

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function resolveFromAcceptLanguage(
  acceptLanguage: string,
): Locale | undefined {
  const requested = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, quality] = part.trim().split(";q=");
      return {
        lang: lang?.trim().toLowerCase() ?? "",
        q: quality ? Number.parseFloat(quality) : 1,
      };
    })
    .filter((item) => item.lang.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { lang } of requested) {
    if (isValidLocale(lang)) {
      return lang;
    }

    const base = lang.split("-")[0];
    if (base && isValidLocale(base)) {
      return base;
    }
  }

  return undefined;
}

type ResolveLocaleInput = {
  cookie?: string | null;
  acceptLanguage?: string | null;
};

export function resolveLocale(input: ResolveLocaleInput): Locale {
  if (input.cookie && isValidLocale(input.cookie)) {
    return input.cookie;
  }

  if (input.acceptLanguage) {
    const matched = resolveFromAcceptLanguage(input.acceptLanguage);
    if (matched) {
      return matched;
    }
  }

  return defaultLocale;
}
