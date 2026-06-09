import type { ReservationsListFilters } from "@/lib/reservations/filters";
import { apiRequest } from "@/lib/query/api-client";
import type {
  CreateReservationInput,
  Reservation,
  ReservationsListResponse,
  UpdateReservationInput,
} from "@/lib/reservations/types";

function buildReservationsSearchParams(filters?: ReservationsListFilters) {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters?.from) {
    params.set("from", filters.from);
  }

  if (filters?.to) {
    params.set("to", filters.to);
  }

  if (filters?.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchReservation(
  restaurantId: string,
  reservationId: string,
): Promise<Reservation> {
  const response = await apiRequest<{ reservation: Reservation }>(
    `/api/restaurants/${restaurantId}/reservations/${encodeURIComponent(
      reservationId,
    )}`,
  );

  return response.reservation;
}

export async function fetchReservationsList(
  restaurantId: string,
  filters?: ReservationsListFilters,
): Promise<ReservationsListResponse> {
  return apiRequest<ReservationsListResponse>(
    `/api/restaurants/${restaurantId}/reservations${buildReservationsSearchParams(
      filters,
    )}`,
  );
}

export async function postReservation(
  restaurantId: string,
  input: CreateReservationInput,
): Promise<{ reservations: Reservation[] }> {
  return apiRequest<{ reservations: Reservation[] }>(
    `/api/restaurants/${restaurantId}/reservations`,
    {
      method: "POST",
      body: input,
    },
  );
}

export async function patchReservation(
  restaurantId: string,
  reservationId: string,
  input: UpdateReservationInput,
): Promise<{ reservation: Reservation }> {
  return apiRequest<{ reservation: Reservation }>(
    `/api/restaurants/${restaurantId}/reservations/${encodeURIComponent(
      reservationId,
    )}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function deleteReservationRequest(
  restaurantId: string,
  reservationId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/api/restaurants/${restaurantId}/reservations/${encodeURIComponent(
      reservationId,
    )}`,
    {
      method: "DELETE",
    },
  );
}
