import { queryOptions, useQuery } from "@tanstack/react-query";
import type { AnalyticsListFilters } from "@/lib/analytics/filters";
import { fetchAnalyticsDashboard } from "@/lib/query/analytics/analytics.api";
import { queryKeys } from "@/lib/query/query-keys";

export function analyticsDashboardQueryOptions(
  restaurantId: string,
  filters: AnalyticsListFilters,
) {
  return queryOptions({
    queryKey: queryKeys.analytics.dashboard(restaurantId, filters),
    queryFn: () => fetchAnalyticsDashboard(restaurantId, filters),
    enabled: restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function useAnalyticsDashboardQuery(
  restaurantId: string,
  filters: AnalyticsListFilters,
) {
  return useQuery(analyticsDashboardQueryOptions(restaurantId, filters));
}
