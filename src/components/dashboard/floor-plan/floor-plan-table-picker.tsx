"use client";

import { FloorPlanCanvas } from "@/components/dashboard/floor-plan/floor-plan-canvas-loader";
import type {
  DiningSurfaceRecord,
  TableOccupancy,
} from "@/lib/floor-plan/types";
import { cn } from "@/lib/utils";

type FloorPlanTablePickerProps = {
  surface: DiningSurfaceRecord;
  occupiedTableNumbers: TableOccupancy;
  selectedTableNumber: string;
  onSelectTable: (tableNumber: string) => void;
  labels: {
    legendFree: string;
    legendOccupied: string;
    legendSelected: string;
    pickHint: string;
  };
  className?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  fillContainer?: boolean;
};

export function FloorPlanTablePicker({
  surface,
  occupiedTableNumbers,
  selectedTableNumber,
  onSelectTable,
  labels,
  className,
  canvasWidth,
  canvasHeight,
  fillContainer = false,
}: FloorPlanTablePickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm text-muted-foreground">{labels.pickHint}</p>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-green-500" aria-hidden />
          {labels.legendFree}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-orange-500" aria-hidden />
          {labels.legendOccupied}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-600" aria-hidden />
          {labels.legendSelected}
        </span>
      </div>
      <FloorPlanCanvas
        boundary={surface.boundary}
        tables={surface.tables}
        occupiedTableNumbers={occupiedTableNumbers}
        selectedTableNumber={selectedTableNumber || null}
        mode="picker"
        onSelectTable={onSelectTable}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        fillContainer={fillContainer}
      />
    </div>
  );
}
