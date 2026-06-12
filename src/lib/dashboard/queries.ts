import {
  addHours,
  differenceInMinutes,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import { enUS, es } from "date-fns/locale";
import { computeDashboardInsights } from "@/lib/dashboard/compute-insights";
import type { DashboardInsightLabels } from "@/lib/dashboard/compute-insights";
import type {
  DashboardHomeData,
  DashboardMetric,
  DashboardOrderPreview,
} from "@/lib/dashboard/data";
import type { DashboardRestaurant } from "@/lib/dashboard/types";
import {
  formatOrderCustomerLabel,
  getOrderCustomers,
  orderCustomerInclude,
} from "@/lib/orders/order-customers";
import { mapDbStatusToUi } from "@/lib/orders/order-mapper";
import { prisma } from "@/lib/prisma";

type DashboardMetricLabels = {
  revenueToday: string;
  openOrders: string;
  upcomingReservations: string;
  avgPrepTime: string;
  relativeMinutes: string;
  inKitchen: string;
  minutesShort: string;
  vsYesterday: string;
  reservationsNextHours: string;
  prepTimeVsLastWeek: string;
};

type GetDashboardHomeDataOptions = {
  metricLabels: DashboardMetricLabels;
  insightLabels?: DashboardInsightLabels;
  locale?: string;
  notAvailable?: string;
  customerLabels?: {
    fallbackCustomer: string;
    tableOnly: string;
    tableWithCustomers: string;
  };
};

type MetricTrend = {
  change: string;
  trend: DashboardMetric["trend"];
};

function resolveIntlLocale(locale: string): string {
  return locale === "es" ? "es-CL" : "en-US";
}

function formatCurrency(
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

function formatRelativeMinutes(date: Date, template: string): string {
  const minutes = Math.max(1, differenceInMinutes(new Date(), date));
  return template.replace("{minutes}", String(minutes));
}

function formatPercentChange(
  current: number,
  previous: number,
  template: string,
  notAvailable: string,
): MetricTrend {
  if (current === 0 && previous === 0) {
    return { change: notAvailable, trend: "neutral" };
  }

  if (previous === 0) {
    return {
      change: template.replace("{change}", "+100"),
      trend: "up",
    };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  const signedChange = percent > 0 ? `+${percent}` : String(percent);

  return {
    change: template.replace("{change}", signedChange),
    trend: percent > 0 ? "up" : percent < 0 ? "down" : "neutral",
  };
}

function formatPrepTimeChange(
  currentAvg: number,
  previousAvg: number,
  template: string,
  notAvailable: string,
): MetricTrend {
  if (currentAvg === 0 && previousAvg === 0) {
    return { change: notAvailable, trend: "neutral" };
  }

  if (previousAvg === 0) {
    return { change: notAvailable, trend: "neutral" };
  }

  const delta = currentAvg - previousAvg;
  const signedChange = delta > 0 ? `+${delta}` : String(delta);

  return {
    change: template.replace("{change}", signedChange),
    trend: delta < 0 ? "up" : delta > 0 ? "down" : "neutral",
  };
}

export async function getDashboardHomeData(
  restaurant: DashboardRestaurant | null,
  options: GetDashboardHomeDataOptions,
): Promise<DashboardHomeData> {
  const { metricLabels, locale = "es", notAvailable = "—" } = options;
  const dateFnsLocale = locale === "es" ? es : enUS;

  if (!restaurant) {
    return {
      metrics: [],
      recentOrders: [],
      upcomingReservations: [],
      insights: [],
      whatsapp: {
        connected: false,
        unreadCount: 0,
        lastMessageAt: notAvailable,
        responseRate: notAvailable,
      },
      teamActivity: [],
    };
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  const nextThreeHours = addHours(now, 3);

  const [
    recentOrders,
    reservations,
    teamMemberships,
    revenueTodayAgg,
    revenueYesterdayAgg,
    openOrdersCount,
    preparingCount,
    avgPrepCurrentAgg,
    avgPrepPreviousAgg,
    reservationsNextThreeHours,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: orderCustomerInclude,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        scheduledAt: { gte: now },
      },
      include: {
        customer: {
          select: {
            id: true,
            avatar: true,
            email: true,
            phone: true,
            notes: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.membership.findMany({
      where: { organizationId: restaurant.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            sessions: {
              where: { expiresAt: { gt: now } },
              select: { id: true },
              take: 1,
            },
          },
        },
        role: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "COMPLETED",
        createdAt: { gte: todayStart },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "COMPLETED",
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        status: "PREPARING",
      },
    }),
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "COMPLETED",
        createdAt: { gte: weekAgo },
        preparationMins: { not: null },
      },
      _avg: { preparationMins: true },
    }),
    prisma.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        status: "COMPLETED",
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
        preparationMins: { not: null },
      },
      _avg: { preparationMins: true },
    }),
    prisma.reservation.count({
      where: {
        restaurantId: restaurant.id,
        scheduledAt: { gte: now, lte: nextThreeHours },
        status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      },
    }),
  ]);

  const revenueTodayCents = revenueTodayAgg._sum.totalCents ?? 0;
  const revenueYesterdayCents = revenueYesterdayAgg._sum.totalCents ?? 0;
  const avgPrepCurrent = Math.round(
    avgPrepCurrentAgg._avg.preparationMins ?? 0,
  );
  const avgPrepPrevious = Math.round(
    avgPrepPreviousAgg._avg.preparationMins ?? 0,
  );

  const revenueTrend = formatPercentChange(
    revenueTodayCents,
    revenueYesterdayCents,
    metricLabels.vsYesterday,
    notAvailable,
  );

  const openOrdersTrend: MetricTrend = {
    change:
      preparingCount > 0
        ? metricLabels.inKitchen.replace("{count}", String(preparingCount))
        : notAvailable,
    trend: "neutral",
  };

  const reservationsTrend: MetricTrend =
    reservationsNextThreeHours > 0
      ? {
          change: metricLabels.reservationsNextHours
            .replace("{count}", String(reservationsNextThreeHours))
            .replace("{hours}", "3"),
          trend: "up",
        }
      : { change: notAvailable, trend: "neutral" };

  const avgPrepTrend = formatPrepTimeChange(
    avgPrepCurrent,
    avgPrepPrevious,
    metricLabels.prepTimeVsLastWeek,
    notAvailable,
  );

  const pendingReservationsCount = reservations.filter(
    (reservation) => reservation.status === "PENDING",
  ).length;

  const insights = options.insightLabels
    ? computeDashboardInsights(
        {
          preparingCount,
          openOrdersCount,
          reservationsNextThreeHours,
          revenueTodayCents,
          revenueYesterdayCents,
          avgPrepCurrent,
          avgPrepPrevious,
          pendingReservationsCount,
        },
        options.insightLabels,
      )
    : [];

  const metrics: DashboardMetric[] = [
    {
      id: "revenue-today",
      label: metricLabels.revenueToday,
      value: formatCurrency(revenueTodayCents, restaurant.currency, locale),
      change: revenueTrend.change,
      trend: revenueTrend.trend,
      href: "/dashboard/analytics",
    },
    {
      id: "open-orders",
      label: metricLabels.openOrders,
      value: String(openOrdersCount),
      change: openOrdersTrend.change,
      trend: openOrdersTrend.trend,
      href: "/dashboard/orders",
    },
    {
      id: "upcoming-reservations",
      label: metricLabels.upcomingReservations,
      value: String(reservations.length),
      change: reservationsTrend.change,
      trend: reservationsTrend.trend,
      href: "/dashboard/reservations",
    },
    {
      id: "avg-prep-time",
      label: metricLabels.avgPrepTime,
      value:
        avgPrepCurrent > 0
          ? metricLabels.minutesShort.replace(
              "{minutes}",
              String(avgPrepCurrent),
            )
          : notAvailable,
      change: avgPrepTrend.change,
      trend: avgPrepTrend.trend,
      href: "/dashboard/kitchen",
    },
  ];

  return {
    metrics,
    recentOrders: recentOrders.map((order) => {
      const customerLabel = formatOrderCustomerLabel({
        customers: getOrderCustomers(order),
        tableNumber: order.tableNumber,
        labels: options.customerLabels,
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customerLabel.customerName,
        status: mapDbStatusToUi(order.status),
        channel: (order.channel ?? "web") as DashboardOrderPreview["channel"],
        tableNumber: order.tableNumber ?? undefined,
        total: formatCurrency(order.totalCents, restaurant.currency, locale),
        createdAt: formatRelativeMinutes(
          order.createdAt,
          metricLabels.relativeMinutes,
        ),
      };
    }),
    upcomingReservations: reservations.slice(0, 3).map((reservation) => ({
      id: reservation.id,
      guestName: reservation.guestName,
      guestPhoto: reservation.customer?.avatar ?? "",
      guestCount: reservation.guestCount,
      scheduledAt: format(reservation.scheduledAt, "HH:mm", {
        locale: dateFnsLocale,
      }),
      status: reservation.status,
      guestPhone:
        reservation.guestPhone ?? reservation.customer?.phone ?? undefined,
      guestEmail: reservation.customer?.email ?? undefined,
      guestNotes: reservation.notes ?? reservation.customer?.notes ?? undefined,
      customerId:
        reservation.customerId ?? reservation.customer?.id ?? undefined,
    })),
    insights,
    whatsapp: {
      connected: false,
      unreadCount: 0,
      lastMessageAt: notAvailable,
      responseRate: notAvailable,
    },
    teamActivity: teamMemberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      role: membership.role.name,
      status: membership.user.sessions.length > 0 ? "online" : "offline",
    })),
  };
}
