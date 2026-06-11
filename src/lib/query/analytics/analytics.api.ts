import type { AnalyticsListFilters } from "@/lib/analytics/filters";
import type { AnalyticsDashboardData } from "@/lib/analytics/types";
import { apiRequest } from "@/lib/query/api-client";

function buildAnalyticsSearchParams(filters: AnalyticsListFilters) {
  const params = new URLSearchParams();

  if (filters.preset !== "custom") {
    params.set("preset", filters.preset);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.channel !== "all") {
    params.set("channel", filters.channel);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchAnalyticsDashboard(
  restaurantId: string,
  filters: AnalyticsListFilters,
): Promise<AnalyticsDashboardData> {
  const query = buildAnalyticsSearchParams(filters);
  return apiRequest<AnalyticsDashboardData>(
    `/api/restaurants/${restaurantId}/analytics${query}`,
  );
}
