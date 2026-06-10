import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import type { KitchenOrder } from "@/lib/kitchen/types";
import {
  dateInputToUtcEnd,
  dateInputToUtcStart,
  getTodayDateInputValue,
} from "@/lib/orders/date";

export type KitchenListFilters = {
  date: string;
};

const kitchenDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

export const kitchenListQuerySchema = z.object({
  date: kitchenDateSchema,
});

export function createDefaultKitchenDate(timezone: string): string {
  return getTodayDateInputValue(timezone);
}

export function isKitchenDefaultDate(date: string, timezone: string): boolean {
  return date === createDefaultKitchenDate(timezone);
}

export function parseKitchenListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  timezone: string,
): KitchenListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const defaultDate = createDefaultKitchenDate(timezone);
  const parsed = kitchenListQuerySchema.safeParse({
    date: getValue("date"),
  });

  if (!parsed.success) {
    return { date: defaultDate };
  }

  return {
    date: parsed.data.date ?? defaultDate,
  };
}

export function buildKitchenPrismaWhere(
  restaurantId: string,
  filters: KitchenListFilters,
  timezone: string,
): Prisma.OrderWhereInput {
  const dayStart = dateInputToUtcStart(filters.date, timezone);
  const dayEnd = dateInputToUtcEnd(filters.date, timezone);

  return {
    restaurantId,
    status: { not: "CANCELLED" },
    createdAt: {
      gte: dayStart,
      lte: dayEnd,
    },
  };
}

export function filterKitchenOrdersByDate(
  orders: readonly KitchenOrder[],
  date: string,
): KitchenOrder[] {
  return orders.filter((order) => order.orderDate === date);
}
