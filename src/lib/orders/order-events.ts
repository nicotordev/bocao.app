import type { OrderStatus as DbOrderStatus } from "@/generated/prisma/client";
import {
  isKitchenQueueStatus,
  resolveKitchenRemovalReason,
  shouldEmitKitchenOrderCreated,
} from "@/lib/kitchen/kitchen-queue";
import type { RecordKitchenEventInput } from "@/lib/kitchen/events";
import type { OrderEventContext } from "@/lib/orders/context";

function baseEvent(
  ctx: OrderEventContext,
): Pick<RecordKitchenEventInput, "tenantId" | "restaurantId"> {
  return { tenantId: ctx.tenantId, restaurantId: ctx.restaurantId };
}

export function buildOrderCreatedEvents(
  ctx: OrderEventContext,
  status: DbOrderStatus,
  intent: "draft" | "confirm",
): RecordKitchenEventInput[] {
  if (intent === "draft" || status === "DRAFT") {
    return [];
  }

  const events: RecordKitchenEventInput[] = [
    {
      ...baseEvent(ctx),
      payload: { type: "order.confirmed", orderId: ctx.orderNumber },
    },
  ];

  if (shouldEmitKitchenOrderCreated(status)) {
    events.unshift({
      ...baseEvent(ctx),
      payload: { type: "order.created", orderId: ctx.orderNumber },
    });
  }

  return events;
}

export function buildPaymentCreatedEvent(
  ctx: OrderEventContext,
  paymentId: string,
): RecordKitchenEventInput {
  return {
    ...baseEvent(ctx),
    payload: {
      type: "payment.created",
      orderId: ctx.orderNumber,
      paymentId,
    },
  };
}

export function buildPaymentUpdatedEvent(
  ctx: OrderEventContext,
  paymentId: string,
): RecordKitchenEventInput {
  return {
    ...baseEvent(ctx),
    payload: {
      type: "payment.updated",
      orderId: ctx.orderNumber,
      paymentId,
    },
  };
}

export function buildOrderUpdatedEvent(
  ctx: OrderEventContext,
): RecordKitchenEventInput {
  return {
    ...baseEvent(ctx),
    payload: { type: "order.updated", orderId: ctx.orderNumber },
  };
}

export function buildOrderCancelledEvent(
  ctx: OrderEventContext,
): RecordKitchenEventInput {
  return {
    ...baseEvent(ctx),
    payload: { type: "order.cancelled", orderId: ctx.orderNumber },
  };
}

export function buildOrderStatusChangeEvents(
  ctx: OrderEventContext,
  previousStatus: DbOrderStatus,
  nextStatus: DbOrderStatus,
): RecordKitchenEventInput[] {
  const removalReason = resolveKitchenRemovalReason(nextStatus);
  const wasInKitchen = isKitchenQueueStatus(previousStatus);
  const isInKitchen = isKitchenQueueStatus(nextStatus);

  if (nextStatus === "CANCELLED") {
    const events: RecordKitchenEventInput[] = [buildOrderCancelledEvent(ctx)];

    if (removalReason && wasInKitchen) {
      events.push({
        ...baseEvent(ctx),
        payload: {
          type: "order.removed",
          orderId: ctx.orderNumber,
          reason: removalReason,
        },
      });
    }

    return events;
  }

  if (removalReason && wasInKitchen) {
    return [
      {
        ...baseEvent(ctx),
        payload: {
          type: "order.removed",
          orderId: ctx.orderNumber,
          reason: removalReason,
        },
      },
    ];
  }

  if (!wasInKitchen && isInKitchen) {
    return [
      {
        ...baseEvent(ctx),
        payload: { type: "order.created", orderId: ctx.orderNumber },
      },
      {
        ...baseEvent(ctx),
        payload: { type: "order.confirmed", orderId: ctx.orderNumber },
      },
    ];
  }

  if (wasInKitchen && isInKitchen && previousStatus !== nextStatus) {
    return [
      {
        ...baseEvent(ctx),
        payload: {
          type: "order.status.changed",
          orderId: ctx.orderNumber,
          fromStatus: previousStatus,
          toStatus: nextStatus,
        },
      },
    ];
  }

  if (wasInKitchen && isInKitchen) {
    return [buildOrderUpdatedEvent(ctx)];
  }

  return [];
}
