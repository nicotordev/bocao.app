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
  relativeMinutes: string;
  inKitchen: string;
  minutesShort: string;
};

type GetDashboardHomeDataOptions = {
  metricLabels: DashboardMetricLabels;
  locale?: string;
  notAvailable?: string;
  customerLabels?: {
    fallbackCustomer: string;
    tableOnly: string;
    tableWithCustomers: string;
  };
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
      value: formatCurrency(revenueTodayCents, restaurant.currency, locale),
      change: metricTrends["revenue-today"]?.change ?? notAvailable,
      trend: metricTrends["revenue-today"]?.trend ?? "neutral",
    },
    {
      id: "open-orders",
      label: metricLabels.openOrders,
      value: String(openOrders.length),
      change:
        metricTrends["open-orders"]?.change ??
        (preparingCount > 0
          ? metricLabels.inKitchen.replace("{count}", String(preparingCount))
          : notAvailable),
      trend: metricTrends["open-orders"]?.trend ?? "neutral",
    },
    {
      id: "upcoming-reservations",
      label: metricLabels.upcomingReservations,
      value: String(reservations.length),
      change: metricTrends["upcoming-reservations"]?.change ?? notAvailable,
      trend: metricTrends["upcoming-reservations"]?.trend ?? "neutral",
    },
    {
      id: "avg-prep-time",
      label: metricLabels.avgPrepTime,
      value:
        avgPrep > 0
          ? metricLabels.minutesShort.replace("{minutes}", String(avgPrep))
          : notAvailable,
      change: metricTrends["avg-prep-time"]?.change ?? notAvailable,
      trend: metricTrends["avg-prep-time"]?.trend ?? "neutral",
    },
  ];

  return {
    metrics,
    recentOrders: orders.slice(0, 4).map((order) => {
      const customerLabel = formatOrderCustomerLabel({
        customers: getOrderCustomers(order),
        tableNumber: order.tableNumber,
        labels: options.customerLabels,
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customerLabel.customerName,
        status: mapOrderStatusToPreview(mapDbStatusToUi(order.status)),
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
            lastMessageAt: notAvailable,
            responseRate: notAvailable,
          },
    teamActivity: Array.isArray(demoProfile?.teamActivity)
      ? (demoProfile.teamActivity as DashboardHomeData["teamActivity"])
      : [],
  };
}
