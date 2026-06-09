import type {
  KitchenFiltersState,
  KitchenKanbanStatus,
  KitchenOrder,
  KitchenOrderStatus,
} from "./types";

export function isKitchenOrderCompletedLate(order: KitchenOrder): boolean {
  return (
    order.status === "delivered" &&
    (order.completedLate === true ||
      order.priority === "delayed" ||
      order.elapsedMinutes > order.slaMinutes)
  );
}

export function isKitchenOrderActiveDelayed(order: KitchenOrder): boolean {
  if (order.status === "delivered") {
    return false;
  }

  return (
    order.status === "delayed" ||
    order.priority === "delayed" ||
    order.elapsedMinutes > order.slaMinutes
  );
}

export function isKitchenOrderDelayed(order: KitchenOrder): boolean {
  return (
    isKitchenOrderActiveDelayed(order) || isKitchenOrderCompletedLate(order)
  );
}

export function resolveKanbanStatus(
  status: KitchenOrderStatus,
): KitchenKanbanStatus {
  if (status === "delayed") {
    return "in_preparation";
  }

  return status;
}

export function applyKitchenFilters(
  orders: KitchenOrder[],
  filters: KitchenFiltersState,
): KitchenOrder[] {
  const query = filters.search.trim().toLowerCase();

  return orders.filter((order) => {
    if (filters.station !== "all" && order.station !== filters.station) {
      return false;
    }

    if (filters.priority !== "all") {
      if (filters.priority === "delayed") {
        if (!isKitchenOrderDelayed(order)) {
          return false;
        }
      } else if (order.priority !== filters.priority) {
        return false;
      }
    }

    if (filters.channel !== "all" && order.channel !== filters.channel) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      order.number,
      order.customerName,
      order.tableNumber ? `mesa ${order.tableNumber}` : "",
      ...order.items.map((item) => item.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortKitchenOrders(orders: KitchenOrder[]): KitchenOrder[] {
  const priorityWeight: Record<KitchenOrder["priority"], number> = {
    delayed: 0,
    urgent: 1,
    high: 2,
    normal: 3,
  };

  return [...orders].sort((left, right) => {
    const leftDelayed = isKitchenOrderDelayed(left);
    const rightDelayed = isKitchenOrderDelayed(right);

    if (leftDelayed !== rightDelayed) {
      return leftDelayed ? -1 : 1;
    }

    const priorityDiff =
      priorityWeight[left.priority] - priorityWeight[right.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.elapsedMinutes - left.elapsedMinutes;
  });
}
