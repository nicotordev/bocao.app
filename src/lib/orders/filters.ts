import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  createDefaultOrdersDateRange,
  dateInputToUtcEnd,
  dateInputToUtcStart,
} from "@/lib/orders/date";
import { mapUiStatusToDb } from "@/lib/orders/order-mapper";
import {
  parsePaginationParams,
  type PaginationParams,
  paginationQuerySchema,
} from "@/lib/pagination";
import { orderChannelSchema, orderStatusSchema } from "@/lib/orders/schemas";
import type { Order, OrderChannel, OrderStatus } from "@/lib/orders/types";

export type OrdersListFilters = {
  search?: string;
  status?: OrderStatus | "all";
  channel?: OrderChannel | "all";
  from?: string;
  to?: string;
} & PaginationParams;

export const ordersListQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.union([orderStatusSchema, z.literal("all")]).optional(),
    channel: z.union([orderChannelSchema, z.literal("all")]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export function parseOrdersListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  timezone: string,
): OrdersListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const defaults = createDefaultOrdersDateRange(timezone);
  const parsed = ordersListQuerySchema.safeParse({
    search: getValue("search"),
    status: getValue("status"),
    channel: getValue("channel"),
    from: getValue("from") ?? defaults.from,
    to: getValue("to") ?? defaults.to,
    page: getValue("page"),
    pageSize: getValue("pageSize"),
  });

  if (!parsed.success) {
    return {
      ...defaults,
      status: "all",
      channel: "all",
      ...parsePaginationParams(searchParams),
    };
  }

  return {
    search: parsed.data.search,
    status: parsed.data.status ?? "all",
    channel: parsed.data.channel ?? "all",
    from: parsed.data.from ?? defaults.from,
    to: parsed.data.to ?? defaults.to,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

export type OrdersQueryFilters = Omit<
  OrdersListFilters,
  keyof PaginationParams
>;

export function buildOrdersPrismaWhere(
  restaurantId: string,
  filters: OrdersQueryFilters | undefined,
  timezone: string,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { restaurantId };

  if (!filters) {
    return where;
  }

  if (filters.status && filters.status !== "all") {
    where.status = mapUiStatusToDb(filters.status);
  }

  if (filters.channel && filters.channel !== "all") {
    where.channel = filters.channel;
  }

  if (filters.from || filters.to) {
    where.createdAt = {};

    if (filters.from) {
      where.createdAt.gte = dateInputToUtcStart(filters.from, timezone);
    }

    if (filters.to) {
      where.createdAt.lte = dateInputToUtcEnd(filters.to, timezone);
    }
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { tableNumber: { contains: search, mode: "insensitive" } },
      {
        customers: {
          some: {
            customer: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  return where;
}

export function applyOrdersListFilters(
  orders: readonly Order[],
  filters?: Omit<OrdersListFilters, keyof PaginationParams>,
): Order[] {
  const search = filters?.search?.trim().toLowerCase() ?? "";

  return orders.filter((order) => {
    const matchesSearch =
      search.length === 0 ||
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.customerNames.some((name) => name.toLowerCase().includes(search)) ||
      (order.tableNumber?.toLowerCase().includes(search) ?? false) ||
      order.phone.toLowerCase().includes(search);
    const matchesStatus =
      !filters?.status ||
      filters.status === "all" ||
      order.status === filters.status;
    const matchesChannel =
      !filters?.channel ||
      filters.channel === "all" ||
      order.channel === filters.channel;
    const matchesFrom = !filters?.from || order.createdAtDate >= filters.from;
    const matchesTo = !filters?.to || order.createdAtDate <= filters.to;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesChannel &&
      matchesFrom &&
      matchesTo
    );
  });
}
