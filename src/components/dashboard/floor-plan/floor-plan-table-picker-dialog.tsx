"use client";

import { useRef } from "react";
import { FloorPlanFloorSwitcher } from "@/components/dashboard/floor-plan/floor-plan-floor-switcher";
import { FloorPlanTablePicker } from "@/components/dashboard/floor-plan/floor-plan-table-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFloorPlanCanvasSize } from "@/hooks/use-floor-plan-canvas-size";
import { useFloorPlanSurfaceSelection } from "@/hooks/use-floor-plan-surface-selection";
import type { TableOccupancy } from "@/lib/floor-plan/types";
import type { DiningSurfaceRecord } from "@/lib/floor-plan/types";

export type FloorPlanTablePickerDialogLabels = {
  title: string;
  description: string;
  legendFree: string;
  legendOccupied: string;
  legendSelected: string;
  pickHint: string;
  floorSwitcher: {
    floor: string;
    floorUp: string;
    floorDown: string;
    switchFloor: string;
    selectSurface: string;
    unconfiguredFloor: string;
  };
  floorName: {
    surfaceNameBasement: string;
    surfaceNameGround: string;
    surfaceNameFloor: string;
  };
};

type FloorPlanTablePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaces: DiningSurfaceRecord[];
  occupiedTableNumbers: TableOccupancy;
  selectedTableNumber: string;
  onSelectTable: (tableNumber: string) => void;
  labels: FloorPlanTablePickerDialogLabels;
};

export function FloorPlanTablePickerDialog({
  open,
  onOpenChange,
  surfaces,
  occupiedTableNumbers,
  selectedTableNumber,
  onSelectTable,
  labels,
}: FloorPlanTablePickerDialogProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasSize = useFloorPlanCanvasSize(canvasContainerRef, true);
  const selection = useFloorPlanSurfaceSelection(surfaces, selectedTableNumber);

  function handleSelectTable(tableNumber: string) {
    onSelectTable(tableNumber);
    onOpenChange(false);
  }

  if (!selection.activeSurface) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(94vh,900px)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="font-heading text-xl font-semibold">
            {labels.title}
          </DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b border-border px-6 py-4">
          <FloorPlanFloorSwitcher
            surfaces={surfaces}
            currentFloor={selection.currentFloor}
            activeSurfaceId={selection.activeSurfaceId}
            labels={labels.floorSwitcher}
            floorNameLabels={labels.floorName}
            canFloorUp={selection.canFloorUp}
            canFloorDown={selection.canFloorDown}
            onFloorUp={() => selection.navigateFloor("up")}
            onFloorDown={() => selection.navigateFloor("down")}
            onSelectSurface={selection.selectSurface}
          />
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div
            ref={canvasContainerRef}
            className="min-h-[min(60vh,560px)] w-full"
          >
            <FloorPlanTablePicker
              surface={selection.activeSurface}
              occupiedTableNumbers={occupiedTableNumbers}
              selectedTableNumber={selectedTableNumber}
              onSelectTable={handleSelectTable}
              labels={{
                legendFree: labels.legendFree,
                legendOccupied: labels.legendOccupied,
                legendSelected: labels.legendSelected,
                pickHint: labels.pickHint,
              }}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              fillContainer
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
