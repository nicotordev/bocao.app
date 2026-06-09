import {
  isKitchenOrderActiveDelayed,
  isKitchenOrderCompletedLate,
} from "@/lib/kitchen/filters";
import type { KitchenOrder } from "@/lib/kitchen/types";
import { cn } from "@/lib/utils";

export function getKitchenOrderCardClassName(
  order: KitchenOrder,
  className?: string,
) {
  return cn(
    isKitchenOrderActiveDelayed(order) &&
      "border-destructive/40 ring-1 ring-destructive/15",
    isKitchenOrderCompletedLate(order) &&
      "border-warning/45 bg-warning/5 ring-1 ring-warning/20",
    order.status === "delivered" &&
      !isKitchenOrderCompletedLate(order) &&
      "border-primary/25 bg-primary/5",
    !isKitchenOrderActiveDelayed(order) &&
      !isKitchenOrderCompletedLate(order) &&
      order.status !== "delivered" &&
      "border-border/70",
    className,
  );
}
