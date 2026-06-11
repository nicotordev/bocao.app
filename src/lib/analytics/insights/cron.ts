import "server-only";

import { generateAnalyticsInsights } from "@/lib/analytics/ai/generate-analytics-insights";
import {
  getAnalyticsFallbackInsightLabels,
  getAnalyticsKitchenStationLabels,
  getSupportedInsightLocales,
} from "@/lib/analytics/insights/fallback-labels";
import {
  listRestaurantsForInsightsCron,
  upsertAnalyticsInsightSnapshot,
} from "@/lib/analytics/insights/repository";
import {
  parseAnalyticsListSearchParams,
  toAnalyticsFilters,
} from "@/lib/analytics/filters";
import { getAnalyticsDashboardMetrics } from "@/lib/analytics/service";

const CRON_PRESET = "last7days" as const;
const CRON_CHANNEL = "all" as const;
const CRON_STATUS = "all" as const;

export type AnalyticsInsightsCronResult = {
  processed: number;
  generated: number;
  skipped: number;
  errors: Array<{ restaurantId: string; locale: string; error: string }>;
};

function resolveLocalesForRestaurant(contentLocales: string[]) {
  const supported = new Set<string>(getSupportedInsightLocales());
  const locales = contentLocales.filter((locale) => supported.has(locale));

  return locales.length > 0 ? locales : getSupportedInsightLocales();
}

export async function runAnalyticsInsightsCron(): Promise<AnalyticsInsightsCronResult> {
  const restaurants = await listRestaurantsForInsightsCron();
  const result: AnalyticsInsightsCronResult = {
    processed: 0,
    generated: 0,
    skipped: 0,
    errors: [],
  };

  for (const restaurant of restaurants) {
    const locales = resolveLocalesForRestaurant(restaurant.contentLocales);

    for (const locale of locales) {
      result.processed += 1;

      try {
        const listFilters = parseAnalyticsListSearchParams(
          {
            preset: CRON_PRESET,
            channel: CRON_CHANNEL,
            status: CRON_STATUS,
          },
          restaurant.timezone,
        );

        const filters = toAnalyticsFilters(
          restaurant.id,
          restaurant.organizationId,
          listFilters,
          restaurant.timezone,
          restaurant.currency,
          locale,
        );

        const fallbackLabels = getAnalyticsFallbackInsightLabels(locale);
        const dashboard = await getAnalyticsDashboardMetrics(filters, {
          kitchenStationLabels: getAnalyticsKitchenStationLabels(locale),
        });

        const hasData =
          dashboard.overview.totalOrders > 0 ||
          dashboard.overview.totalRevenue > 0 ||
          dashboard.customerInsights.reservationCount > 0;

        if (!hasData) {
          result.skipped += 1;
          continue;
        }

        const { insights, source } = await generateAnalyticsInsights({
          restaurantName: restaurant.name,
          locale,
          currency: restaurant.currency,
          dashboard,
          fallbackLabels,
        });

        if (insights.length === 0) {
          result.skipped += 1;
          continue;
        }

        await upsertAnalyticsInsightSnapshot(
          {
            restaurantId: restaurant.id,
            locale,
            preset: CRON_PRESET,
            channel: CRON_CHANNEL,
            status: CRON_STATUS,
          },
          { insights, source },
        );

        result.generated += 1;
      } catch (error) {
        result.errors.push({
          restaurantId: restaurant.id,
          locale,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return result;
}
