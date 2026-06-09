import { isKitchenOrderActiveDelayed } from "./filters";
import type { KitchenKpiValues, KitchenOrder } from "./types";

export function computeKitchenKpis(orders: KitchenOrder[]): KitchenKpiValues {
  const activeOrders = orders.filter((order) => order.status !== "delivered");

  const preparingOrders = orders.filter(
    (order) =>
      order.status === "in_preparation" ||
      order.status === "delayed" ||
      order.status === "waiting" ||
      order.status === "received",
  );

  const readyOrders = orders.filter((order) => order.status === "ready");

  const delayedOrders = orders.filter((order) =>
    isKitchenOrderActiveDelayed(order),
  );

  const averageMinutes =
    preparingOrders.length === 0
      ? 0
      : Math.round(
          preparingOrders.reduce(
            (total, order) => total + order.elapsedMinutes,
            0,
          ) / preparingOrders.length,
        );

  return {
    active: String(activeOrders.length),
    averageTime: `${averageMinutes} min`,
    delayed: String(delayedOrders.length),
    ready: String(readyOrders.length),
  };
}
