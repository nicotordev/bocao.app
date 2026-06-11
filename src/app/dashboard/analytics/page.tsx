import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";
import { AnalyticsPageClient } from "@/components/dashboard/analytics/analytics-page-client";
import type { AnalyticsLabels } from "@/components/dashboard/analytics/types";
import {
  parseAnalyticsListSearchParams,
  toAnalyticsFilters,
} from "@/lib/analytics/filters";
import { getAnalyticsDashboardData } from "@/lib/analytics/service";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { analyticsDashboardQueryOptions } from "@/lib/query/analytics/analytics.queries";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { searchParamsToRecord } from "@/lib/list-url";

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const t = await getTranslations("dashboard.analytics");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const timezone = context?.activeRestaurant?.timezone ?? "America/Santiago";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const organizationId = context?.activeRestaurant?.organizationId ?? "";
  const canRead =
    context?.membership.permissions.includes(PERMISSIONS.ANALYTICS_READ) ??
    false;

  const labels: AnalyticsLabels = {
    header: {
      title: t("title"),
      subtitle: t("description"),
    },
    actions: {
      exportCsv: t("exportCsv"),
      exportSuccess: t("exportSuccess"),
      clearFilters: t("clearFilters"),
      refresh: tCommon("notAvailable"),
    },
    filters: {
      restaurant: t("filters.restaurant"),
      dateRange: t("filters.dateRange"),
      channel: t("filters.channel"),
      status: t("filters.status"),
      from: t("filters.from"),
      to: t("filters.to"),
      all: t("filters.all"),
      presets: {
        today: t("filters.presets.today"),
        yesterday: t("filters.presets.yesterday"),
        last7days: t("filters.presets.last7days"),
        last30days: t("filters.presets.last30days"),
        thisMonth: t("filters.presets.thisMonth"),
        lastMonth: t("filters.presets.lastMonth"),
        custom: t("filters.presets.custom"),
      },
      activeCount: t.raw("filters.activeCount"),
      noActive: t("filters.noActive"),
    },
    channels: {
      all: t("channels.all"),
      pos: t("channels.pos"),
      whatsapp: t("channels.whatsapp"),
      web: t("channels.web"),
      delivery: t("channels.delivery"),
      manual: t("channels.manual"),
    },
    statuses: {
      all: t("statuses.all"),
      confirmed: t("statuses.confirmed"),
      completed: t("statuses.completed"),
      cancelled: t("statuses.cancelled"),
    },
    kpis: {
      totalRevenue: t("totalRevenue"),
      orders: t("orders"),
      averageTicket: t("averageTicket"),
      uniqueCustomers: t("uniqueCustomers"),
      cancellationRate: t("cancellationRate"),
      averagePreparationTime: t("averagePreparationTime"),
      vsPrevious: t("vsPrevious"),
      notAvailable: tCommon("notAvailable"),
      minutesShort: t.raw("minutesShort"),
    },
    charts: {
      revenueOverTime: t("revenueOverTime"),
      ordersOverTime: t("ordersOverTime"),
      ordersByChannel: t("ordersByChannel"),
      topProducts: t("topProducts"),
      peakHours: t("peakHours"),
      kitchenPerformance: t("kitchenPerformance"),
      customerInsights: t("customerInsightsSection"),
      aiInsights: t("aiInsights"),
      revenue: t("charts.revenue"),
      orders: t("charts.orders"),
      hour: t("charts.hour"),
      product: t("charts.product"),
      quantity: t("charts.quantity"),
      share: t("charts.share"),
    },
    customerInsights: {
      uniqueCustomers: t("customerInsights.uniqueCustomers"),
      customersWithOrders: t("customerInsights.customersWithOrders"),
      reservations: t("customerInsights.reservations"),
    },
    kitchen: {
      averagePreparation: t("kitchen.averagePreparation"),
      delayedOrders: t("kitchen.delayedOrders"),
      busiestStation: t("kitchen.busiestStation"),
      stationStats: t("kitchen.stationStats"),
      emptyTitle: t("kitchen.emptyTitle"),
      emptyDescription: t("kitchen.emptyDescription"),
      todoStations: t("kitchen.todoStations"),
    },
    table: {
      product: t("table.product"),
      quantity: t("table.quantity"),
      revenue: t("table.revenue"),
      share: t("table.share"),
    },
    empty: {
      title: t("emptyTitle"),
      description: t("emptyDescription"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
    },
  };

  if (!canRead) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.header.subtitle}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium">{labels.permissions.deniedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.permissions.deniedDescription}
          </p>
        </div>
      </main>
    );
  }

  const queryClient = getQueryClient();
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const listFilters = parseAnalyticsListSearchParams(
    resolvedSearchParams,
    timezone,
  );

  if (restaurantId && organizationId) {
    const filters = toAnalyticsFilters(
      restaurantId,
      organizationId,
      listFilters,
      timezone,
      currency,
      locale,
    );

    await queryClient.prefetchQuery({
      ...analyticsDashboardQueryOptions(restaurantId, listFilters),
      queryFn: () =>
        getAnalyticsDashboardData(filters, {
          insightLabels: {
            revenueUp: t.raw("insights.revenueUp"),
            revenueDown: t.raw("insights.revenueDown"),
            topChannel: t.raw("insights.topChannel"),
            topProduct: t.raw("insights.topProduct"),
            peakHours: t.raw("insights.peakHours"),
            cancellationHigh: t.raw("insights.cancellationHigh"),
            channelLabels: {
              pos: t("channels.pos"),
              whatsapp: t("channels.whatsapp"),
              web: t("channels.web"),
              delivery: t("channels.delivery"),
              manual: t("channels.manual"),
            },
          },
        }),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalyticsPageClient
        labels={labels}
        restaurantId={restaurantId}
        restaurants={
          context?.restaurants.map((restaurant) => ({
            id: restaurant.id,
            name: restaurant.name,
          })) ?? []
        }
        timezone={timezone}
        currency={currency}
        locale={locale}
      />
    </HydrationBoundary>
  );
}
