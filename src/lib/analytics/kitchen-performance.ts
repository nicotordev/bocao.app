import "server-only";

import {
  formatKitchenStationLabel,
} from "@/lib/analytics/kitchen-stations";
import type {
  AnalyticsFilters,
  KitchenPerformance,
  KitchenStationStat,
} from "@/lib/analytics/types";
import { resolveKitchenStationFromDetails } from "@/lib/kitchen/kitchen-mapper";
import type { KitchenStation } from "@/lib/kitchen/types";
import { prisma } from "@/lib/prisma";

const DELAYED_PREP_THRESHOLD_MINUTES = 30;

export type AnalyticsOrderKitchenRow = {
  id: string;
  status: string;
  preparationMins: number | null;
  details: unknown;
};

type StationAccumulator = {
  prepMinutes: number[];
  completedOrders: number;
  kitchenEvents: number;
};

function isKitchenEventPayload(
  value: unknown,
): value is { orderId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "orderId" in value &&
    typeof (value as { orderId: unknown }).orderId === "string"
  );
}

async function fetchKitchenEventCountsByStation(
  filters: AnalyticsFilters,
  orderStationById: Map<string, KitchenStation>,
): Promise<Map<KitchenStation, number>> {
  const events = await prisma.appEventLog.findMany({
    where: {
      tenantId: filters.organizationId,
      restaurantId: filters.restaurantId,
      domain: "kitchen",
      createdAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    select: {
      payload: true,
    },
  });

  const counts = new Map<KitchenStation, number>();

  for (const event of events) {
    if (!isKitchenEventPayload(event.payload)) {
      continue;
    }

    const station = orderStationById.get(event.payload.orderId);

    if (!station) {
      continue;
    }

    counts.set(station, (counts.get(station) ?? 0) + 1);
  }

  return counts;
}

export async function buildKitchenPerformanceMetrics(
  filters: AnalyticsFilters,
  rows: AnalyticsOrderKitchenRow[],
  stationLabelMap: Record<string, string>,
): Promise<KitchenPerformance> {
  const orderStationById = new Map<string, KitchenStation>();

  for (const row of rows) {
    orderStationById.set(
      row.id,
      resolveKitchenStationFromDetails(row.details),
    );
  }

  const [kitchenEventCounts] = await Promise.all([
    fetchKitchenEventCountsByStation(filters, orderStationById),
  ]);

  const completedRows = rows.filter(
    (row) => row.status === "COMPLETED" && row.preparationMins !== null,
  );

  const delayedOrders = completedRows.filter(
    (row) => (row.preparationMins ?? 0) > DELAYED_PREP_THRESHOLD_MINUTES,
  ).length;

  const averagePreparationMinutes =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce(
            (sum, row) => sum + (row.preparationMins ?? 0),
            0,
          ) / completedRows.length,
        )
      : null;

  const stationAccumulators = new Map<KitchenStation, StationAccumulator>();

  const ensureStation = (station: KitchenStation) => {
    const current = stationAccumulators.get(station) ?? {
      prepMinutes: [],
      completedOrders: 0,
      kitchenEvents: kitchenEventCounts.get(station) ?? 0,
    };
    stationAccumulators.set(station, current);
    return current;
  };

  for (const [station, count] of kitchenEventCounts) {
    const accumulator = ensureStation(station);
    accumulator.kitchenEvents = count;
  }

  for (const row of rows) {
    if (row.status !== "COMPLETED") {
      continue;
    }

    const station = orderStationById.get(row.id);

    if (!station) {
      continue;
    }

    const accumulator = ensureStation(station);
    accumulator.completedOrders += 1;

    if (row.preparationMins !== null) {
      accumulator.prepMinutes.push(row.preparationMins);
    }
  }

  const stationStats: KitchenStationStat[] = Array.from(
    stationAccumulators.entries(),
  )
    .map(([stationKey, values]) => ({
      station: formatKitchenStationLabel(stationKey, stationLabelMap),
      orderCount: values.completedOrders,
      kitchenEvents: values.kitchenEvents,
      averageMinutes:
        values.prepMinutes.length > 0
          ? Math.round(
              values.prepMinutes.reduce((sum, minutes) => sum + minutes, 0) /
                values.prepMinutes.length,
            )
          : 0,
    }))
    .filter((stat) => stat.orderCount > 0 || stat.kitchenEvents > 0)
    .sort((left, right) => {
      if (right.orderCount !== left.orderCount) {
        return right.orderCount - left.orderCount;
      }

      return right.kitchenEvents - left.kitchenEvents;
    });

  const busiestStation =
    stationStats.find((stat) => stat.orderCount > 0)?.station ??
    stationStats.find((stat) => stat.kitchenEvents > 0)?.station ??
    null;

  return {
    averagePreparationMinutes,
    delayedOrders,
    busiestStation,
    stationStats,
  };
}
