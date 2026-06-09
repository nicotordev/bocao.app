import { listKitchenOrders } from "@/lib/kitchen/repository";
import type { KitchenStation } from "@/lib/kitchen/types";
import {
  createMockKitchenStation,
  deleteMockKitchenStation,
  getMockKitchenStation,
  listMockKitchenStations,
  reorderMockKitchenStation,
  updateMockKitchenStation,
} from "@/lib/kitchen/stations/mock-store";
import type {
  KitchenStationCategory,
  KitchenStationConfig,
  KitchenStationWithStats,
  KitchenStationsListResponse,
} from "@/lib/kitchen/stations/types";
import type { z } from "zod";
import type {
  createKitchenStationBodySchema,
  reorderKitchenStationBodySchema,
  updateKitchenStationBodySchema,
} from "@/lib/kitchen/stations/schemas";

type CreateKitchenStationInput = z.infer<typeof createKitchenStationBodySchema>;
type UpdateKitchenStationInput = z.infer<typeof updateKitchenStationBodySchema>;
type ReorderKitchenStationInput = z.infer<
  typeof reorderKitchenStationBodySchema
>;

const ACTIVE_KITCHEN_STATUSES = new Set([
  "received",
  "in_preparation",
  "waiting",
  "ready",
  "delayed",
]);

const categoryToKitchenStation: Partial<
  Record<KitchenStationCategory, KitchenStation>
> = {
  grill: "grill",
  fryer: "fryer",
  sushi: "sushi",
  bar: "bar",
  desserts: "desserts",
  delivery: "delivery_station",
};

async function countActiveOrdersByCategory(
  restaurantId: string,
): Promise<Partial<Record<KitchenStationCategory, number>>> {
  const { orders } = await listKitchenOrders(restaurantId);
  const counts: Partial<Record<KitchenStationCategory, number>> = {};

  for (const order of orders) {
    if (!ACTIVE_KITCHEN_STATUSES.has(order.status)) {
      continue;
    }

    const category = Object.entries(categoryToKitchenStation).find(
      ([, station]) => station === order.station,
    )?.[0] as KitchenStationCategory | undefined;

    if (!category) {
      continue;
    }

    counts[category] = (counts[category] ?? 0) + 1;
  }

  return counts;
}

function withActiveOrderCounts(
  stations: KitchenStationConfig[],
  counts: Partial<Record<KitchenStationCategory, number>>,
): KitchenStationWithStats[] {
  const stationsPerCategory = stations.reduce<
    Partial<Record<KitchenStationCategory, number>>
  >((accumulator, station) => {
    accumulator[station.category] = (accumulator[station.category] ?? 0) + 1;
    return accumulator;
  }, {});

  return stations.map((station) => {
    const categoryCount = counts[station.category] ?? 0;
    const stationsInCategory = stationsPerCategory[station.category] ?? 1;

    return {
      ...station,
      activeOrderCount: Math.ceil(categoryCount / stationsInCategory),
    };
  });
}

export async function listKitchenStations(
  restaurantId: string,
): Promise<KitchenStationsListResponse> {
  const stations = listMockKitchenStations(restaurantId);
  const counts = await countActiveOrdersByCategory(restaurantId);

  return {
    stations: withActiveOrderCounts(stations, counts),
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
}

export async function createKitchenStation(
  restaurantId: string,
  input: CreateKitchenStationInput,
): Promise<KitchenStationWithStats> {
  const station = createMockKitchenStation(restaurantId, {
    name: input.name,
    description: input.description ?? "",
    category: input.category,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder,
  });
  const counts = await countActiveOrdersByCategory(restaurantId);

  return withActiveOrderCounts([station], counts)[0];
}

export async function updateKitchenStation(
  restaurantId: string,
  stationId: string,
  input: UpdateKitchenStationInput,
): Promise<KitchenStationWithStats | null> {
  const station = updateMockKitchenStation(restaurantId, stationId, input);

  if (!station) {
    return null;
  }

  const counts = await countActiveOrdersByCategory(restaurantId);
  return withActiveOrderCounts([station], counts)[0];
}

export async function toggleKitchenStationActive(
  restaurantId: string,
  stationId: string,
): Promise<KitchenStationWithStats | null> {
  const current = getMockKitchenStation(restaurantId, stationId);

  if (!current) {
    return null;
  }

  return updateKitchenStation(restaurantId, stationId, {
    isActive: !current.isActive,
  });
}

export async function reorderKitchenStation(
  restaurantId: string,
  stationId: string,
  input: ReorderKitchenStationInput,
): Promise<KitchenStationsListResponse> {
  reorderMockKitchenStation(restaurantId, stationId, input.direction);
  return listKitchenStations(restaurantId);
}

export async function deleteKitchenStation(
  restaurantId: string,
  stationId: string,
): Promise<
  { ok: true } | { ok: false; reason: "not_found" | "has_active_orders" }
> {
  const { stations } = await listKitchenStations(restaurantId);
  const station = stations.find((item) => item.id === stationId);

  if (!station) {
    return { ok: false, reason: "not_found" };
  }

  if (station.activeOrderCount > 0) {
    return { ok: false, reason: "has_active_orders" };
  }

  const deleted = deleteMockKitchenStation(restaurantId, stationId);

  if (!deleted) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true };
}
