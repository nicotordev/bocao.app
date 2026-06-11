import { resolveIntlLocale } from "@/lib/orders/date";

export function formatTeamDateTime(
  value: string | null,
  locale: string,
  fallback = "—",
): string {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
