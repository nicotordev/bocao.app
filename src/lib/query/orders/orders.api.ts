import type { OrdersListFilters } from "@/lib/orders/filters";
import type {
  Order,
  OrdersListResponse,
  OrderStatus,
  UpdateOrderStatusResponse,
} from "@/lib/orders/types";
import { apiRequest } from "@/lib/query/api-client";

function buildOrdersSearchParams(filters?: OrdersListFilters) {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters?.channel && filters.channel !== "all") {
    params.set("channel", filters.channel);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchOrdersList(
  restaurantId: string,
  filters?: OrdersListFilters,
): Promise<OrdersListResponse> {
  return apiRequest<OrdersListResponse>(
    `/api/restaurants/${restaurantId}/orders${buildOrdersSearchParams(filters)}`,
  );
}

export async function fetchOrder(
  restaurantId: string,
  orderId: string,
): Promise<Order> {
  const response = await apiRequest<{ order: Order }>(
    `/api/restaurants/${restaurantId}/orders/${encodeURIComponent(orderId)}`,
  );

  return response.order;
}

export async function patchOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<UpdateOrderStatusResponse> {
  return apiRequest<UpdateOrderStatusResponse>(
    `/api/restaurants/${restaurantId}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: { status },
    },
  );
}
