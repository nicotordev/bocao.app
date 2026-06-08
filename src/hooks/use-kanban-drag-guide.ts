"use client";

import { driver, type Driver } from "driver.js";
import { useCallback, useEffect, useRef } from "react";
import {
  dismissKanbanDragGuide,
  isKanbanDragGuideDismissed,
} from "@/lib/orders/kanban-guide";
import "driver.js/dist/driver.css";

const KANBAN_DRAG_HANDLE_SELECTOR = "[data-kanban-drag-handle]";

type UseKanbanDragGuideOptions = {
  active: boolean;
  title: string;
  description: string;
  doneText: string;
  onDismissed?: () => void;
};

export function useKanbanDragGuide({
  active,
  title,
  description,
  doneText,
  onDismissed,
}: UseKanbanDragGuideOptions) {
  const driverRef = useRef<Driver | null>(null);

  const dismissOverlay = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
  }, []);

  const dismissGuide = useCallback(() => {
    dismissOverlay();
    dismissKanbanDragGuide();
    onDismissed?.();
  }, [dismissOverlay, onDismissed]);

  useEffect(() => {
    if (!active || isKanbanDragGuideDismissed()) {
      return;
    }

    const timer = window.setTimeout(() => {
      const element = document.querySelector(KANBAN_DRAG_HANDLE_SELECTOR);

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
          dismissKanbanDragGuide();
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
          side: "right",
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
