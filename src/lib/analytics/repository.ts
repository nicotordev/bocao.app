import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  analyticsChannelToPrismaWhere,
  normalizeAnalyticsChannel,
} from "@/lib/analytics/channel";
import { analyticsStatusToDb } from "@/lib/analytics/status";
import { formatDateInputValue } from "@/lib/orders/date";
import { parseStoredOrderLineItems } from "@/lib/orders/build-order-details";
import type {
  AnalyticsChannel,
  AnalyticsFilters,
  ChannelBreakdown,
  CustomerInsights,
  PeakHour,
  RevenuePoint,
  TopProduct,
} from "@/lib/analytics/types";
import { prisma } from "@/lib/prisma";

export type OrderSeriesRow = {
  id: string;
  createdAt: Date;
  totalCents: number;
  status: string;
  channel: string | null;
  type: string;
  preparationMins: number | null;
  details: unknown;
};

function buildBaseOrderWhere(filters: AnalyticsFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    restaurantId: filters.restaurantId,
    createdAt: {
      gte: filters.from,
      lte: filters.to,
    },
  };

  const dbStatus = analyticsStatusToDb(filters.status);
  if (dbStatus) {
    where.status = dbStatus;
  }

  if (filters.channel && filters.channel !== "all") {
    const channelWhere = analyticsChannelToPrismaWhere(filters.channel);
    return { AND: [where, channelWhere] };
  }

  return where;
}

function buildCompletedRevenueWhere(
  filters: AnalyticsFilters,
): Prisma.OrderWhereInput {
  const base = buildBaseOrderWhere(filters);

  if (filters.status === "cancelled") {
    return { ...base, status: "CANCELLED" };
  }

  if (filters.status === "confirmed") {
    return { ...base, status: "CONFIRMED" };
  }

  if (filters.status === "completed") {
    return { ...base, status: "COMPLETED" };
  }

  return { ...base, status: "COMPLETED" };
}

export async function fetchAnalyticsOrderRows(
  filters: AnalyticsFilters,
): Promise<OrderSeriesRow[]> {
  return prisma.order.findMany({
    where: buildBaseOrderWhere(filters),
    select: {
      id: true,
      createdAt: true,
      totalCents: true,
      status: true,
      channel: true,
      type: true,
      preparationMins: true,
      details: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function aggregateOverviewMetrics(
  filters: AnalyticsFilters,
  previousFilters: Pick<AnalyticsFilters, "from" | "to">,
) {
  const baseWhere = buildBaseOrderWhere(filters);
  const revenueWhere = buildCompletedRevenueWhere(filters);
  const previousBaseWhere: Prisma.OrderWhereInput = {
    ...baseWhere,
    createdAt: {
      gte: previousFilters.from,
      lte: previousFilters.to,
    },
  };
  const previousRevenueWhere: Prisma.OrderWhereInput = {
    ...revenueWhere,
    createdAt: {
      gte: previousFilters.from,
      lte: previousFilters.to,
    },
  };

  const [
    totalOrders,
    revenueAgg,
    cancelledCount,
    avgPrepAgg,
    previousOrders,
    previousRevenueAgg,
    orderCustomers,
    reservationCustomers,
    reservationsCount,
  ] = await Promise.all([
    prisma.order.count({ where: baseWhere }),
    prisma.order.aggregate({
      where: revenueWhere,
      _sum: { totalCents: true },
      _count: { id: true },
    }),
    prisma.order.count({
      where: { ...baseWhere, status: "CANCELLED" },
    }),
    prisma.order.aggregate({
      where: {
        ...revenueWhere,
        preparationMins: { not: null },
      },
      _avg: { preparationMins: true },
    }),
    prisma.order.count({ where: previousBaseWhere }),
    prisma.order.aggregate({
      where: previousRevenueWhere,
      _sum: { totalCents: true },
    }),
    prisma.orderCustomer.findMany({
      where: {
        order: baseWhere,
      },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.reservation.findMany({
      where: {
        restaurantId: filters.restaurantId,
        scheduledAt: {
          gte: filters.from,
          lte: filters.to,
        },
        customerId: { not: null },
      },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.reservation.count({
      where: {
        restaurantId: filters.restaurantId,
        scheduledAt: {
          gte: filters.from,
          lte: filters.to,
        },
      },
    }),
  ]);

  const completedOrders = revenueAgg._count.id;
  const totalRevenue = revenueAgg._sum.totalCents ?? 0;
  const previousRevenue = previousRevenueAgg._sum.totalCents ?? 0;

  const uniqueCustomerIds = new Set<string>();
  for (const row of orderCustomers) {
    uniqueCustomerIds.add(row.customerId);
  }
  for (const row of reservationCustomers) {
    if (row.customerId) {
      uniqueCustomerIds.add(row.customerId);
    }
  }

  return {
    totalOrders,
    totalRevenue,
    completedOrders,
    cancelledCount,
    averagePreparationMinutes: avgPrepAgg._avg.preparationMins,
    previousOrders,
    previousRevenue,
    uniqueCustomers: uniqueCustomerIds.size,
    customersWithOrders: orderCustomers.length,
    reservationCount: reservationsCount,
  };
}

export function buildRevenueSeries(
  rows: OrderSeriesRow[],
  filters: AnalyticsFilters,
): RevenuePoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>();

  for (const row of rows) {
    const dateKey = formatDateInputValue(row.createdAt, filters.timezone);
    const current = buckets.get(dateKey) ?? { revenue: 0, orders: 0 };
    current.orders += 1;

    if (row.status === "COMPLETED") {
      current.revenue += row.totalCents;
    }

    buckets.set(dateKey, current);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({
      date,
      revenue: values.revenue,
      orders: values.orders,
    }));
}

export function buildChannelBreakdown(rows: OrderSeriesRow[]): ChannelBreakdown[] {
  const buckets = new Map<AnalyticsChannel, { orders: number; revenue: number }>();

  for (const channel of [
    "pos",
    "whatsapp",
    "web",
    "delivery",
    "manual",
  ] as const) {
    buckets.set(channel, { orders: 0, revenue: 0 });
  }

  for (const row of rows) {
    const channel = normalizeAnalyticsChannel(
      row.channel,
      row.type as "DINE_IN" | "TAKEOUT" | "DELIVERY",
    );
    const current = buckets.get(channel) ?? { orders: 0, revenue: 0 };
    current.orders += 1;

    if (row.status === "COMPLETED") {
      current.revenue += row.totalCents;
    }

    buckets.set(channel, current);
  }

  return Array.from(buckets.entries()).map(([channel, values]) => ({
    channel,
    orders: values.orders,
    revenue: values.revenue,
  }));
}

export function buildTopProducts(rows: OrderSeriesRow[]): TopProduct[] {
  const productMap = new Map<
    string,
    { productId: string | null; name: string; quantity: number; revenue: number }
  >();

  for (const row of rows) {
    if (row.status !== "COMPLETED") {
      continue;
    }

    const items = parseStoredOrderLineItems(row.details);

    for (const item of items) {
      const key = item.menuItemId ?? item.name.trim().toLowerCase();
      const current = productMap.get(key) ?? {
        productId: item.menuItemId ?? null,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity;
      current.revenue += item.priceCents * item.quantity;
      productMap.set(key, current);
    }
  }

  const products = Array.from(productMap.values()).sort(
    (left, right) => right.revenue - left.revenue,
  );
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);

  return products.slice(0, 10).map((product) => ({
    productId: product.productId,
    name: product.name,
    quantity: product.quantity,
    revenue: product.revenue,
    sharePercent:
      totalRevenue > 0
        ? Math.round((product.revenue / totalRevenue) * 1000) / 10
        : 0,
  }));
}

function getHourInTimezone(date: Date, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
}

export function buildPeakHours(
  rows: OrderSeriesRow[],
  filters: AnalyticsFilters,
): PeakHour[] {
  const buckets = new Map<number, { orders: number; revenue: number }>();

  for (let hour = 0; hour < 24; hour += 1) {
    buckets.set(hour, { orders: 0, revenue: 0 });
  }

  for (const row of rows) {
    const hour = getHourInTimezone(row.createdAt, filters.timezone);
    const current = buckets.get(hour) ?? { orders: 0, revenue: 0 };
    current.orders += 1;

    if (row.status === "COMPLETED") {
      current.revenue += row.totalCents;
    }

    buckets.set(hour, current);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left - right)
    .map(([hour, values]) => ({
      hour,
      orders: values.orders,
      revenue: values.revenue,
      averageTicket:
        values.orders > 0 ? Math.round(values.revenue / values.orders) : 0,
    }));
}

export function buildCustomerInsights(input: {
  uniqueCustomers: number;
  customersWithOrders: number;
  reservationCount: number;
}): CustomerInsights {
  return {
    uniqueCustomers: input.uniqueCustomers,
    customersWithOrders: input.customersWithOrders,
    reservationCount: input.reservationCount,
  };
}
