import "server-only";

import { generateAnalyticsInsights } from "@/lib/analytics/ai/generate-analytics-insights";
import type { AnalyticsChannel } from "@/lib/analytics/types";
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
  restaurantName: string;
  channelLabels: Record<AnalyticsChannel, string>;
  kitchenStationLabels: Record<string, string>;
  fallbackInsightLabels: {
    revenueUp: string;
    revenueDown: string;
    topChannel: string;
    topProduct: string;
    peakHours: string;
    cancellationHigh: string;
    channelLabels: Record<AnalyticsChannel, string>;
  };
};

export async function getAnalyticsDashboardData(
  filters: AnalyticsFilters,
  options: GetAnalyticsDashboardOptions,
): Promise<AnalyticsDashboardData> {
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

  const revenueSeries = buildRevenueSeries(rows, filters);
  const channelBreakdown = buildChannelBreakdown(rows);
  const topProducts = buildTopProducts(rows);
  const peakHours = buildPeakHours(rows, filters);
  const kitchenPerformance = await buildKitchenPerformanceMetrics(
    filters,
    rows,
    stationLabelMap,
  );
  const customerInsights = buildCustomerInsights({
    uniqueCustomers: overviewMetrics.uniqueCustomers,
    customersWithOrders: overviewMetrics.customersWithOrders,
    reservationCount: overviewMetrics.reservationCount,
  });

  const dashboard: AnalyticsDashboardData = {
    overview,
    revenueSeries,
    channelBreakdown,
    topProducts,
    peakHours,
    kitchenPerformance,
    customerInsights,
    insights: [],
    filters: {
      from: formatDateInputValue(filters.from, filters.timezone),
      to: formatDateInputValue(filters.to, filters.timezone),
      channel: filters.channel ?? "all",
      status: filters.status ?? "all",
    },
    updatedAt: new Date().toISOString(),
  };

  dashboard.insights = await generateAnalyticsInsights({
    restaurantName: options.restaurantName,
    locale: filters.locale,
    currency: filters.currency,
    dashboard,
    fallbackLabels: options.fallbackInsightLabels,
  });

  return dashboard;
}
