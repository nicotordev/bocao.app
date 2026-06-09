import type { OrdersListFilters } from "@/lib/orders/filters";

export const queryKeys = {
  restaurants: {
    all: ["restaurants"] as const,
    detail: (restaurantId: string) =>
      [...queryKeys.restaurants.all, restaurantId] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (restaurantId: string, filters?: OrdersListFilters) =>
      [...queryKeys.orders.lists(), restaurantId, filters ?? {}] as const,
    boards: () => [...queryKeys.orders.all, "board"] as const,
    board: (
      restaurantId: string,
      filters?: Omit<OrdersListFilters, "page" | "pageSize">,
    ) => [...queryKeys.orders.boards(), restaurantId, filters ?? {}] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (restaurantId: string, orderId: string) =>
      [...queryKeys.orders.details(), restaurantId, orderId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    context: () => [...queryKeys.dashboard.all, "context"] as const,
    home: (restaurantId: string) =>
      [...queryKeys.dashboard.all, "home", restaurantId] as const,
  },
  reservations: {
    all: ["reservations"] as const,
    lists: () => [...queryKeys.reservations.all, "list"] as const,
    list: (restaurantId: string, filters?: any) =>
      [...queryKeys.reservations.lists(), restaurantId, filters ?? {}] as const,
    details: () => [...queryKeys.reservations.all, "detail"] as const,
    detail: (restaurantId: string, reservationId: string) =>
      [
        ...queryKeys.reservations.details(),
        restaurantId,
        reservationId,
      ] as const,
  },
  kitchen: {
    all: ["kitchen"] as const,
    lists: () => [...queryKeys.kitchen.all, "list"] as const,
    list: (restaurantId: string) =>
      [...queryKeys.kitchen.lists(), restaurantId] as const,
  },
} as const;
