import {
  buildKitchenRealtimeEvent,
  emitKitchenEventAfterCommit,
  emitKitchenEventsAfterCommit,
  publishKitchenEventAfterCommit,
  recordKitchenEventInTx,
  type RecordKitchenEventInput,
} from "@/lib/realtime/event-log";
import type {
  AppRealtimeEvent,
  KitchenRealtimePayload,
} from "@/lib/realtime/types";

export type { RecordKitchenEventInput };

export async function publishKitchenEvent(
  input: RecordKitchenEventInput,
): Promise<void> {
  await emitKitchenEventAfterCommit(input);
}

export async function publishKitchenEvents(
  inputs: RecordKitchenEventInput[],
): Promise<void> {
  await emitKitchenEventsAfterCommit(inputs);
}

export {
  buildKitchenRealtimeEvent,
  publishKitchenEventAfterCommit,
  recordKitchenEventInTx,
};

export function buildKitchenEventInput(
  tenantId: string,
  restaurantId: string,
  payload: KitchenRealtimePayload,
): RecordKitchenEventInput {
  return { tenantId, restaurantId, payload };
}

export function createKitchenStatusChangedPayload(
  orderId: string,
  fromStatus: string,
  toStatus: string,
): KitchenRealtimePayload {
  return {
    type: "order.status.changed",
    orderId,
    fromStatus,
    toStatus,
  };
}

export function createKitchenOrderUpdatedPayload(
  orderId: string,
): KitchenRealtimePayload {
  return {
    type: "order.updated",
    orderId,
  };
}

export function createKitchenOrderCreatedPayload(
  orderId: string,
): KitchenRealtimePayload {
  return {
    type: "order.created",
    orderId,
  };
}

export function createKitchenOrderRemovedPayload(
  orderId: string,
  reason: Extract<KitchenRealtimePayload, { type: "order.removed" }>["reason"],
): KitchenRealtimePayload {
  return {
    type: "order.removed",
    orderId,
    reason,
  };
}

export function isKitchenRealtimePayload(
  value: unknown,
): value is KitchenRealtimePayload {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;

  return (
    type === "order.created" ||
    type === "order.confirmed" ||
    type === "order.updated" ||
    type === "order.cancelled" ||
    type === "order.status.changed" ||
    type === "order.removed" ||
    type === "payment.created" ||
    type === "payment.updated" ||
    type === "kitchen.sync"
  );
}

export type { AppRealtimeEvent, KitchenRealtimePayload };
