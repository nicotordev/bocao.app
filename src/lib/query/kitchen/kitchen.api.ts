import type {
  KitchenListResponse,
  UpdateKitchenOrderResponse,
} from "@/lib/kitchen/repository";
import type { z } from "zod";
import type { updateKitchenOrderBodySchema } from "@/lib/kitchen/schemas";
import { apiRequest } from "@/lib/query/api-client";

type UpdateKitchenOrderInput = z.infer<typeof updateKitchenOrderBodySchema>;

export async function fetchKitchenOrders(
  restaurantId: string,
): Promise<KitchenListResponse> {
  return apiRequest<KitchenListResponse>(
    `/api/restaurants/${restaurantId}/kitchen`,
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
