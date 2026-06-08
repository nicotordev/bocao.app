import {
  applyOrdersListFilters,
  type OrdersListFilters,
} from "@/lib/orders/filters";
import { seedOrders } from "@/lib/orders/seed-data";
import type {
  Order,
  OrderStatus,
  OrdersListResponse,
} from "@/lib/orders/types";

const ordersByRestaurant = new Map<string, Order[]>();

function cloneOrders(orders: Order[]): Order[] {
  return structuredClone(orders);
}

function getRestaurantOrders(restaurantId: string): Order[] {
  const existing = ordersByRestaurant.get(restaurantId);

  if (existing) {
    return existing;
  }

  const seeded = cloneOrders(seedOrders);
  ordersByRestaurant.set(restaurantId, seeded);
  return seeded;
}

export async function listOrders(
  restaurantId: string,
  filters?: OrdersListFilters,
): Promise<OrdersListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const orders = applyOrdersListFilters(
    getRestaurantOrders(restaurantId),
    filters,
  );

  return {
    orders,
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
}

export async function getOrder(
  restaurantId: string,
  orderId: string,
): Promise<Order | null> {
  const orders = getRestaurantOrders(restaurantId);
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  const orders = getRestaurantOrders(restaurantId);
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    throw new Error("Order not found");
  }

  const updated: Order = {
    ...orders[index],
    status,
  };

  orders[index] = updated;
  return updated;
}
