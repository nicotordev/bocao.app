"use client";

import { useMemo, useState } from "react";
import {
  findSurfaceForTableNumber,
  getConfiguredFloors,
} from "@/lib/floor-plan/surface-selection";
import type { DiningSurfaceRecord } from "@/lib/floor-plan/types";

export function useFloorPlanSurfaceSelection(
  surfaces: DiningSurfaceRecord[],
  selectedTableNumber?: string,
) {
  const tableLinkedSurfaceId = useMemo(
    () => findSurfaceForTableNumber(surfaces, selectedTableNumber)?.id ?? null,
    [selectedTableNumber, surfaces],
  );

  const [manualSurfaceId, setManualSurfaceId] = useState<string | null>(null);

  const activeSurfaceId =
    manualSurfaceId ?? tableLinkedSurfaceId ?? surfaces[0]?.id ?? null;

  const activeSurface = useMemo(
    () =>
      surfaces.find((surface) => surface.id === activeSurfaceId) ??
      surfaces[0] ??
      null,
    [activeSurfaceId, surfaces],
  );

  const configuredFloors = useMemo(
    () => getConfiguredFloors(surfaces),
    [surfaces],
  );

  const currentFloor = activeSurface?.floor ?? configuredFloors[0] ?? 1;
  const configuredFloorIndex = configuredFloors.indexOf(currentFloor);

  const canFloorUp =
    configuredFloorIndex >= 0 &&
    configuredFloorIndex < configuredFloors.length - 1;
  const canFloorDown = configuredFloorIndex > 0;

  function selectSurface(surfaceId: string) {
    setManualSurfaceId(surfaceId);
  }

  function clearManualSurface() {
    setManualSurfaceId(null);
  }

  function navigateFloor(direction: "up" | "down") {
    const targetIndex =
      direction === "up" ? configuredFloorIndex + 1 : configuredFloorIndex - 1;
    const targetFloor = configuredFloors[targetIndex];

    if (targetFloor === undefined) {
      return;
    }

    const existing = surfaces.find((surface) => surface.floor === targetFloor);

    if (existing) {
      setManualSurfaceId(existing.id);
    }
  }

  return {
    surfaces,
    activeSurface,
    activeSurfaceId,
    currentFloor,
    canFloorUp,
    canFloorDown,
    selectSurface,
    navigateFloor,
    clearManualSurface,
  };
}
