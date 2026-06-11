import "server-only";

import { computeAnalyticsInsights } from "@/lib/analytics/compute-insights";
import { getPreviousAnalyticsPeriod } from "@/lib/analytics/filters";
import { computeChangePercent, safeAverage, safeRate } from "@/lib/analytics/math";
import {
  aggregateOverviewMetrics,
  buildChannelBreakdown,
  buildCustomerInsights,
  buildKitchenPerformance,
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

type AnalyticsInsightLabels = {
  revenueUp: string;
  revenueDown: string;
  topChannel: string;
  topProduct: string;
  peakHours: string;
  cancellationHigh: string;
  channelLabels: Record<
    import("@/lib/analytics/types").AnalyticsChannel,
    string
  >;
};

type GetAnalyticsDashboardOptions = {
  insightLabels: AnalyticsInsightLabels;
};

export async function getAnalyticsDashboardData(
  filters: AnalyticsFilters,
  options: GetAnalyticsDashboardOptions,
): Promise<AnalyticsDashboardData> {
  const previousPeriod = getPreviousAnalyticsPeriod(filters.from, filters.to);

  const [rows, overviewMetrics] = await Promise.all([
    fetchAnalyticsOrderRows(filters),
    aggregateOverviewMetrics(filters, previousPeriod),
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
  const kitchenPerformance = buildKitchenPerformance(rows);
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

  dashboard.insights = computeAnalyticsInsights(dashboard, options.insightLabels);

  return dashboard;
}
