import type { OrderStatus } from "@/generated/prisma/client";

/** In-flight order statuses shared by kitchen queue and floor-plan occupancy. */
export const IN_FLIGHT_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
] as const satisfies readonly OrderStatus[];

const KITCHEN_ACTIVE_STATUSES: OrderStatus[] = [...IN_FLIGHT_ORDER_STATUSES];

const KITCHEN_EXCLUDED_STATUSES: OrderStatus[] = ["DRAFT"];

export function isKitchenExcludedStatus(status: OrderStatus): boolean {
  return KITCHEN_EXCLUDED_STATUSES.includes(status);
}

export function isKitchenActiveStatus(status: OrderStatus): boolean {
  return (
    !isKitchenExcludedStatus(status) && KITCHEN_ACTIVE_STATUSES.includes(status)
  );
}

export function isKitchenQueueStatus(status: OrderStatus): boolean {
  return isKitchenActiveStatus(status) || status === "COMPLETED";
}

export function shouldEmitKitchenOrderCreated(status: OrderStatus): boolean {
  return !isKitchenExcludedStatus(status) && isKitchenQueueStatus(status);
}

export function resolveKitchenRemovalReason(
  status: OrderStatus,
): "cancelled" | "completed" | "not_kitchen_relevant" | null {
  if (status === "CANCELLED") {
    return "cancelled";
  }

  if (!isKitchenQueueStatus(status)) {
    return "not_kitchen_relevant";
  }

  return null;
}
