"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Maximize2, Minimize2, RefreshCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardFocusMode } from "@/components/dashboard/dashboard-focus-mode";
import type { KitchenLabels } from "./types";

type KitchenHeaderProps = {
  labels: KitchenLabels;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  copilot?: ReactNode;
};

export function KitchenHeader({
  labels,
  onRefresh,
  isRefreshing = false,
  copilot,
}: KitchenHeaderProps) {
  const { isFocused, enterFocus, exitFocus } = useDashboardFocusMode();

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {labels.header.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {labels.header.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {copilot}
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:flex">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={isFocused ? exitFocus : enterFocus}
          >
            {isFocused ? (
              <Minimize2 className="size-4" aria-hidden />
            ) : (
              <Maximize2 className="size-4" aria-hidden />
            )}
            {isFocused
              ? labels.actions.exitFullscreen
              : labels.actions.fullscreen}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={isRefreshing ? "size-4 animate-spin" : "size-4"}
              aria-hidden
            />
            {labels.actions.refresh}
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/settings">
              <Settings2 className="size-4" aria-hidden />
              {labels.actions.configureStations}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
