"use client";

import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiningSurfaceRecord } from "@/lib/floor-plan/types";
import { cn } from "@/lib/utils";

type FloorNameLabels = {
  surfaceNameBasement: string;
  surfaceNameGround: string;
  surfaceNameFloor: string;
};

export type FloorPlanFloorSwitcherLabels = {
  floor: string;
  floorUp: string;
  floorDown: string;
  switchFloor: string;
  selectSurface: string;
  unconfiguredFloor: string;
};

function formatFloorName(floor: number, labels: FloorNameLabels) {
  if (floor < 0) {
    return labels.surfaceNameBasement.replace(
      "{level}",
      String(Math.abs(floor)),
    );
  }

  if (floor === 0) {
    return labels.surfaceNameGround;
  }

  return labels.surfaceNameFloor.replace("{floor}", String(floor));
}

function surfaceTabLabel(
  surface: DiningSurfaceRecord,
  floorLabel: string,
) {
  return `${floorLabel} ${surface.floor} · ${surface.name}`;
}

type FloorPlanFloorSwitcherProps = {
  surfaces: DiningSurfaceRecord[];
  currentFloor: number;
  activeSurfaceId: string | null;
  labels: FloorPlanFloorSwitcherLabels;
  floorNameLabels: FloorNameLabels;
  canFloorUp: boolean;
  canFloorDown: boolean;
  isUnconfiguredFloor?: boolean;
  onFloorUp: () => void;
  onFloorDown: () => void;
  onSelectSurface: (surfaceId: string) => void;
  className?: string;
};

export function FloorPlanFloorSwitcher({
  surfaces,
  currentFloor,
  activeSurfaceId,
  labels,
  floorNameLabels,
  canFloorUp,
  canFloorDown,
  isUnconfiguredFloor = false,
  onFloorUp,
  onFloorDown,
  onSelectSurface,
  className,
}: FloorPlanFloorSwitcherProps) {
  const activeSurface =
    surfaces.find((surface) => surface.id === activeSurfaceId) ?? null;
  const currentFloorName = formatFloorName(currentFloor, floorNameLabels);
  const statusLabel = isUnconfiguredFloor
    ? labels.unconfiguredFloor.replace("{floor}", String(currentFloor))
    : activeSurface
      ? activeSurface.name
      : currentFloorName;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label={labels.switchFloor}
    >
      <div className="inline-flex items-center gap-0.5 rounded-3xl border border-border bg-muted/20 p-0.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!canFloorDown}
          aria-label={labels.floorDown}
          onClick={onFloorDown}
        >
          <IconChevronDown />
        </Button>
        <div className="min-w-28 px-2 text-center">
          <p className="text-sm font-semibold leading-tight">{currentFloorName}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {statusLabel}
          </p>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!canFloorUp}
          aria-label={labels.floorUp}
          onClick={onFloorUp}
        >
          <IconChevronUp />
        </Button>
      </div>

      {surfaces.length > 1 ? (
        <Select
          value={activeSurfaceId ?? undefined}
          onValueChange={onSelectSurface}
        >
          <SelectTrigger size="sm" aria-label={labels.selectSurface}>
            <SelectValue placeholder={labels.selectSurface} />
          </SelectTrigger>
          <SelectContent>
            {surfaces.map((surface) => (
              <SelectItem key={surface.id} value={surface.id}>
                {surfaceTabLabel(surface, labels.floor)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
