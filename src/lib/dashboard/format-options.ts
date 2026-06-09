import { getLocale, getTranslations } from "next-intl/server";

export async function getDashboardHomeFormatOptions() {
  const locale = await getLocale();
  const tMetrics = await getTranslations("dashboard.metrics");
  const tCommon = await getTranslations("common");
  const tDrawer = await getTranslations("dashboard.orders.drawer");

  return {
    locale,
    notAvailable: tCommon("notAvailable"),
    metricLabels: {
      revenueToday: tMetrics("revenueToday"),
      openOrders: tMetrics("openOrders"),
      upcomingReservations: tMetrics("upcomingReservations"),
      avgPrepTime: tMetrics("avgPrepTime"),
      relativeMinutes: tMetrics.raw("relativeMinutes"),
      inKitchen: tMetrics.raw("inKitchen"),
      minutesShort: tMetrics.raw("minutesShort"),
    },
    customerLabels: {
      fallbackCustomer: tDrawer("fallbackCustomer"),
      tableOnly: tDrawer.raw("tableOnly"),
      tableWithCustomers: tDrawer.raw("tableWithCustomers"),
    },
  };
}
