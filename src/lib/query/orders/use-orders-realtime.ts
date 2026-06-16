"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { OrdersKpiFilters, OrdersListFilters } from "@/lib/orders/filters";
import { useKitchenChannelSubscription } from "@/lib/query/realtime/use-kitchen-channel-subscription";
import { queryKeys } from "@/lib/query/query-keys";
import type { KitchenRealtimePayload } from "@/lib/realtime/types";

type UseOrdersRealtimeOptions = {
  restaurantId: string;
  listFilters?: OrdersListFilters;
  boardFilters?: Omit<OrdersListFilters, "page" | "pageSize">;
  kpiFilters?: OrdersKpiFilters;
  enabled?: boolean;
};

export function useOrdersRealtime({
  restaurantId,
  listFilters,
  boardFilters,
  kpiFilters,
  enabled = true,
}: UseOrdersRealtimeOptions) {
  const queryClient = useQueryClient();

  const listQueryKey = queryKeys.orders.list(restaurantId, listFilters);
  const boardQueryKey = queryKeys.orders.board(restaurantId, boardFilters);
  const kpiQueryKey = queryKeys.orders.kpi(restaurantId, kpiFilters);

  const refetchOrders = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: listQueryKey }),
      queryClient.invalidateQueries({ queryKey: boardQueryKey }),
      queryClient.invalidateQueries({ queryKey: kpiQueryKey }),
    ]);
  }, [boardQueryKey, kpiQueryKey, listQueryKey, queryClient]);

  const handleRealtimePayload = useCallback(
    (payload: KitchenRealtimePayload) => {
      if (payload.type === "kitchen.sync") {
        refetchOrders();
        return;
      }

      const orderId =
        "orderId" in payload && typeof payload.orderId === "string"
          ? payload.orderId
          : null;

      if (orderId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.orders.details(),
        });
      }

      refetchOrders();
    },
    [queryClient, refetchOrders, restaurantId],
  );

  return useKitchenChannelSubscription({
    restaurantId,
    enabled,
    onPayload: handleRealtimePayload,
  });
}
