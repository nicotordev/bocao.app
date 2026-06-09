import type { KitchenStation as PrismaKitchenStation } from "@/generated/prisma/client";
import { KitchenStationCategory as PrismaKitchenStationCategory } from "@/generated/prisma/client";
import { listKitchenOrders } from "@/lib/kitchen/repository";
import type { KitchenStation } from "@/lib/kitchen/types";
import type {
  KitchenStationCategory,
  KitchenStationConfig,
  KitchenStationWithStats,
  KitchenStationsListResponse,
} from "@/lib/kitchen/stations/types";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import { isMenuTagIconId } from "@/lib/menu/tag-icons";
import { prisma } from "@/lib/prisma";
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

const categoryToDb: Record<
  KitchenStationCategory,
  PrismaKitchenStationCategory
> = {
  grill: PrismaKitchenStationCategory.GRILL,
  fryer: PrismaKitchenStationCategory.FRYER,
  sushi: PrismaKitchenStationCategory.SUSHI,
  bar: PrismaKitchenStationCategory.BAR,
  desserts: PrismaKitchenStationCategory.DESSERTS,
  delivery: PrismaKitchenStationCategory.DELIVERY,
  prep: PrismaKitchenStationCategory.PREP,
  other: PrismaKitchenStationCategory.OTHER,
};

const categoryFromDb: Record<
  PrismaKitchenStationCategory,
  KitchenStationCategory
> = {
  [PrismaKitchenStationCategory.GRILL]: "grill",
  [PrismaKitchenStationCategory.FRYER]: "fryer",
  [PrismaKitchenStationCategory.SUSHI]: "sushi",
  [PrismaKitchenStationCategory.BAR]: "bar",
  [PrismaKitchenStationCategory.DESSERTS]: "desserts",
  [PrismaKitchenStationCategory.DELIVERY]: "delivery",
  [PrismaKitchenStationCategory.PREP]: "prep",
  [PrismaKitchenStationCategory.OTHER]: "other",
};

function normalizeStationImageUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return value;
}

function normalizeStationIconId(
  value: string | null | undefined,
): MenuTagIconId | null {
  if (!value || !isMenuTagIconId(value)) {
    return null;
  }

  return value;
}

function mapKitchenStationRecord(
  record: PrismaKitchenStation,
): KitchenStationConfig {
  return {
    id: record.id,
    restaurantId: record.restaurantId,
    name: record.name,
    description: record.description,
    category: categoryFromDb[record.category],
    imageUrl: record.imageUrl,
    iconId: normalizeStationIconId(record.iconId),
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function listKitchenStationRecords(
  restaurantId: string,
): Promise<KitchenStationConfig[]> {
  const records = await prisma.kitchenStation.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
  });

  return records.map(mapKitchenStationRecord);
}

async function getNextSortOrder(restaurantId: string): Promise<number> {
  const aggregate = await prisma.kitchenStation.aggregate({
    where: { restaurantId },
    _max: { sortOrder: true },
  });

  return (aggregate._max.sortOrder ?? -1) + 1;
}

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
  const stations = await listKitchenStationRecords(restaurantId);
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
  const sortOrder = input.sortOrder ?? (await getNextSortOrder(restaurantId));

  const record = await prisma.kitchenStation.create({
    data: {
      restaurantId,
      name: input.name,
      description: input.description ?? "",
      category: categoryToDb[input.category],
      imageUrl: normalizeStationImageUrl(input.imageUrl),
      iconId: normalizeStationIconId(input.iconId),
      isActive: input.isActive ?? true,
      sortOrder,
    },
  });

  const station = mapKitchenStationRecord(record);
  const counts = await countActiveOrdersByCategory(restaurantId);

  return withActiveOrderCounts([station], counts)[0];
}

export async function updateKitchenStation(
  restaurantId: string,
  stationId: string,
  input: UpdateKitchenStationInput,
): Promise<KitchenStationWithStats | null> {
  const existing = await prisma.kitchenStation.findFirst({
    where: {
      id: stationId,
      restaurantId,
    },
  });

  if (!existing) {
    return null;
  }

  const record = await prisma.kitchenStation.update({
    where: { id: stationId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.category !== undefined
        ? { category: categoryToDb[input.category] }
        : {}),
      ...(input.imageUrl !== undefined
        ? { imageUrl: normalizeStationImageUrl(input.imageUrl) }
        : {}),
      ...(input.iconId !== undefined
        ? { iconId: normalizeStationIconId(input.iconId) }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  const station = mapKitchenStationRecord(record);
  const counts = await countActiveOrdersByCategory(restaurantId);
  return withActiveOrderCounts([station], counts)[0];
}

export async function toggleKitchenStationActive(
  restaurantId: string,
  stationId: string,
): Promise<KitchenStationWithStats | null> {
  const current = await prisma.kitchenStation.findFirst({
    where: {
      id: stationId,
      restaurantId,
    },
  });

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
  const stations = await prisma.kitchenStation.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
  });

  const index = stations.findIndex((station) => station.id === stationId);

  if (index === -1) {
    return listKitchenStations(restaurantId);
  }

  const targetIndex = input.direction === "up" ? index - 1 : index + 1;

  if (targetIndex >= 0 && targetIndex < stations.length) {
    const current = stations[index];
    const target = stations[targetIndex];

    await prisma.$transaction([
      prisma.kitchenStation.update({
        where: { id: current.id },
        data: { sortOrder: target.sortOrder },
      }),
      prisma.kitchenStation.update({
        where: { id: target.id },
        data: { sortOrder: current.sortOrder },
      }),
    ]);
  }

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

  const result = await prisma.kitchenStation.deleteMany({
    where: {
      id: stationId,
      restaurantId,
    },
  });

  if (result.count === 0) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true };
}
