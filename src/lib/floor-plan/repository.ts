import type {
  DiningSurfaceRecord,
  DiningTableRecord,
  FloorPlanRecord,
  NormalizedPoint,
  TableOccupancy,
} from "@/lib/floor-plan/types";
import type { SaveFloorPlanInput } from "@/lib/floor-plan/schemas";
import { prisma } from "@/lib/prisma";

const ACTIVE_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
] as const;

const surfaceInclude = {
  tables: {
    orderBy: [{ sortOrder: "asc" as const }, { number: "asc" as const }],
  },
};

function parseBoundary(value: unknown): NormalizedPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((point) => {
    if (
      typeof point === "object" &&
      point !== null &&
      "x" in point &&
      "y" in point &&
      typeof point.x === "number" &&
      typeof point.y === "number"
    ) {
      return [{ x: point.x, y: point.y }];
    }

    return [];
  });
}

function mapTable(table: {
  id: string;
  number: string;
  shape: "ROUND" | "SQUARE" | "RECT";
  capacity: number;
  positionX: number;
  positionY: number;
  rotation: number;
  width: number;
  height: number;
  sortOrder: number;
}): DiningTableRecord {
  return {
    id: table.id,
    number: table.number,
    shape: table.shape,
    capacity: table.capacity,
    positionX: table.positionX,
    positionY: table.positionY,
    rotation: table.rotation,
    width: table.width,
    height: table.height,
    sortOrder: table.sortOrder,
  };
}

function mapSurface(surface: {
  id: string;
  restaurantId: string;
  name: string;
  floor: number;
  surfaceAreaM2: number;
  boundary: unknown;
  sortOrder: number;
  tables: Array<Parameters<typeof mapTable>[0]>;
}): DiningSurfaceRecord {
  return {
    id: surface.id,
    restaurantId: surface.restaurantId,
    name: surface.name,
    floor: surface.floor,
    surfaceAreaM2: surface.surfaceAreaM2,
    boundary: parseBoundary(surface.boundary),
    sortOrder: surface.sortOrder,
    tables: surface.tables
      .map(mapTable)
      .sort((left, right) => left.sortOrder - right.sortOrder),
  };
}

export async function listFloorPlanSurfaces(
  restaurantId: string,
): Promise<DiningSurfaceRecord[]> {
  const surfaces = await prisma.diningSurface.findMany({
    where: { restaurantId },
    include: surfaceInclude,
    orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return surfaces.map(mapSurface);
}

export async function getFloorPlan(
  restaurantId: string,
): Promise<FloorPlanRecord | null> {
  const surfaces = await listFloorPlanSurfaces(restaurantId);

  if (surfaces.length === 0) {
    return null;
  }

  return { surfaces };
}

export async function saveFloorPlan(input: SaveFloorPlanInput) {
  const { restaurantId, surface, tables } = input;

  return prisma.$transaction(async (tx) => {
    const existing = surface.id
      ? await tx.diningSurface.findFirst({
          where: { id: surface.id, restaurantId },
        })
      : null;

    const savedSurface = existing
      ? await tx.diningSurface.update({
          where: { id: existing.id },
          data: {
            name: surface.name,
            floor: surface.floor,
            surfaceAreaM2: surface.surfaceAreaM2,
            boundary: surface.boundary,
          },
        })
      : await tx.diningSurface.create({
          data: {
            restaurantId,
            name: surface.name,
            floor: surface.floor,
            surfaceAreaM2: surface.surfaceAreaM2,
            boundary: surface.boundary,
            sortOrder: surface.floor,
          },
        });

    await tx.diningTable.deleteMany({
      where: { surfaceId: savedSurface.id },
    });

    if (tables.length > 0) {
      await tx.diningTable.createMany({
        data: tables.map((table, index) => ({
          surfaceId: savedSurface.id,
          number: table.number,
          shape: table.shape,
          capacity: table.capacity,
          positionX: table.positionX,
          positionY: table.positionY,
          rotation: table.rotation,
          width: table.width,
          height: table.height,
          sortOrder: index,
        })),
      });
    }

    const refreshed = await tx.diningSurface.findUniqueOrThrow({
      where: { id: savedSurface.id },
      include: surfaceInclude,
    });

    return mapSurface(refreshed);
  });
}

export async function getOccupiedTableNumbers(
  restaurantId: string,
): Promise<TableOccupancy> {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      channel: "dineIn",
      status: { in: [...ACTIVE_ORDER_STATUSES] },
      tableNumber: { not: null },
    },
    select: {
      tableNumber: true,
    },
  });

  const occupancy: TableOccupancy = {};

  for (const order of orders) {
    if (order.tableNumber) {
      occupancy[order.tableNumber] = true;
    }
  }

  return occupancy;
}
