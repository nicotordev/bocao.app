"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { KitchenListFilters } from "@/lib/kitchen/list-filters";
import type { KitchenListResponse } from "@/lib/kitchen/repository";
import { useKitchenChannelSubscription } from "@/lib/query/realtime/use-kitchen-channel-subscription";
import { queryKeys } from "@/lib/query/query-keys";
import type { KitchenRealtimePayload } from "@/lib/realtime/types";

type UseKitchenRealtimeOptions = {
  restaurantId: string;
  filters?: KitchenListFilters;
  enabled?: boolean;
};

function applyIncrementalKitchenPatch(
  current: KitchenListResponse | undefined,
  payload: KitchenRealtimePayload,
): KitchenListResponse | undefined {
  if (!current) {
    return current;
  }

  if (payload.type === "order.removed") {
    return {
      ...current,
      orders: current.orders.filter((order) => order.id !== payload.orderId),
      updatedAt: new Date().toISOString(),
    };
  }

  return current;
}

export function useKitchenRealtime({
  restaurantId,
  filters,
  enabled = true,
}: UseKitchenRealtimeOptions) {
  const queryClient = useQueryClient();
  const listQueryKey = queryKeys.kitchen.list(restaurantId, filters);

  const refetchKitchen = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listQueryKey });
  }, [listQueryKey, queryClient]);

  const handleRealtimePayload = useCallback(
    (payload: KitchenRealtimePayload) => {
      if (payload.type === "kitchen.sync") {
        refetchKitchen();
        return;
      }

      if (payload.type === "order.removed") {
        queryClient.setQueryData<KitchenListResponse>(listQueryKey, (current) =>
          applyIncrementalKitchenPatch(current, payload),
        );
        return;
      }

      if (
        payload.type === "order.created" ||
        payload.type === "order.updated" ||
        payload.type === "order.status.changed" ||
        payload.type === "order.confirmed" ||
        payload.type === "order.cancelled" ||
        payload.type === "payment.created" ||
        payload.type === "payment.updated"
      ) {
        refetchKitchen();
      }
    },
    [listQueryKey, queryClient, refetchKitchen],
  );

  return useKitchenChannelSubscription({
    restaurantId,
    enabled,
    onPayload: handleRealtimePayload,
    onConnected: refetchKitchen,
  });
}
