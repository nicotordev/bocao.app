import { isKitchenOrderActiveDelayed } from "@/lib/kitchen/filters";
import type { KitchenOrder } from "@/lib/kitchen/types";

export type KitchenKpiTrend = {
  change: string;
  trend: "up" | "down" | "neutral";
};

export type KitchenKpiTrendValues = {
  active?: KitchenKpiTrend;
  averageTime?: KitchenKpiTrend;
  delayed?: KitchenKpiTrend;
  ready?: KitchenKpiTrend;
};

type KitchenKpiTrendLabels = {
  notAvailable: string;
  delayedAttention: string;
  preparingCount: string;
};

export function computeKitchenKpiTrends(
  orders: KitchenOrder[],
  labels: KitchenKpiTrendLabels,
): KitchenKpiTrendValues {
  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const preparingOrders = orders.filter((order) =>
    ["received", "in_preparation", "waiting", "delayed"].includes(order.status),
  );
  const delayedOrders = orders.filter((order) =>
    isKitchenOrderActiveDelayed(order),
  );
  const readyOrders = orders.filter((order) => order.status === "ready");

  return {
    active:
      preparingOrders.length > 0
        ? {
            change: labels.preparingCount.replace(
              "{count}",
              String(preparingOrders.length),
            ),
            trend: "neutral",
          }
        : { change: labels.notAvailable, trend: "neutral" },
    averageTime: { change: labels.notAvailable, trend: "neutral" },
    delayed:
      delayedOrders.length > 0
        ? {
            change: labels.delayedAttention.replace(
              "{count}",
              String(delayedOrders.length),
            ),
            trend: "down",
          }
        : { change: labels.notAvailable, trend: "neutral" },
    ready:
      readyOrders.length > 0
        ? {
            change: labels.preparingCount.replace(
              "{count}",
              String(readyOrders.length),
            ),
            trend: "up",
          }
        : { change: labels.notAvailable, trend: "neutral" },
  };
}
