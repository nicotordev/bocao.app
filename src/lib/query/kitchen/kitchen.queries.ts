import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchKitchenOrders } from "@/lib/query/kitchen/kitchen.api";
import { queryKeys } from "@/lib/query/query-keys";

export function kitchenOrdersQueryOptions(restaurantId: string) {
  return queryOptions({
    queryKey: queryKeys.kitchen.list(restaurantId),
    queryFn: () => fetchKitchenOrders(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useKitchenOrdersQuery(restaurantId: string) {
  return useQuery(kitchenOrdersQueryOptions(restaurantId));
}
