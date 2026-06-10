import type { OrderStatus } from "@/generated/prisma/client";

const KITCHEN_ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
];

export function isKitchenActiveStatus(status: OrderStatus): boolean {
  return KITCHEN_ACTIVE_STATUSES.includes(status);
}

export function isKitchenQueueStatus(status: OrderStatus): boolean {
  return isKitchenActiveStatus(status) || status === "COMPLETED";
}

export function shouldEmitKitchenOrderCreated(status: OrderStatus): boolean {
  return isKitchenQueueStatus(status);
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
