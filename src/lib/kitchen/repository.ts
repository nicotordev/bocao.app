import { startOfDay } from "date-fns";
import type { OrderFormatOptions } from "@/lib/orders/format-options";
import { orderCustomerInclude } from "@/lib/orders/order-customers";
import { prisma } from "@/lib/prisma";
import {
  appendKitchenTimelineEvent,
  kitchenStatusToTimelineKey,
  mapDbOrderToKitchen,
  mapKitchenStatusToDbStatus,
  mapKitchenStatusToKitchenDetails,
  parseOrderDetails,
} from "@/lib/kitchen/kitchen-mapper";
import type { KitchenOrder, KitchenStation } from "@/lib/kitchen/types";
import type { z } from "zod";
import type { updateKitchenOrderBodySchema } from "@/lib/kitchen/schemas";

type UpdateKitchenOrderInput = z.infer<typeof updateKitchenOrderBodySchema>;

export type KitchenListResponse = {
  orders: KitchenOrder[];
  restaurantId: string;
  updatedAt: string;
};

export type UpdateKitchenOrderResponse = {
  order: KitchenOrder;
};

async function getRestaurantContext(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      currency: true,
      timezone: true,
    },
  });
}

export async function listKitchenOrders(
  restaurantId: string,
  formatOptions?: OrderFormatOptions,
): Promise<KitchenListResponse> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    return {
      orders: [],
      restaurantId,
      updatedAt: new Date().toISOString(),
    };
  }

  const todayStart = startOfDay(new Date());

  const dbOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      OR: [
        {
          status: {
            in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
          },
        },
        {
          status: "COMPLETED",
          updatedAt: { gte: todayStart },
        },
      ],
    },
    include: orderCustomerInclude,
    orderBy: { createdAt: "desc" },
  });

  const orders = dbOrders.map((order) =>
    mapDbOrderToKitchen(order, {
      timezone: restaurant.timezone,
      locale: formatOptions?.locale,
      customerLabels: formatOptions?.customerLabels,
    }),
  );

  return {
    orders,
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateKitchenOrder(
  restaurantId: string,
  orderId: string,
  input: UpdateKitchenOrderInput,
  actorName?: string,
  formatOptions?: OrderFormatOptions,
): Promise<KitchenOrder> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const existing = await prisma.order.findUnique({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    include: orderCustomerInclude,
  });

  if (!existing) {
    throw new Error("Order not found");
  }

  const currentDetails = parseOrderDetails(existing.details);
  const currentKitchen = currentDetails.kitchen ?? {};

  let nextKitchen = { ...currentKitchen };
  let nextDetails = { ...currentDetails };
  let nextStatus = existing.status;
  let nextAssignedTo = existing.assignedTo;

  if (input.station) {
    nextKitchen.station = input.station as KitchenStation;
  }

  if (input.assignedTo) {
    nextAssignedTo = input.assignedTo;
  }

  if (input.priority) {
    nextKitchen.priority = input.priority;
  }

  if (input.status) {
    nextStatus = mapKitchenStatusToDbStatus(input.status);
    nextKitchen = mapKitchenStatusToKitchenDetails(input.status, nextKitchen);

    const timelineKey = kitchenStatusToTimelineKey(input.status);

    if (timelineKey) {
      nextDetails = appendKitchenTimelineEvent(
        nextDetails,
        {
          titleKey: timelineKey,
          actor:
            input.assignedTo ?? actorName ?? existing.assignedTo ?? undefined,
          channel: existing.channel ?? undefined,
        },
        restaurant.timezone,
      );
    }
  }

  nextDetails.kitchen = nextKitchen;

  const order = await prisma.order.update({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    data: {
      status: nextStatus,
      assignedTo: nextAssignedTo,
      details: nextDetails,
    },
    include: orderCustomerInclude,
  });

  return mapDbOrderToKitchen(order, {
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}
