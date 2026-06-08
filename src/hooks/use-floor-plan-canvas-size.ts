"use client";

import { useEffect, useState, type RefObject } from "react";
import { FLOOR_PLAN_CANVAS } from "@/lib/floor-plan/types";

type CanvasSize = {
  width: number;
  height: number;
};

export function useFloorPlanCanvasSize(
  containerRef: RefObject<HTMLElement | null>,
  expanded: boolean,
) {
  const [size, setSize] = useState<CanvasSize>({
    width: FLOOR_PLAN_CANVAS.width,
    height: FLOOR_PLAN_CANVAS.height,
  });

  useEffect(() => {
    if (!expanded) {
      setSize({
        width: FLOOR_PLAN_CANVAS.width,
        height: FLOOR_PLAN_CANVAS.height,
      });
      return;
    }

    const node = containerRef.current;

    if (!node) {
      return;
    }

    function updateSize() {
      const element = containerRef.current;

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(480, Math.floor(rect.width)),
        height: Math.max(360, Math.floor(rect.height)),
      });
    }

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [containerRef, expanded]);

  return size;
}
