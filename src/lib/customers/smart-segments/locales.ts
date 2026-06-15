import type { Locale } from "@/i18n/locales";

export function getSupportedSmartSegmentLocales(): readonly Locale[] {
  return ["es", "en"] as const;
}
