/**
 * Temporary in-memory adapter for kitchen station configuration.
 * Replace this module with Prisma persistence when a KitchenStation model exists.
 */
import type { KitchenStationConfig } from "@/lib/kitchen/stations/types";

type CreateStationInput = Pick<
  KitchenStationConfig,
  "name" | "description" | "category" | "isActive"
> & {
  sortOrder?: number;
};

type UpdateStationInput = Partial<CreateStationInput>;

const stationsByRestaurant = new Map<string, KitchenStationConfig[]>();

function createId(): string {
  return `ks_${crypto.randomUUID()}`;
}

function sortStations(
  stations: KitchenStationConfig[],
): KitchenStationConfig[] {
  return [...stations].sort((left, right) => left.sortOrder - right.sortOrder);
}

export function listMockKitchenStations(
  restaurantId: string,
): KitchenStationConfig[] {
  return sortStations(stationsByRestaurant.get(restaurantId) ?? []);
}

export function getMockKitchenStation(
  restaurantId: string,
  stationId: string,
): KitchenStationConfig | null {
  return (
    listMockKitchenStations(restaurantId).find(
      (station) => station.id === stationId,
    ) ?? null
  );
}

export function createMockKitchenStation(
  restaurantId: string,
  input: CreateStationInput,
): KitchenStationConfig {
  const stations = listMockKitchenStations(restaurantId);
  const now = new Date().toISOString();
  const station: KitchenStationConfig = {
    id: createId(),
    restaurantId,
    name: input.name,
    description: input.description,
    category: input.category,
    isActive: input.isActive,
    sortOrder:
      input.sortOrder ??
      (stations.length > 0
        ? Math.max(...stations.map((item) => item.sortOrder)) + 1
        : 0),
    createdAt: now,
    updatedAt: now,
  };

  stationsByRestaurant.set(restaurantId, [...stations, station]);
  return station;
}

export function updateMockKitchenStation(
  restaurantId: string,
  stationId: string,
  input: UpdateStationInput,
): KitchenStationConfig | null {
  const stations = listMockKitchenStations(restaurantId);
  const index = stations.findIndex((station) => station.id === stationId);

  if (index === -1) {
    return null;
  }

  const current = stations[index];
  const updated: KitchenStationConfig = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  const nextStations = [...stations];
  nextStations[index] = updated;
  stationsByRestaurant.set(restaurantId, nextStations);
  return updated;
}

export function deleteMockKitchenStation(
  restaurantId: string,
  stationId: string,
): boolean {
  const stations = listMockKitchenStations(restaurantId);
  const nextStations = stations.filter((station) => station.id !== stationId);

  if (nextStations.length === stations.length) {
    return false;
  }

  stationsByRestaurant.set(restaurantId, nextStations);
  return true;
}

export function reorderMockKitchenStation(
  restaurantId: string,
  stationId: string,
  direction: "up" | "down",
): KitchenStationConfig[] | null {
  const stations = sortStations(listMockKitchenStations(restaurantId));
  const index = stations.findIndex((station) => station.id === stationId);

  if (index === -1) {
    return null;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= stations.length) {
    return stations;
  }

  const nextStations = [...stations];
  const current = nextStations[index];
  const target = nextStations[targetIndex];
  const now = new Date().toISOString();

  nextStations[index] = {
    ...target,
    sortOrder: current.sortOrder,
    updatedAt: now,
  };
  nextStations[targetIndex] = {
    ...current,
    sortOrder: target.sortOrder,
    updatedAt: now,
  };

  stationsByRestaurant.set(restaurantId, nextStations);
  return sortStations(nextStations);
}
