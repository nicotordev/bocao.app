import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrderInput,
  OrderStatus,
  OrdersListResponse,
  UpdateOrderInput,
} from "@/lib/orders/types";
import {
  deleteOrderApi,
  duplicateOrderApi,
  patchOrderStatus,
  postOrder,
  updateOrderApi,
} from "@/lib/query/orders/orders.api";
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

export function useDuplicateOrderMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => duplicateOrderApi(restaurantId, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
    },
  });
}

export function useUpdateOrderMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: UpdateOrderInput }) =>
      updateOrderApi(restaurantId, orderId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(restaurantId, variables.orderId),
      });
    },
  });
}

export function useDeleteOrderMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => deleteOrderApi(restaurantId, orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(restaurantId, orderId),
      });
    },
  });
}
