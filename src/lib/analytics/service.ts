import "server-only";

import type { AnalyticsListFilters } from "@/lib/analytics/filters";
import { resolveAnalyticsInsights } from "@/lib/analytics/insights/resolve-insights";
import { getPreviousAnalyticsPeriod } from "@/lib/analytics/filters";
import { computeChangePercent, safeAverage, safeRate } from "@/lib/analytics/math";
import { buildKitchenPerformanceMetrics } from "@/lib/analytics/kitchen-performance";
import { fetchKitchenStationLabelMap } from "@/lib/analytics/kitchen-stations";
import {
  aggregateOverviewMetrics,
  buildChannelBreakdown,
  buildCustomerInsights,
  buildPeakHours,
  buildRevenueSeries,
  buildTopProducts,
  fetchAnalyticsOrderRows,
} from "@/lib/analytics/repository";
import type {
  AnalyticsDashboardData,
  AnalyticsFilters,
} from "@/lib/analytics/types";
import { formatDateInputValue } from "@/lib/orders/date";

type GetAnalyticsDashboardOptions = {
  kitchenStationLabels: Record<string, string>;
};

export async function getAnalyticsDashboardMetrics(
  filters: AnalyticsFilters,
  options: Pick<
    GetAnalyticsDashboardOptions,
    "kitchenStationLabels"
  >,
): Promise<Omit<AnalyticsDashboardData, "insights">> {
  const previousPeriod = getPreviousAnalyticsPeriod(filters.from, filters.to);

  const [rows, overviewMetrics, stationLabelMap] = await Promise.all([
    fetchAnalyticsOrderRows(filters),
    aggregateOverviewMetrics(filters, previousPeriod),
    fetchKitchenStationLabelMap(
      filters.restaurantId,
      options.kitchenStationLabels,
    ),
  ]);

  const overview = {
    totalRevenue: overviewMetrics.totalRevenue,
    totalOrders: overviewMetrics.totalOrders,
    averageTicket: Math.round(
      safeAverage(overviewMetrics.totalRevenue, overviewMetrics.completedOrders),
    ),
    uniqueCustomers: overviewMetrics.uniqueCustomers,
    cancellationRate: safeRate(
      overviewMetrics.cancelledCount,
      overviewMetrics.totalOrders,
    ),
    averagePreparationMinutes:
      overviewMetrics.averagePreparationMinutes !== null
        ? Math.round(overviewMetrics.averagePreparationMinutes)
        : null,
    revenueChangePercent: computeChangePercent(
      overviewMetrics.totalRevenue,
      overviewMetrics.previousRevenue,
    ),
    ordersChangePercent: computeChangePercent(
      overviewMetrics.totalOrders,
      overviewMetrics.previousOrders,
    ),
  };

  return {
    overview,
    revenueSeries: buildRevenueSeries(rows, filters),
    channelBreakdown: buildChannelBreakdown(rows),
    topProducts: buildTopProducts(rows),
    peakHours: buildPeakHours(rows, filters),
    kitchenPerformance: await buildKitchenPerformanceMetrics(
      filters,
      rows,
      stationLabelMap,
    ),
    customerInsights: buildCustomerInsights({
      uniqueCustomers: overviewMetrics.uniqueCustomers,
      customersWithOrders: overviewMetrics.customersWithOrders,
      reservationCount: overviewMetrics.reservationCount,
    }),
    filters: {
      from: formatDateInputValue(filters.from, filters.timezone),
      to: formatDateInputValue(filters.to, filters.timezone),
      channel: filters.channel ?? "all",
      status: filters.status ?? "all",
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function getAnalyticsDashboardData(
  filters: AnalyticsFilters,
  listFilters: Pick<AnalyticsListFilters, "preset" | "channel" | "status">,
  options: GetAnalyticsDashboardOptions,
): Promise<AnalyticsDashboardData> {
  const dashboard = await getAnalyticsDashboardMetrics(filters, {
    kitchenStationLabels: options.kitchenStationLabels,
  });

  const insights = await resolveAnalyticsInsights({
    restaurantId: filters.restaurantId,
    locale: filters.locale,
    preset: listFilters.preset,
    channel: listFilters.channel,
    status: listFilters.status,
  });

  return {
    ...dashboard,
    insights,
  };
}
