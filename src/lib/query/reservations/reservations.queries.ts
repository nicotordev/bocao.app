import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  fetchReservation,
  fetchReservationsList,
} from "@/lib/query/reservations/reservations.api";

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

export function reservationDetailQueryOptions(
  restaurantId: string,
  reservationId: string,
) {
  return queryOptions({
    queryKey: queryKeys.reservations.detail(restaurantId, reservationId),
    queryFn: () => fetchReservation(restaurantId, reservationId),
    enabled: restaurantId.length > 0 && reservationId.length > 0,
    staleTime: 30_000,
  });
}

export function useReservationDetailQuery(
  restaurantId: string,
  reservationId: string,
) {
  return useQuery(reservationDetailQueryOptions(restaurantId, reservationId));
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
