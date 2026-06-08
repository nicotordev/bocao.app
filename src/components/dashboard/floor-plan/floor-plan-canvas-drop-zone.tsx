"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const FLOOR_PLAN_CANVAS_DROP_ID = "floor-plan-canvas-drop";

type FloorPlanCanvasDropZoneProps = {
  children: ReactNode;
  disabled?: boolean;
  dndEnabled?: boolean;
  onCanvasRef?: (node: HTMLDivElement | null) => void;
};

function DroppableCanvasDropZone({
  children,
  disabled = false,
  onCanvasRef,
}: Omit<FloorPlanCanvasDropZoneProps, "dndEnabled">) {
  const { setNodeRef, isOver } = useDroppable({
    id: FLOOR_PLAN_CANVAS_DROP_ID,
    disabled,
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        onCanvasRef?.(node);
      }}
      className={cn(
        "rounded-3xl transition-[box-shadow,ring-color]",
        isOver &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/10",
      )}
    >
      {children}
    </div>
  );
}

export function FloorPlanCanvasDropZone({
  children,
  disabled = false,
  dndEnabled = true,
  onCanvasRef,
}: FloorPlanCanvasDropZoneProps) {
  if (!dndEnabled) {
    return (
      <div ref={onCanvasRef} className="rounded-3xl">
        {children}
      </div>
    );
  }

  return (
    <DroppableCanvasDropZone disabled={disabled} onCanvasRef={onCanvasRef}>
      {children}
    </DroppableCanvasDropZone>
  );
}
