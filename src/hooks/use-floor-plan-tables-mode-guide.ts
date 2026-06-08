"use client";

import { driver, type Driver } from "driver.js";
import { useCallback, useEffect, useRef } from "react";
import {
  dismissFloorPlanTablesModeGuide,
  isFloorPlanTablesModeGuideDismissed,
} from "@/lib/floor-plan/table-palette-guide";
import "driver.js/dist/driver.css";

const FLOOR_PLAN_TABLES_TOOL_SELECTOR = "[data-floor-plan-tool-tables]";

type UseFloorPlanTablesModeGuideOptions = {
  active: boolean;
  title: string;
  description: string;
  doneText: string;
  onDismissed?: () => void;
};

export function useFloorPlanTablesModeGuide({
  active,
  title,
  description,
  doneText,
  onDismissed,
}: UseFloorPlanTablesModeGuideOptions) {
  const driverRef = useRef<Driver | null>(null);

  const dismissOverlay = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
  }, []);

  const dismissGuide = useCallback(() => {
    dismissOverlay();
    dismissFloorPlanTablesModeGuide();
    onDismissed?.();
  }, [dismissOverlay, onDismissed]);

  useEffect(() => {
    if (!active || isFloorPlanTablesModeGuideDismissed()) {
      return;
    }

    const timer = window.setTimeout(() => {
      const element = document.querySelector(FLOOR_PLAN_TABLES_TOOL_SELECTOR);

      if (!element || driverRef.current?.isActive()) {
        return;
      }

      const driverObj = driver({
        animate: true,
        allowClose: true,
        overlayOpacity: 0.65,
        stagePadding: 10,
        stageRadius: 12,
        popoverClass: "bocao-driver-popover",
        popoverOffset: 12,
        onDestroyed: () => {
          driverRef.current = null;
          dismissFloorPlanTablesModeGuide();
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
          side: "bottom",
          align: "start",
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
