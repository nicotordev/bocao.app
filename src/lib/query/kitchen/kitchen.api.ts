import type { KitchenListFilters } from "@/lib/kitchen/list-filters";
import type {
  KitchenListResponse,
  UpdateKitchenOrderResponse,
} from "@/lib/kitchen/repository";
import type { z } from "zod";
import type { updateKitchenOrderBodySchema } from "@/lib/kitchen/schemas";
import { apiRequest } from "@/lib/query/api-client";

type UpdateKitchenOrderInput = z.infer<typeof updateKitchenOrderBodySchema>;

function buildKitchenSearchParams(filters?: KitchenListFilters) {
  const params = new URLSearchParams();

  if (filters?.date) {
    params.set("date", filters.date);
  }

  return params;
}

export async function fetchKitchenOrders(
  restaurantId: string,
  filters?: KitchenListFilters,
): Promise<KitchenListResponse> {
  const params = buildKitchenSearchParams(filters);
  const query = params.toString();

  return apiRequest<KitchenListResponse>(
    query.length > 0
      ? `/api/restaurants/${restaurantId}/kitchen?${query}`
      : `/api/restaurants/${restaurantId}/kitchen`,
  );
}

export async function patchKitchenOrder(
  restaurantId: string,
  orderId: string,
  input: UpdateKitchenOrderInput,
): Promise<UpdateKitchenOrderResponse> {
  return apiRequest<UpdateKitchenOrderResponse>(
    `/api/restaurants/${restaurantId}/kitchen/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export type KitchenRealtimeTokenResponse = {
  token: string;
  restaurantId: string;
  wsUrl: string | null;
  expiresInSeconds: number;
};

export async function fetchKitchenRealtimeToken(
  restaurantId: string,
): Promise<KitchenRealtimeTokenResponse> {
  return apiRequest<KitchenRealtimeTokenResponse>(
    `/api/restaurants/${restaurantId}/kitchen/realtime-token`,
  );
}
