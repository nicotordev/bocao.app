"use client";

import {
  TbAlertTriangle,
  TbCircleCheck,
  TbClipboardCheck,
  TbPlayerPause,
  TbPlayerPlay,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  isKitchenOrderActiveDelayed,
  isKitchenOrderCompletedLate,
} from "@/lib/kitchen/filters";
import { getKitchenOrderCardClassName } from "@/lib/kitchen/card-styles";
import { cn } from "@/lib/utils";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenTicketCardProps = {
  order: KitchenOrder;
  labels: KitchenLabels;
  onSelect: (order: KitchenOrder) => void;
  onStart?: (order: KitchenOrder) => void;
  onPause?: (order: KitchenOrder) => void;
  onMarkReady?: (order: KitchenOrder) => void;
  onMarkDelivered?: (order: KitchenOrder) => void;
};

function resolveDestination(order: KitchenOrder, labels: KitchenLabels) {
  if (order.tableNumber) {
    return `${labels.ticket.table} ${order.tableNumber}`;
  }

  return order.customerName ?? "—";
}

function summarizeItems(order: KitchenOrder, labels: KitchenLabels) {
  const [first, second, ...rest] = order.items;

  if (!first) {
    return labels.ticket.noItems;
  }

  const parts = [`${first.quantity}x ${first.name}`];

  if (second) {
    parts.push(`${second.quantity}x ${second.name}`);
  }

  if (rest.length > 0) {
    parts.push(labels.ticket.moreItems.replace("{count}", String(rest.length)));
  }

  return parts.join(" · ");
}

function resolvePrimaryAction(order: KitchenOrder) {
  if (order.status === "received" || order.status === "waiting") {
    return "start" as const;
  }

  if (order.status === "in_preparation" || order.status === "delayed") {
    return "ready" as const;
  }

  if (order.status === "ready") {
    return "deliver" as const;
  }

  return null;
}

export function KitchenTicketCard({
  order,
  labels,
  onSelect,
  onStart,
  onPause,
  onMarkReady,
  onMarkDelivered,
}: KitchenTicketCardProps) {
  const activeDelayed = isKitchenOrderActiveDelayed(order);
  const completedLate = isKitchenOrderCompletedLate(order);
  const primaryAction = resolvePrimaryAction(order);
  const showPause =
    order.status === "in_preparation" || order.status === "delayed";

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border bg-card/95 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        getKitchenOrderCardClassName(order),
      )}
    >
      <button
        type="button"
        className="flex flex-1 flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => onSelect(order)}
        aria-label={`${labels.actions.viewDetail} ${order.number}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold leading-none tabular-nums">
              {order.number}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {resolveDestination(order, labels)}
            </p>
          </div>
          {activeDelayed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              <TbAlertTriangle className="size-3" aria-hidden />
              {labels.statuses.delayed}
            </span>
          ) : null}
          {completedLate ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/35 bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
              <TbAlertTriangle className="size-3 text-warning" aria-hidden />
              {labels.statuses.deliveredLate}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm leading-snug">
          {summarizeItems(order, labels)}
        </p>

        <p className="text-xs font-medium tabular-nums text-muted-foreground">
          {order.elapsedMinutes} {labels.ticket.minutes}
          {order.isPaused ? ` · ${labels.ticket.paused}` : ""}
        </p>
      </button>

      {primaryAction || showPause ? (
        <div className="flex gap-2 border-t border-border/60 bg-muted/15 p-3">
          {primaryAction === "start" ? (
            <Button
              className="min-h-11 flex-1 gap-1.5"
              onClick={() => onStart?.(order)}
            >
              <TbPlayerPlay className="size-4" aria-hidden />
              {labels.actions.start}
            </Button>
          ) : null}

          {primaryAction === "ready" ? (
            <Button
              className="min-h-11 flex-1 gap-1.5"
              onClick={() => onMarkReady?.(order)}
            >
              <TbCircleCheck className="size-4" aria-hidden />
              {labels.actions.markReady}
            </Button>
          ) : null}

          {primaryAction === "deliver" ? (
            <Button
              className="min-h-11 flex-1 gap-1.5"
              onClick={() => onMarkDelivered?.(order)}
            >
              <TbClipboardCheck className="size-4" aria-hidden />
              {labels.actions.markDelivered}
            </Button>
          ) : null}

          {showPause ? (
            <Button
              variant="secondary"
              className="min-h-11 shrink-0 gap-1.5 px-4"
              onClick={() => onPause?.(order)}
            >
              <TbPlayerPause className="size-4" aria-hidden />
              {order.isPaused ? labels.actions.resume : labels.actions.pause}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
