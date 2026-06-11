import { resolveIntlLocale } from "@/lib/orders/date";

export function formatAnalyticsCurrency(
  amountCents: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function formatAnalyticsPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const rounded = Math.round(value * 1000) / 10;
  return `${rounded}%`;
}

export function formatChangePercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value > 0 ? `+${value}%` : `${value}%`;
}
