import type { Order } from "@/lib/orders/types";

export type OrdersKpiTrend = {
  change: string;
  trend: "up" | "down" | "neutral";
};

export type OrdersKpiTrendValues = {
  active?: OrdersKpiTrend;
  preparing?: OrdersKpiTrend;
  ready?: OrdersKpiTrend;
  sales?: OrdersKpiTrend;
};

type OrdersKpiTrendLabels = {
  notAvailable: string;
  preparingCount: string;
  readyCount: string;
};

export function computeOrdersKpiTrends(
  orders: Order[],
  labels: OrdersKpiTrendLabels,
): OrdersKpiTrendValues {
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );
  const preparingOrders = activeOrders.filter(
    (order) => order.status === "preparing",
  );
  const readyOrders = activeOrders.filter((order) => order.status === "ready");

  return {
    active: { change: labels.notAvailable, trend: "neutral" },
    preparing:
      preparingOrders.length > 0
        ? {
            change: labels.preparingCount.replace(
              "{count}",
              String(preparingOrders.length),
            ),
            trend: "neutral",
          }
        : { change: labels.notAvailable, trend: "neutral" },
    ready:
      readyOrders.length > 0
        ? {
            change: labels.readyCount.replace(
              "{count}",
              String(readyOrders.length),
            ),
            trend: "up",
          }
        : { change: labels.notAvailable, trend: "neutral" },
    sales: { change: labels.notAvailable, trend: "neutral" },
  };
}
