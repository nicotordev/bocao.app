"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { QueryResultState } from "@/components/query/query-result-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  buildAnalyticsCsv,
  buildAnalyticsCsvFilename,
  downloadAnalyticsCsv,
} from "@/lib/analytics/export-csv";
import {
  parseAnalyticsListSearchParams,
  resolveAnalyticsDateRange,
} from "@/lib/analytics/filters";
import { useAnalyticsDashboardQuery } from "@/lib/query/analytics/analytics.queries";
import { buildListUrl } from "@/lib/list-url";
import { AnalyticsAiInsightsCard } from "./ai-insights-card";
import { AnalyticsFilters } from "./analytics-filters";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { ChannelBreakdownChart } from "./channel-breakdown";
import { CustomerInsightsCard } from "./customer-insights-card";
import { KitchenPerformanceCard } from "./kitchen-performance-card";
import { OrdersChart } from "./orders-chart";
import { PeakHoursHeatmap } from "./peak-hours-heatmap";
import { RevenueChart } from "./revenue-chart";
import { TopProductsTable } from "./top-products-table";
import type { AnalyticsLabels } from "./types";

type AnalyticsPageClientProps = {
  labels: AnalyticsLabels;
  restaurantId: string;
  timezone: string;
  currency: string;
  locale: string;
};

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}

export function AnalyticsPageClient({
  labels,
  restaurantId,
  timezone,
  currency,
  locale,
}: AnalyticsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () =>
      parseAnalyticsListSearchParams(
        Object.fromEntries(searchParams.entries()),
        timezone,
      ),
    [searchParams, timezone],
  );

  const analyticsQuery = useAnalyticsDashboardQuery(restaurantId, filters);

  const updateUrl = useCallback(
    (nextFilters: typeof filters) => {
      const range = resolveAnalyticsDateRange(
        nextFilters.preset,
        timezone,
        nextFilters.from,
        nextFilters.to,
      );

      router.replace(
        buildListUrl("/dashboard/analytics", {
          preset:
            nextFilters.preset === "last7days" ? undefined : nextFilters.preset,
          from: nextFilters.preset === "custom" ? range.from : undefined,
          to: nextFilters.preset === "custom" ? range.to : undefined,
          channel:
            nextFilters.channel === "all" ? undefined : nextFilters.channel,
          status: nextFilters.status === "all" ? undefined : nextFilters.status,
        }),
      );
    },
    [router, timezone],
  );

  const handleFiltersChange = useCallback(
    (nextFilters: typeof filters) => {
      const resolved = {
        ...nextFilters,
        ...resolveAnalyticsDateRange(
          nextFilters.preset,
          timezone,
          nextFilters.from,
          nextFilters.to,
        ),
      };
      updateUrl(resolved);
    },
    [timezone, updateUrl],
  );

  const handleExportCsv = useCallback(() => {
    if (!analyticsQuery.data) {
      toast.error(labels.empty.title);
      return;
    }

    const csv = buildAnalyticsCsv(analyticsQuery.data);
    const filename = buildAnalyticsCsvFilename(filters.from, filters.to);
    downloadAnalyticsCsv(csv, filename);
    toast.success(labels.actions.exportSuccess);
  }, [analyticsQuery.data, filters.from, filters.to, labels]);

  const isEmpty = (data: NonNullable<typeof analyticsQuery.data>) =>
    data.overview.totalOrders === 0 && data.overview.totalRevenue === 0;

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {labels.header.subtitle}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={handleExportCsv}
          disabled={!analyticsQuery.data || analyticsQuery.isFetching}
        >
          {labels.actions.exportCsv}
        </Button>
      </section>

      <AnalyticsFilters
        labels={labels}
        value={filters}
        onChange={handleFiltersChange}
        onClear={() =>
          handleFiltersChange({
            preset: "last7days",
            ...resolveAnalyticsDateRange("last7days", timezone),
            channel: "all",
            status: "all",
          })
        }
      />

      <QueryResultState
        query={analyticsQuery}
        loadingFallback={<AnalyticsLoadingSkeleton />}
        isEmpty={(data) => isEmpty(data)}
        emptyFallback={
          <Empty className="rounded-3xl border border-dashed border-border/70 bg-muted/10 py-16">
            <EmptyHeader>
              <EmptyTitle>{labels.empty.title}</EmptyTitle>
              <EmptyDescription>{labels.empty.description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      >
        {(data) => (
          <div className="space-y-6">
            <AnalyticsKpiCards
              labels={labels.kpis}
              overview={data.overview}
              currency={currency}
              locale={locale}
            />

            <section className="grid gap-4 xl:grid-cols-2">
              <RevenueChart
                title={labels.charts.revenueOverTime}
                data={data.revenueSeries}
                currency={currency}
                locale={locale}
                revenueLabel={labels.charts.revenue}
              />
              <OrdersChart
                title={labels.charts.ordersOverTime}
                data={data.revenueSeries}
                ordersLabel={labels.charts.orders}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <ChannelBreakdownChart
                title={labels.charts.ordersByChannel}
                data={data.channelBreakdown}
                labels={labels}
                currency={currency}
                locale={locale}
              />
              <AnalyticsAiInsightsCard
                title={labels.charts.aiInsights}
                description={labels.header.subtitle}
                viewMoreLabel={labels.charts.viewMore}
                dialogDescription={labels.charts.insightsDialogDescription}
                insights={data.insights}
                emptyTitle={labels.empty.title}
                emptyDescription={labels.empty.description}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <TopProductsTable
                title={labels.charts.topProducts}
                data={data.topProducts}
                labels={labels}
                currency={currency}
                locale={locale}
              />
              <CustomerInsightsCard
                title={labels.charts.customerInsights}
                data={data.customerInsights}
                labels={labels}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <PeakHoursHeatmap
                title={labels.charts.peakHours}
                data={data.peakHours}
                labels={labels}
                currency={currency}
                locale={locale}
              />
              <KitchenPerformanceCard
                title={labels.charts.kitchenPerformance}
                data={data.kitchenPerformance}
                labels={labels}
              />
            </section>
          </div>
        )}
      </QueryResultState>
    </main>
  );
}
