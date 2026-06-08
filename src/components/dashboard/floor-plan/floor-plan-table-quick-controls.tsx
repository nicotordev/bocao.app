"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  clampTableCapacity,
  cycleTableShape,
  tableShapeDimensions,
  toCanvasPoint,
} from "@/lib/floor-plan/geometry";
import type { DiningTableRecord, DiningTableShape } from "@/lib/floor-plan/types";

type FloorPlanTableQuickControlsLabels = {
  tableShapeRound: string;
  tableShapeSquare: string;
  tableShapeRect: string;
  tableCapacity: string;
  previousShape: string;
  nextShape: string;
  decreaseCapacity: string;
  increaseCapacity: string;
};

type FloorPlanTableQuickControlsProps = {
  table: DiningTableRecord;
  canvasWidth: number;
  canvasHeight: number;
  labels: FloorPlanTableQuickControlsLabels;
  onUpdate: (patch: Partial<DiningTableRecord>) => void;
};

function shapeLabel(
  shape: DiningTableShape,
  labels: FloorPlanTableQuickControlsLabels,
) {
  switch (shape) {
    case "SQUARE":
      return labels.tableShapeSquare;
    case "RECT":
      return labels.tableShapeRect;
    default:
      return labels.tableShapeRound;
  }
}

export function FloorPlanTableQuickControls({
  table,
  canvasWidth,
  canvasHeight,
  labels,
  onUpdate,
}: FloorPlanTableQuickControlsProps) {
  const canvasPoint = toCanvasPoint(
    { x: table.positionX, y: table.positionY },
    canvasWidth,
    canvasHeight,
  );
  const markerSize = Math.max(table.width * canvasWidth, table.height * canvasHeight);
  const top = canvasPoint.y + markerSize / 2 + 12;
  const left = canvasPoint.x;

  function applyShape(nextShape: DiningTableShape) {
    const dimensions = tableShapeDimensions(nextShape);
    onUpdate({
      shape: nextShape,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden={false}
    >
      <div
        className="pointer-events-auto absolute flex -translate-x-1/2 flex-col items-center gap-1.5"
        style={{ left, top }}
      >
        <div className="flex items-center gap-1 rounded-full border border-border bg-background/95 px-1 py-0.5 shadow-md backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.previousShape}
            onClick={(event) => {
              event.stopPropagation();
              applyShape(cycleTableShape(table.shape, -1));
            }}
          >
            <IconChevronLeft />
          </Button>
          <span className="min-w-20 px-1 text-center text-xs font-medium">
            {shapeLabel(table.shape, labels)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.nextShape}
            onClick={(event) => {
              event.stopPropagation();
              applyShape(cycleTableShape(table.shape, 1));
            }}
          >
            <IconChevronRight />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-background/95 px-1 py-0.5 shadow-md backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.decreaseCapacity}
            onClick={(event) => {
              event.stopPropagation();
              onUpdate({
                capacity: clampTableCapacity(table.capacity - 1),
              });
            }}
          >
            <IconChevronLeft />
          </Button>
          <span className="min-w-16 px-1 text-center text-xs font-medium">
            {table.capacity} · {labels.tableCapacity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.increaseCapacity}
            onClick={(event) => {
              event.stopPropagation();
              onUpdate({
                capacity: clampTableCapacity(table.capacity + 1),
              });
            }}
          >
            <IconChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
