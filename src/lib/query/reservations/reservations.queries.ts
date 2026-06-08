import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchReservationsList } from "@/lib/query/reservations/reservations.api";

export function reservationsListQueryOptions(
  restaurantId: string,
  filters?: {
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  },
) {
  return queryOptions({
    queryKey: queryKeys.reservations.list(restaurantId, filters),
    queryFn: () => fetchReservationsList(restaurantId, filters),
    enabled: restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function useReservationsListQuery(
  restaurantId: string,
  filters?: {
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  },
) {
  return useQuery(reservationsListQueryOptions(restaurantId, filters));
}
