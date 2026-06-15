"use client";

import type { ComponentProps } from "react";
import { FLOOR_PLAN_CANVAS } from "@/lib/floor-plan/types";
import { cn } from "@/lib/utils";
import { FloorPlanCanvas as FloorPlanCanvasInner } from "./floor-plan-canvas";

type FloorPlanCanvasProps = ComponentProps<typeof FloorPlanCanvasInner> & {
  fillContainer?: boolean;
};

export function FloorPlanCanvas({
  fillContainer = false,
  canvasWidth = FLOOR_PLAN_CANVAS.width,
  canvasHeight = FLOOR_PLAN_CANVAS.height,
  ...props
}: FloorPlanCanvasProps) {
  return (
    <div
      className={cn(
        fillContainer
          ? "relative h-full w-full min-h-0"
          : "max-w-full overflow-x-auto",
      )}
    >
      <FloorPlanCanvasInner
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        {...props}
      />
    </div>
  );
}
