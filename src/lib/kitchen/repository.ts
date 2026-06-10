import {
  buildKitchenPrismaWhere,
  filterKitchenOrdersByDate,
  type KitchenListFilters,
} from "@/lib/kitchen/list-filters";
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
  shouldMarkKitchenCompletedLate,
} from "@/lib/kitchen/kitchen-mapper";
import {
  buildKitchenRealtimeEvent,
  publishKitchenEventAfterCommit,
  recordKitchenEventInTx,
} from "@/lib/realtime/event-log";
import type { RecordKitchenEventInput } from "@/lib/kitchen/events";
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
      organizationId: true,
    },
  });
}

export async function listKitchenOrders(
  restaurantId: string,
  formatOptions?: OrderFormatOptions,
  filters?: KitchenListFilters,
  timezone?: string,
): Promise<KitchenListResponse> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    return {
      orders: [],
      restaurantId,
      updatedAt: new Date().toISOString(),
    };
  }

  const resolvedTimezone = timezone ?? restaurant.timezone;
  const resolvedFilters = filters ?? {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: resolvedTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  };

  const dbOrders = await prisma.order.findMany({
    where: buildKitchenPrismaWhere(
      restaurantId,
      resolvedFilters,
      resolvedTimezone,
    ),
    include: orderCustomerInclude,
    orderBy: { createdAt: "desc" },
  });

  const orders = filterKitchenOrdersByDate(
    dbOrders.map((order) =>
      mapDbOrderToKitchen(order, {
        timezone: restaurant.timezone,
        locale: formatOptions?.locale,
        customerLabels: formatOptions?.customerLabels,
      }),
    ),
    resolvedFilters.date,
  );

  return {
    orders,
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
}

function buildKitchenUpdateEvents(
  existingOrder: Parameters<typeof mapDbOrderToKitchen>[0],
  input: UpdateKitchenOrderInput,
  restaurant: NonNullable<Awaited<ReturnType<typeof getRestaurantContext>>>,
  formatOptions?: OrderFormatOptions,
): RecordKitchenEventInput[] {
  const tenantId = restaurant.organizationId;
  const restaurantId = existingOrder.restaurantId;
  const orderId = existingOrder.orderNumber;
  const events: RecordKitchenEventInput[] = [];

  const previousKitchenOrder = mapDbOrderToKitchen(existingOrder, {
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
  });

  if (input.status) {
    events.push({
      tenantId,
      restaurantId,
      payload: {
        type: "order.status.changed",
        orderId,
        fromStatus: previousKitchenOrder.status,
        toStatus: input.status,
      },
    });
  } else if (input.station || input.priority || input.assignedTo) {
    events.push({
      tenantId,
      restaurantId,
      payload: {
        type: "order.updated",
        orderId,
      },
    });
  }

  return events;
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

    if (input.status === "delivered") {
      const slaMinutes = nextKitchen.slaMinutes ?? 20;
      if (
        shouldMarkKitchenCompletedLate(
          nextKitchen,
          existing.createdAt,
          slaMinutes,
        )
      ) {
        nextKitchen.completedLate = true;
      }
    }

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

  const pendingEvents = buildKitchenUpdateEvents(
    existing,
    input,
    restaurant,
    formatOptions,
  );

  const { order, eventLogs } = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
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

    const logs = await Promise.all(
      pendingEvents.map((eventInput) => recordKitchenEventInTx(tx, eventInput)),
    );

    return { order: updatedOrder, eventLogs: logs };
  });

  await Promise.all(
    eventLogs.map((log, index) => {
      const event = buildKitchenRealtimeEvent(pendingEvents[index]!, log.id);
      return publishKitchenEventAfterCommit(event, log.id);
    }),
  );

  return mapDbOrderToKitchen(order, {
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}
