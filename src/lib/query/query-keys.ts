import type { CustomersListFilters } from "@/lib/customers/filters";
import type { OrdersKpiFilters, OrdersListFilters } from "@/lib/orders/filters";

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
    kpis: () => [...queryKeys.orders.all, "kpi"] as const,
    kpi: (restaurantId: string, filters?: OrdersKpiFilters) =>
      [...queryKeys.orders.kpis(), restaurantId, filters ?? {}] as const,
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
    list: (restaurantId: string, filters?: Record<string, unknown>) =>
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
    stations: () => [...queryKeys.kitchen.all, "stations"] as const,
    stationsList: (restaurantId: string) =>
      [...queryKeys.kitchen.stations(), restaurantId] as const,
  },
  menu: {
    all: ["menu"] as const,
    importable: (restaurantId: string) =>
      [...queryKeys.menu.all, "importable", restaurantId] as const,
  },
  customers: {
    all: ["customers"] as const,
    pages: () => [...queryKeys.customers.all, "page"] as const,
    page: (restaurantId: string, filters?: CustomersListFilters) =>
      [...queryKeys.customers.pages(), restaurantId, filters ?? {}] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (restaurantId: string, customerId: string) =>
      [...queryKeys.customers.details(), restaurantId, customerId] as const,
    importable: (restaurantId: string) =>
      [...queryKeys.customers.all, "importable", restaurantId] as const,
  },
} as const;
