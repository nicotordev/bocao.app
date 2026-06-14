import type { OrdersListFilters } from "@/lib/orders/filters";
import type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrdersListResponse,
  OrderStatus,
  UpdateOrderStatusResponse,
  UpdateOrderInput,
  UpdateOrderResponse,
} from "@/lib/orders/types";
import { apiRequest } from "@/lib/query/api-client";

function buildOrdersSearchParams(
  filters?: Partial<OrdersListFilters>,
  options?: { mode?: "list" | "board" },
) {
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

  if (filters?.from) {
    params.set("from", filters.from);
  }

  if (filters?.to) {
    params.set("to", filters.to);
  }

  if (filters?.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  if (options?.mode === "board") {
    params.set("mode", "board");
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

export async function fetchOrdersBoard(
  restaurantId: string,
  filters?: Omit<OrdersListFilters, "page" | "pageSize">,
): Promise<{ orders: Order[]; restaurantId: string; updatedAt: string }> {
  return apiRequest<{
    orders: Order[];
    restaurantId: string;
    updatedAt: string;
  }>(
    `/api/restaurants/${restaurantId}/orders${buildOrdersSearchParams(filters, {
      mode: "board",
    })}`,
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

export async function postOrder(
  restaurantId: string,
  input: CreateOrderInput,
): Promise<CreateOrderResponse> {
  return apiRequest<CreateOrderResponse>(
    `/api/restaurants/${restaurantId}/orders`,
    {
      method: "POST",
      body: input,
    },
  );
}

export async function duplicateOrderApi(
  restaurantId: string,
  orderId: string,
): Promise<CreateOrderResponse> {
  return apiRequest<CreateOrderResponse>(
    `/api/restaurants/${restaurantId}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "POST",
      body: { action: "duplicate" },
    },
  );
}

export async function updateOrderApi(
  restaurantId: string,
  orderId: string,
  input: UpdateOrderInput,
): Promise<UpdateOrderResponse> {
  return apiRequest<UpdateOrderResponse>(
    `/api/restaurants/${restaurantId}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function deleteOrderApi(
  restaurantId: string,
  orderId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/restaurants/${restaurantId}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "DELETE",
    },
  );
}
