import { isKitchenOrderActiveDelayed } from "@/lib/kitchen/filters";
import type { KitchenOrder } from "@/lib/kitchen/types";

type KitchenInsightLabels = {
  delayedSla: string;
  averagePrep: string;
  busiestStation: string;
};

export function computeKitchenInsights(
  orders: KitchenOrder[],
  labels: KitchenInsightLabels,
): string[] {
  const delayedOrders = orders.filter((order) =>
    isKitchenOrderActiveDelayed(order),
  );

  const preparingOrders = orders.filter((order) =>
    ["received", "in_preparation", "waiting", "delayed"].includes(order.status),
  );

  const insights: string[] = [];

  if (delayedOrders.length > 0) {
    insights.push(
      labels.delayedSla.replace("{count}", String(delayedOrders.length)),
    );
  }

  if (preparingOrders.length > 0) {
    const averageMinutes = Math.round(
      preparingOrders.reduce((sum, order) => sum + order.elapsedMinutes, 0) /
        preparingOrders.length,
    );

    insights.push(
      labels.averagePrep.replace("{minutes}", String(averageMinutes)),
    );
  }

  const stationCounts = preparingOrders.reduce<Record<string, number>>(
    (counts, order) => {
      counts[order.station] = (counts[order.station] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const busiestStation = Object.entries(stationCounts).sort(
    (left, right) => right[1] - left[1],
  )[0];

  if (busiestStation && busiestStation[1] > 1) {
    insights.push(
      labels.busiestStation
        .replace("{station}", busiestStation[0])
        .replace("{count}", String(busiestStation[1])),
    );
  }

  return insights.slice(0, 4);
}
