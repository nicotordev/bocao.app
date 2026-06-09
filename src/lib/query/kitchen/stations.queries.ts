import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchKitchenStations } from "@/lib/query/kitchen/stations.api";
import { queryKeys } from "@/lib/query/query-keys";

export function kitchenStationsQueryOptions(restaurantId: string) {
  return queryOptions({
    queryKey: queryKeys.kitchen.stationsList(restaurantId),
    queryFn: () => fetchKitchenStations(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: 15_000,
  });
}

export function useKitchenStationsQuery(restaurantId: string) {
  return useQuery(kitchenStationsQueryOptions(restaurantId));
}
