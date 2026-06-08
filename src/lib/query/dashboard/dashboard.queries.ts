import { queryOptions, useQuery } from "@tanstack/react-query";
import type { DashboardHomeData } from "@/lib/dashboard/data";
import { apiRequest } from "@/lib/query/api-client";
import { queryKeys } from "@/lib/query/query-keys";

type DashboardHomeResponse = {
  data: DashboardHomeData;
  restaurantId: string;
  updatedAt: string;
};

export async function fetchDashboardHome(
  restaurantId: string,
): Promise<DashboardHomeResponse> {
  return apiRequest<DashboardHomeResponse>(
    `/api/dashboard/home?restaurantId=${encodeURIComponent(restaurantId)}`,
  );
}

export function dashboardHomeQueryOptions(restaurantId: string) {
  return queryOptions({
    queryKey: queryKeys.dashboard.home(restaurantId),
    queryFn: () => fetchDashboardHome(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: 60_000,
  });
}

export function useDashboardHomeQuery(restaurantId: string) {
  return useQuery(dashboardHomeQueryOptions(restaurantId));
}
