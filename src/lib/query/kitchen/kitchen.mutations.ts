import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { KitchenListFilters } from "@/lib/kitchen/list-filters";
import type { KitchenListResponse } from "@/lib/kitchen/repository";
import type { z } from "zod";
import type { updateKitchenOrderBodySchema } from "@/lib/kitchen/schemas";
import { patchKitchenOrder } from "@/lib/query/kitchen/kitchen.api";
import { queryKeys } from "@/lib/query/query-keys";

type UpdateKitchenOrderInput = z.infer<typeof updateKitchenOrderBodySchema>;

type UpdateKitchenOrderVariables = {
  orderId: string;
} & UpdateKitchenOrderInput;

type UpdateKitchenOrderContext = {
  previous?: KitchenListResponse;
};

export function useUpdateKitchenOrderMutation(
  restaurantId: string,
  filters?: KitchenListFilters,
) {
  const queryClient = useQueryClient();
  const listQueryKey = queryKeys.kitchen.list(restaurantId, filters);

  return useMutation({
    mutationFn: ({ orderId, ...input }: UpdateKitchenOrderVariables) =>
      patchKitchenOrder(restaurantId, orderId, input),
    onMutate: async ({ orderId, status, station, assignedTo, priority }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      const previous =
        queryClient.getQueryData<KitchenListResponse>(listQueryKey);

      queryClient.setQueryData<KitchenListResponse>(listQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          orders: current.orders.map((order) => {
            if (order.id !== orderId) {
              return order;
            }

            return {
              ...order,
              ...(status ? { status } : {}),
              ...(station ? { station } : {}),
              ...(assignedTo ? { assignedTo } : {}),
              ...(priority ? { priority } : {}),
              ...(status === "waiting" ? { isPaused: true } : {}),
              ...(status === "in_preparation" ? { isPaused: false } : {}),
            };
          }),
        };
      });

      return { previous } satisfies UpdateKitchenOrderContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}
