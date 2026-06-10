"use client";

import type { ReactNode } from "react";
import {
  TbMaximize,
  TbMinimize,
  TbPlus,
  TbRefresh,
  TbSettings,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useDashboardFocusMode } from "@/components/dashboard/dashboard-focus-mode";
import Link from "next/link";
import type { KitchenRealtimeConnectionState } from "@/lib/realtime/types";
import type { KitchenLabels } from "./types";

type KitchenHeaderProps = {
  labels: KitchenLabels;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  connectionState?: KitchenRealtimeConnectionState;
  onNewOrder?: () => void;
  copilot?: ReactNode;
};

function connectionIndicatorClassName(
  state: KitchenRealtimeConnectionState | undefined,
): string {
  switch (state) {
    case "connected":
      return "bg-emerald-500";
    case "connecting":
      return "bg-amber-500";
    default:
      return "bg-muted-foreground/50";
  }
}

function connectionLabel(
  labels: KitchenLabels,
  state: KitchenRealtimeConnectionState | undefined,
): string {
  switch (state) {
    case "connected":
      return labels.realtime.connected;
    case "connecting":
      return labels.realtime.connecting;
    default:
      return labels.realtime.disconnected;
  }
}

export function KitchenHeader({
  labels,
  onRefresh,
  isRefreshing = false,
  connectionState,
  onNewOrder,
  copilot,
}: KitchenHeaderProps) {
  const { isFocused, enterFocus, exitFocus } = useDashboardFocusMode();

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {labels.header.title}
          </h1>
          {connectionState ? (
            <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              <span
                className={`size-2 rounded-full ${connectionIndicatorClassName(connectionState)}`}
                aria-hidden
              />
              {connectionLabel(labels, connectionState)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {labels.header.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onNewOrder ? (
          <Button className="gap-2" onClick={onNewOrder}>
            <TbPlus className="size-4" aria-hidden />
            {labels.actions.newOrder}
          </Button>
        ) : null}
        {copilot}
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:flex">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={isFocused ? exitFocus : enterFocus}
          >
            {isFocused ? (
              <TbMinimize className="size-4" aria-hidden />
            ) : (
              <TbMaximize className="size-4" aria-hidden />
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
            <TbRefresh
              className={isRefreshing ? "size-4 animate-spin" : "size-4"}
              aria-hidden
            />
            {labels.actions.refresh}
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/kitchen/stations">
              <TbSettings className="size-4" aria-hidden />
              {labels.actions.configureStations}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
