"use client";

import { IconArrowsMaximize, IconArrowsMinimize } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useDashboardFocusMode } from "@/components/dashboard/dashboard-focus-mode";

type FloorPlanExpandButtonProps = {
  expandLabel: string;
  collapseLabel: string;
};

export function FloorPlanExpandButton({
  expandLabel,
  collapseLabel,
}: FloorPlanExpandButtonProps) {
  const { isFocused, enterFocus, exitFocus } = useDashboardFocusMode();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={isFocused ? exitFocus : enterFocus}
    >
      {isFocused ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
      {isFocused ? collapseLabel : expandLabel}
    </Button>
  );
}
