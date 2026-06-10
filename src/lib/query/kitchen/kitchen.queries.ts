import { queryOptions, useQuery } from "@tanstack/react-query";
import type { KitchenListFilters } from "@/lib/kitchen/list-filters";
import { fetchKitchenOrders } from "@/lib/query/kitchen/kitchen.api";
import { queryKeys } from "@/lib/query/query-keys";

export function kitchenOrdersQueryOptions(
  restaurantId: string,
  filters?: KitchenListFilters,
) {
  return queryOptions({
    queryKey: queryKeys.kitchen.list(restaurantId, filters),
    queryFn: () => fetchKitchenOrders(restaurantId, filters),
    enabled: restaurantId.length > 0,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useKitchenOrdersQuery(
  restaurantId: string,
  filters?: KitchenListFilters,
) {
  return useQuery(kitchenOrdersQueryOptions(restaurantId, filters));
}
