import type { DiningSurfaceRecord } from "@/lib/floor-plan/types";

export function findSurfaceForTableNumber(
  surfaces: DiningSurfaceRecord[],
  tableNumber: string | undefined,
): DiningSurfaceRecord | null {
  if (surfaces.length === 0) {
    return null;
  }

  const trimmed = tableNumber?.trim();

  if (!trimmed) {
    return surfaces[0] ?? null;
  }

  return (
    surfaces.find((surface) =>
      surface.tables.some((table) => table.number === trimmed),
    ) ??
    surfaces[0] ??
    null
  );
}

export function getConfiguredFloors(surfaces: DiningSurfaceRecord[]): number[] {
  return [...new Set(surfaces.map((surface) => surface.floor))].sort(
    (left, right) => left - right,
  );
}
