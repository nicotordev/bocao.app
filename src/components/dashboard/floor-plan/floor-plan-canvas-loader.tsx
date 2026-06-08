"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { FLOOR_PLAN_CANVAS } from "@/lib/floor-plan/types";
import { cn } from "@/lib/utils";

const FloorPlanCanvasInner = dynamic(
  () =>
    import("./floor-plan-canvas").then((module) => module.FloorPlanCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
        style={{
          width: FLOOR_PLAN_CANVAS.width,
          height: FLOOR_PLAN_CANVAS.height,
          maxWidth: "100%",
        }}
      >
        …
      </div>
    ),
  },
);

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
        fillContainer ? "relative h-full w-full min-h-0" : "max-w-full overflow-x-auto",
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
