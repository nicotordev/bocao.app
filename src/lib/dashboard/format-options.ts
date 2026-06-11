import { getLocale, getTranslations } from "next-intl/server";

export async function getDashboardHomeFormatOptions() {
  const locale = await getLocale();
  const tMetrics = await getTranslations("dashboard.metrics");
  const tInsights = await getTranslations("dashboard.home.insights.items");
  const tCommon = await getTranslations("common");
  const tDrawer = await getTranslations("dashboard.orders.drawer");

  return {
    locale,
    notAvailable: tCommon("notAvailable"),
    insightLabels: {
      kitchenBacklog: {
        title: tInsights("kitchenBacklog.title"),
        description: tInsights.raw("kitchenBacklog.description"),
      },
      upcomingReservations: {
        title: tInsights("upcomingReservations.title"),
        description: tInsights.raw("upcomingReservations.description"),
      },
      revenueUp: {
        title: tInsights("revenueUp.title"),
        description: tInsights.raw("revenueUp.description"),
      },
      revenueDown: {
        title: tInsights("revenueDown.title"),
        description: tInsights.raw("revenueDown.description"),
      },
      slowPrep: {
        title: tInsights("slowPrep.title"),
        description: tInsights.raw("slowPrep.description"),
      },
      pendingReservations: {
        title: tInsights("pendingReservations.title"),
        description: tInsights.raw("pendingReservations.description"),
      },
    },
    metricLabels: {
      revenueToday: tMetrics("revenueToday"),
      openOrders: tMetrics("openOrders"),
      upcomingReservations: tMetrics("upcomingReservations"),
      avgPrepTime: tMetrics("avgPrepTime"),
      relativeMinutes: tMetrics.raw("relativeMinutes"),
      inKitchen: tMetrics.raw("inKitchen"),
      minutesShort: tMetrics.raw("minutesShort"),
      vsYesterday: tMetrics.raw("vsYesterday"),
      reservationsNextHours: tMetrics.raw("reservationsNextHours"),
      prepTimeVsLastWeek: tMetrics.raw("prepTimeVsLastWeek"),
    },
    customerLabels: {
      fallbackCustomer: tDrawer("fallbackCustomer"),
      tableOnly: tDrawer.raw("tableOnly"),
      tableWithCustomers: tDrawer.raw("tableWithCustomers"),
    },
  };
}
