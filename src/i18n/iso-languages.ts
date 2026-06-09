export type IsoLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
};

/** Common ISO 639-1 / BCP 47 codes for restaurant menu content. */
export const ISO_LANGUAGE_CATALOG: IsoLanguage[] = [
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "ca", label: "Catalan", nativeLabel: "Català" },
  { code: "gl", label: "Galician", nativeLabel: "Galego" },
  { code: "eu", label: "Basque", nativeLabel: "Euskara" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "he", label: "Hebrew", nativeLabel: "עברית" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { code: "th", label: "Thai", nativeLabel: "ไทย" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { code: "sv", label: "Swedish", nativeLabel: "Svenska" },
  { code: "da", label: "Danish", nativeLabel: "Dansk" },
  { code: "no", label: "Norwegian", nativeLabel: "Norsk" },
  { code: "fi", label: "Finnish", nativeLabel: "Suomi" },
  { code: "el", label: "Greek", nativeLabel: "Ελληνικά" },
  { code: "ro", label: "Romanian", nativeLabel: "Română" },
  { code: "hu", label: "Hungarian", nativeLabel: "Magyar" },
  { code: "cs", label: "Czech", nativeLabel: "Čeština" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська" },
];

const ISO_LANGUAGE_BY_CODE = new Map(
  ISO_LANGUAGE_CATALOG.map((language) => [language.code, language]),
);

const CONTENT_LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export function isValidContentLocaleCode(code: string) {
  return CONTENT_LOCALE_PATTERN.test(code.trim());
}

export function normalizeContentLocaleCodes(codes: string[]) {
  const normalized: string[] = [];

  for (const code of codes) {
    const next = code.trim().toLowerCase();
    if (!isValidContentLocaleCode(next)) {
      continue;
    }

    if (!normalized.includes(next)) {
      normalized.push(next);
    }
  }

  return normalized;
}

export function getIsoLanguageLabel(
  code: string,
  uiLocale: string = "es",
) {
  const language = ISO_LANGUAGE_BY_CODE.get(code);

  if (!language) {
    return code.toUpperCase();
  }

  return uiLocale.startsWith("en") ? language.label : language.nativeLabel;
}

export function buildContentLocaleOptions(
  codes: string[],
  uiLocale: string = "es",
) {
  const normalized = normalizeContentLocaleCodes(codes);

  return normalized.map((code) => ({
    value: code,
    label: getIsoLanguageLabel(code, uiLocale),
  }));
}

export function getEnabledLocalesFromLabel(
  label: Partial<Record<string, string>> | undefined,
  fallbackLocale: string,
) {
  const enabled = new Set<string>();

  if (!label) {
    return [fallbackLocale];
  }

  for (const [locale, value] of Object.entries(label)) {
    if (value !== undefined) {
      enabled.add(locale);
    }
  }

  if (enabled.size === 0) {
    return [fallbackLocale];
  }

  return [...enabled];
}

export function createEmptyLocalizedLabel(
  locale: string,
): Partial<Record<string, string>> {
  return { [locale]: "" };
}
