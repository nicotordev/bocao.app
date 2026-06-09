import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { formatCurrency } from "@/lib/orders/currency";

export function resolveDateFnsLocale(locale: string) {
  return locale === "es" ? es : enUS;
}

export function formatRelativeDate(
  date: Date | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!date) {
    return fallback;
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: resolveDateFnsLocale(locale),
  });
}

export function formatCustomerDate(
  date: Date,
  timezone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-CL" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function formatMoney(
  amountCents: number,
  currency: string,
): string {
  return formatCurrency(amountCents, currency);
}

export function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
