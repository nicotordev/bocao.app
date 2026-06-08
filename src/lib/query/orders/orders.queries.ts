import { queryOptions, useQuery } from "@tanstack/react-query";
import type { OrdersListFilters } from "@/lib/orders/filters";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchOrder, fetchOrdersList } from "@/lib/query/orders/orders.api";

export function ordersListQueryOptions(
  restaurantId: string,
  filters?: OrdersListFilters,
) {
  return queryOptions({
    queryKey: queryKeys.orders.list(restaurantId, filters),
    queryFn: () => fetchOrdersList(restaurantId, filters),
    enabled: restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function orderDetailQueryOptions(restaurantId: string, orderId: string) {
  return queryOptions({
    queryKey: queryKeys.orders.detail(restaurantId, orderId),
    queryFn: () => fetchOrder(restaurantId, orderId),
    enabled: restaurantId.length > 0 && orderId.length > 0,
    staleTime: 30_000,
  });
}

export function useOrdersListQuery(
  restaurantId: string,
  filters?: OrdersListFilters,
) {
  return useQuery(ordersListQueryOptions(restaurantId, filters));
}

export function useOrderDetailQuery(restaurantId: string, orderId: string) {
  return useQuery(orderDetailQueryOptions(restaurantId, orderId));
}
