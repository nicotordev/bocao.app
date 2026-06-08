import { differenceInMinutes, format, startOfDay } from "date-fns";
import { enUS, es } from "date-fns/locale";
import type { DashboardHomeData, DashboardMetric } from "@/lib/dashboard/data";
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
};

type GetDashboardHomeDataOptions = {
  metricLabels: DashboardMetricLabels;
  locale?: string;
};

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatRelativeMinutes(date: Date, locale: string): string {
  const minutes = Math.max(1, differenceInMinutes(new Date(), date));
  return locale === "es" ? `Hace ${minutes} min` : `${minutes} min ago`;
}

function mapOrderStatusToPreview(
  status: ReturnType<typeof mapDbStatusToUi>,
): "pending" | "preparing" | "ready" | "completed" {
  switch (status) {
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "delivered":
      return "completed";
    default:
      return "pending";
  }
}

function mapReservationStatusToPreview(
  status: string,
): "confirmed" | "pending" | "seated" {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "SEATED":
      return "seated";
    default:
      return "pending";
  }
}

export async function getDashboardHomeData(
  restaurant: DashboardRestaurant | null,
  options: GetDashboardHomeDataOptions,
): Promise<DashboardHomeData> {
  const { metricLabels, locale = "es" } = options;
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
        lastMessageAt: "—",
        responseRate: "—",
      },
      teamActivity: [],
    };
  }

  const todayStart = startOfDay(new Date());

  const [orders, reservations, demoProfile] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: orderCustomerInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.restaurantDemoProfile.findUnique({
      where: { restaurantId: restaurant.id },
    }),
  ]);

  const revenueTodayCents = orders
    .filter(
      (order) => order.createdAt >= todayStart && order.status === "COMPLETED",
    )
    .reduce((sum, order) => sum + order.totalCents, 0);

  const openOrders = orders.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.status),
  );

  const preparingCount = openOrders.filter(
    (order) => order.status === "PREPARING",
  ).length;

  const prepTimes = orders
    .map((order) => order.preparationMins)
    .filter((value): value is number => value !== null);

  const avgPrep =
    prepTimes.length > 0
      ? Math.round(
          prepTimes.reduce((sum, value) => sum + value, 0) / prepTimes.length,
        )
      : 0;

  const metricTrends =
    (demoProfile?.metricTrends as Record<
      string,
      { change: string; trend: DashboardMetric["trend"] }
    >) ?? {};

  const metrics: DashboardMetric[] = [
    {
      id: "revenue-today",
      label: metricLabels.revenueToday,
      value: formatCurrency(revenueTodayCents, restaurant.currency),
      change: metricTrends["revenue-today"]?.change ?? "—",
      trend: metricTrends["revenue-today"]?.trend ?? "neutral",
    },
    {
      id: "open-orders",
      label: metricLabels.openOrders,
      value: String(openOrders.length),
      change:
        metricTrends["open-orders"]?.change ??
        (preparingCount > 0 ? `${preparingCount} en cocina` : "—"),
      trend: metricTrends["open-orders"]?.trend ?? "neutral",
    },
    {
      id: "upcoming-reservations",
      label: metricLabels.upcomingReservations,
      value: String(reservations.length),
      change: metricTrends["upcoming-reservations"]?.change ?? "—",
      trend: metricTrends["upcoming-reservations"]?.trend ?? "neutral",
    },
    {
      id: "avg-prep-time",
      label: metricLabels.avgPrepTime,
      value: avgPrep > 0 ? `${avgPrep} min` : "—",
      change: metricTrends["avg-prep-time"]?.change ?? "—",
      trend: metricTrends["avg-prep-time"]?.trend ?? "neutral",
    },
  ];

  return {
    metrics,
    recentOrders: orders.slice(0, 4).map((order) => {
      const customerLabel = formatOrderCustomerLabel({
        customers: getOrderCustomers(order),
        tableNumber: order.tableNumber,
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customerLabel.customerName,
        status: mapOrderStatusToPreview(mapDbStatusToUi(order.status)),
        total: formatCurrency(order.totalCents, restaurant.currency),
        createdAt: formatRelativeMinutes(order.createdAt, locale),
      };
    }),
    upcomingReservations: reservations.slice(0, 3).map((reservation) => ({
      id: reservation.id,
      guestName: reservation.guestName,
      guestCount: reservation.guestCount,
      scheduledAt: format(reservation.scheduledAt, "HH:mm", {
        locale: dateFnsLocale,
      }),
      status: mapReservationStatusToPreview(reservation.status),
    })),
    insights: Array.isArray(demoProfile?.insights)
      ? (demoProfile.insights as DashboardHomeData["insights"])
      : [],
    whatsapp:
      demoProfile?.whatsapp &&
      typeof demoProfile.whatsapp === "object" &&
      !Array.isArray(demoProfile.whatsapp)
        ? (demoProfile.whatsapp as DashboardHomeData["whatsapp"])
        : {
            connected: false,
            unreadCount: 0,
            lastMessageAt: "—",
            responseRate: "—",
          },
    teamActivity: Array.isArray(demoProfile?.teamActivity)
      ? (demoProfile.teamActivity as DashboardHomeData["teamActivity"])
      : [],
  };
}
