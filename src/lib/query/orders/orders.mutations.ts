import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrderInput,
  OrderStatus,
  OrdersListResponse,
} from "@/lib/orders/types";
import { patchOrderStatus, postOrder } from "@/lib/query/orders/orders.api";
import { queryKeys } from "@/lib/query/query-keys";

type UpdateOrderStatusVariables = {
  orderId: string;
  status: OrderStatus;
};

type UpdateOrderStatusContext = {
  previous?: OrdersListResponse;
};

export function useUpdateOrderStatusMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  const listQueryKey = queryKeys.orders.list(restaurantId);

  return useMutation({
    mutationFn: ({ orderId, status }: UpdateOrderStatusVariables) =>
      patchOrderStatus(restaurantId, orderId, status),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      const previous =
        queryClient.getQueryData<OrdersListResponse>(listQueryKey);

      queryClient.setQueryData<OrdersListResponse>(listQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          orders: current.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        };
      });

      return { previous } satisfies UpdateOrderStatusContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listQueryKey, context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(restaurantId, variables.orderId),
      });
    },
  });
}

export function useCreateOrderMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => postOrder(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
    },
  });
}
