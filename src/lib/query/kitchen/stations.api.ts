import type { KitchenStationsListResponse } from "@/lib/kitchen/stations/types";
import type { z } from "zod";
import {
  createKitchenStationBodySchema,
  createUpdateKitchenStationBodySchema,
} from "@/lib/kitchen/stations/schemas";
import { apiRequest } from "@/lib/query/api-client";
import type { KitchenStationWithStats } from "@/lib/kitchen/stations/types";

type CreateKitchenStationInput = z.infer<
  ReturnType<typeof createKitchenStationBodySchema>
>;
type UpdateKitchenStationInput = z.infer<
  ReturnType<typeof createUpdateKitchenStationBodySchema>
>;

export async function fetchKitchenStations(
  restaurantId: string,
): Promise<KitchenStationsListResponse> {
  return apiRequest<KitchenStationsListResponse>(
    `/api/restaurants/${restaurantId}/kitchen/stations`,
  );
}

export async function createKitchenStationRequest(
  restaurantId: string,
  input: CreateKitchenStationInput,
): Promise<{ station: KitchenStationWithStats }> {
  return apiRequest<{ station: KitchenStationWithStats }>(
    `/api/restaurants/${restaurantId}/kitchen/stations`,
    {
      method: "POST",
      body: input,
    },
  );
}

export async function updateKitchenStationRequest(
  restaurantId: string,
  stationId: string,
  input: UpdateKitchenStationInput,
): Promise<{ station: KitchenStationWithStats }> {
  return apiRequest<{ station: KitchenStationWithStats }>(
    `/api/restaurants/${restaurantId}/kitchen/stations/${stationId}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function toggleKitchenStationActiveRequest(
  restaurantId: string,
  stationId: string,
): Promise<{ station: KitchenStationWithStats }> {
  return apiRequest<{ station: KitchenStationWithStats }>(
    `/api/restaurants/${restaurantId}/kitchen/stations/${stationId}`,
    {
      method: "PATCH",
      body: { toggleActive: true },
    },
  );
}

export async function reorderKitchenStationRequest(
  restaurantId: string,
  stationId: string,
  direction: "up" | "down",
): Promise<KitchenStationsListResponse> {
  return apiRequest<KitchenStationsListResponse>(
    `/api/restaurants/${restaurantId}/kitchen/stations/${stationId}`,
    {
      method: "PATCH",
      body: { direction },
    },
  );
}

export async function deleteKitchenStationRequest(
  restaurantId: string,
  stationId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/restaurants/${restaurantId}/kitchen/stations/${stationId}`,
    {
      method: "DELETE",
    },
  );
}
