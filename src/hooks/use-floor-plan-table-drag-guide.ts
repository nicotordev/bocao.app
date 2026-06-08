"use client";

import { driver, type Driver } from "driver.js";
import { useCallback, useEffect, useRef } from "react";
import {
  dismissFloorPlanTableDragGuide,
  isFloorPlanTableDragGuideDismissed,
} from "@/lib/floor-plan/table-palette-guide";
import "driver.js/dist/driver.css";

const FLOOR_PLAN_TABLE_PALETTE_SELECTOR = "[data-floor-plan-table-palette]";

type UseFloorPlanTableDragGuideOptions = {
  active: boolean;
  title: string;
  description: string;
  doneText: string;
  onDismissed?: () => void;
};

export function useFloorPlanTableDragGuide({
  active,
  title,
  description,
  doneText,
  onDismissed,
}: UseFloorPlanTableDragGuideOptions) {
  const driverRef = useRef<Driver | null>(null);

  const dismissOverlay = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
  }, []);

  const dismissGuide = useCallback(() => {
    dismissOverlay();
    dismissFloorPlanTableDragGuide();
    onDismissed?.();
  }, [dismissOverlay, onDismissed]);

  useEffect(() => {
    if (!active || isFloorPlanTableDragGuideDismissed()) {
      return;
    }

    const timer = window.setTimeout(() => {
      const element = document.querySelector(FLOOR_PLAN_TABLE_PALETTE_SELECTOR);

      if (!element || driverRef.current?.isActive()) {
        return;
      }

      const driverObj = driver({
        animate: true,
        allowClose: true,
        overlayOpacity: 0.65,
        stagePadding: 10,
        stageRadius: 999,
        popoverClass: "bocao-driver-popover",
        popoverOffset: 12,
        onDestroyed: () => {
          driverRef.current = null;
          dismissFloorPlanTableDragGuide();
          onDismissed?.();
        },
      });

      driverRef.current = driverObj;

      driverObj.highlight({
        element,
        disableActiveInteraction: false,
        popover: {
          title,
          description,
          side: "left",
          align: "center",
          showButtons: ["next"],
          nextBtnText: doneText,
          popoverClass: "bocao-driver-popover",
          onNextClick: () => {
            driverObj.destroy();
          },
        },
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      dismissOverlay();
    };
  }, [active, description, dismissOverlay, doneText, onDismissed, title]);

  return { dismissOverlay, dismissGuide };
}
