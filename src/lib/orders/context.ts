import { prisma } from "@/lib/prisma";

export type RestaurantOrderContext = {
  currency: string;
  timezone: string;
  organizationId: string;
};

export type OrderEventContext = {
  tenantId: string;
  restaurantId: string;
  orderNumber: string;
};

export async function getRestaurantOrderContext(
  restaurantId: string,
): Promise<RestaurantOrderContext | null> {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      currency: true,
      timezone: true,
      organizationId: true,
    },
  });
}

export function buildOrderEventContext(
  restaurant: RestaurantOrderContext,
  restaurantId: string,
  orderNumber: string,
): OrderEventContext {
  return {
    tenantId: restaurant.organizationId,
    restaurantId,
    orderNumber,
  };
}
