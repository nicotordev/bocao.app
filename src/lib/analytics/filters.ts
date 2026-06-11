import { z } from "zod";
import {
  dateInputToUtcEnd,
  dateInputToUtcStart,
  formatDateInputValue,
  getTodayDateInputValue,
} from "@/lib/orders/date";
import {
  analyticsChannelSchema,
  analyticsDatePresetSchema,
  analyticsOrderStatusSchema,
} from "@/lib/analytics/schema";
import type {
  AnalyticsDatePreset,
  AnalyticsFilters,
} from "@/lib/analytics/types";

export type AnalyticsListFilters = {
  preset: AnalyticsDatePreset;
  from: string;
  to: string;
  channel: z.infer<typeof analyticsChannelSchema> | "all";
  status: z.infer<typeof analyticsOrderStatusSchema>;
};

export const analyticsListQuerySchema = z.object({
  preset: analyticsDatePresetSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  channel: z.union([analyticsChannelSchema, z.literal("all")]).optional(),
  status: analyticsOrderStatusSchema.optional(),
});

export function resolveAnalyticsDateRange(
  preset: AnalyticsDatePreset,
  timezone: string,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const today = getTodayDateInputValue(timezone);
  const todayDate = dateInputToUtcStart(today, timezone);

  if (preset === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  if (preset === "today") {
    return { from: today, to: today };
  }

  if (preset === "yesterday") {
    const yesterday = formatDateInputValue(
      new Date(todayDate.getTime() - 24 * 60 * 60 * 1000),
      timezone,
    );
    return { from: yesterday, to: yesterday };
  }

  if (preset === "last7days") {
    const from = formatDateInputValue(
      new Date(todayDate.getTime() - 6 * 24 * 60 * 60 * 1000),
      timezone,
    );
    return { from, to: today };
  }

  if (preset === "last30days") {
    const from = formatDateInputValue(
      new Date(todayDate.getTime() - 29 * 24 * 60 * 60 * 1000),
      timezone,
    );
    return { from, to: today };
  }

  if (preset === "thisMonth") {
    const parts = today.split("-").map((part) => Number(part));
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    return { from, to: today };
  }

  if (preset === "lastMonth") {
    const parts = today.split("-").map((part) => Number(part));
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const previousYear = previousMonthDate.getUTCFullYear();
    const previousMonth = previousMonthDate.getUTCMonth() + 1;
    const from = `${previousYear}-${String(previousMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month - 1, 0));
    const to = formatDateInputValue(lastDay, timezone);
    return { from, to };
  }

  return { from: customFrom ?? today, to: customTo ?? today };
}

export function parseAnalyticsListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  timezone: string,
): AnalyticsListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = analyticsListQuerySchema.safeParse({
    preset: getValue("preset"),
    from: getValue("from"),
    to: getValue("to"),
    channel: getValue("channel"),
    status: getValue("status"),
  });

  const preset = parsed.success
    ? (parsed.data.preset ?? "last7days")
    : "last7days";
  const range = resolveAnalyticsDateRange(
    preset,
    timezone,
    parsed.success ? parsed.data.from : undefined,
    parsed.success ? parsed.data.to : undefined,
  );

  return {
    preset,
    from: range.from,
    to: range.to,
    channel:
      parsed.success && parsed.data.channel ? parsed.data.channel : "all",
    status: parsed.success && parsed.data.status ? parsed.data.status : "all",
  };
}

export function toAnalyticsFilters(
  restaurantId: string,
  organizationId: string,
  listFilters: AnalyticsListFilters,
  timezone: string,
  currency: string,
  locale: string,
): AnalyticsFilters {
  return {
    restaurantId,
    organizationId,
    from: dateInputToUtcStart(listFilters.from, timezone),
    to: dateInputToUtcEnd(listFilters.to, timezone),
    channel: listFilters.channel,
    status: listFilters.status,
    timezone,
    currency,
    locale,
  };
}

export function getPreviousAnalyticsPeriod(from: Date, to: Date) {
  const durationMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return { from: previousFrom, to: previousTo };
}
