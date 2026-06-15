import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrderInput,
  Order,
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
  previousLists: Array<readonly [readonly unknown[], OrdersListResponse | undefined]>;
  previousBoards: Array<
    readonly [readonly unknown[], OrdersBoardResponse | undefined]
  >;
  previousKpis: Array<
    readonly [readonly unknown[], OrdersBoardResponse | undefined]
  >;
};

type OrdersBoardResponse = {
  orders: Order[];
  restaurantId: string;
  updatedAt: string;
};

function applyOrderStatusUpdate<T extends { orders: Order[] }>(
  current: T | undefined,
  orderId: string,
  status: OrderStatus,
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    orders: current.orders.map((order) =>
      order.id === orderId ? { ...order, status } : order,
    ),
  };
}

export function useUpdateOrderStatusMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: UpdateOrderStatusVariables) =>
      patchOrderStatus(restaurantId, orderId, status),
    onMutate: async ({ orderId, status }) => {
      const listQueryKey = [...queryKeys.orders.lists(), restaurantId] as const;
      const boardQueryKey = [...queryKeys.orders.boards(), restaurantId] as const;
      const kpiQueryKey = [...queryKeys.orders.kpis(), restaurantId] as const;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: listQueryKey }),
        queryClient.cancelQueries({ queryKey: boardQueryKey }),
        queryClient.cancelQueries({ queryKey: kpiQueryKey }),
      ]);

      const previousLists = queryClient.getQueriesData<OrdersListResponse>({
        queryKey: listQueryKey,
      });
      const previousBoards = queryClient.getQueriesData<OrdersBoardResponse>({
        queryKey: boardQueryKey,
      });
      const previousKpis = queryClient.getQueriesData<OrdersBoardResponse>({
        queryKey: kpiQueryKey,
      });

      queryClient.setQueriesData<OrdersListResponse>(
        { queryKey: listQueryKey },
        (current) => applyOrderStatusUpdate(current, orderId, status),
      );

      queryClient.setQueriesData<OrdersBoardResponse>(
        { queryKey: boardQueryKey },
        (current) => applyOrderStatusUpdate(current, orderId, status),
      );

      queryClient.setQueriesData<OrdersBoardResponse>(
        { queryKey: kpiQueryKey },
        (current) => applyOrderStatusUpdate(current, orderId, status),
      );

      return { previousLists, previousBoards, previousKpis } satisfies UpdateOrderStatusContext;
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }

      for (const [queryKey, data] of context.previousBoards) {
        queryClient.setQueryData(queryKey, data);
      }

      for (const [queryKey, data] of context.previousKpis) {
        queryClient.setQueryData(queryKey, data);
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
