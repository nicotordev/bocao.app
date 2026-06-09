"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pause,
  Play,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { isKitchenOrderDelayed } from "@/lib/kitchen/filters";
import { cn } from "@/lib/utils";
import { KitchenPriorityBadge } from "./kitchen-priority-badge";
import { KitchenStatusBadge } from "./kitchen-status-badge";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenTicketCardProps = {
  order: KitchenOrder;
  labels: KitchenLabels;
  compact?: boolean;
  onSelect: (order: KitchenOrder) => void;
  onStart?: (order: KitchenOrder) => void;
  onPause?: (order: KitchenOrder) => void;
  onMarkReady?: (order: KitchenOrder) => void;
};

function resolveDestination(order: KitchenOrder, labels: KitchenLabels) {
  if (order.tableNumber) {
    return `${labels.ticket.table} ${order.tableNumber}`;
  }

  return order.customerName ?? "—";
}

export function KitchenTicketCard({
  order,
  labels,
  compact = false,
  onSelect,
  onStart,
  onPause,
  onMarkReady,
}: KitchenTicketCardProps) {
  const delayed = isKitchenOrderDelayed(order);
  const displayStatus = delayed && order.status !== "delivered" ? "delayed" : order.status;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-card/90 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        delayed && "border-destructive/40 ring-1 ring-destructive/20",
        compact && "shadow-sm",
      )}
    >
      <CardHeader className={cn("gap-3", compact ? "p-3 pb-2" : "p-4 pb-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-semibold leading-tight">
              {order.number} · {resolveDestination(order, labels)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {labels.statuses[displayStatus]} · {order.elapsedMinutes}{" "}
              {labels.ticket.minutes}
              {order.isPaused ? ` · ${labels.ticket.paused}` : ""}
            </p>
          </div>
          <KitchenPriorityBadge priority={order.priority} labels={labels.priorities} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <KitchenStatusBadge status={displayStatus} labels={labels.statuses} />
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            {labels.channels[order.channel]}
          </span>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            {labels.stations[order.station]}
          </span>
        </div>
      </CardHeader>

      {!compact ? (
        <CardContent className="space-y-3 px-4 pb-3">
          {delayed ? (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {labels.ticket.delayedAlert}
            </div>
          ) : null}

          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="font-medium">
                  {item.quantity}x {item.name}
                </p>
                {item.modifiers?.map((modifier) => (
                  <p key={modifier} className="pl-3 text-muted-foreground">
                    - {modifier}
                  </p>
                ))}
                {item.allergens?.map((allergen) => (
                  <p
                    key={allergen}
                    className="mt-1 flex items-center gap-1 pl-3 text-xs text-chart-3"
                  >
                    <Wheat className="size-3" aria-hidden />
                    {labels.ticket.allergen}: {allergen}
                  </p>
                ))}
              </li>
            ))}
          </ul>

          {order.importantNote ? (
            <div className="rounded-2xl border border-chart-3/30 bg-chart-3/10 px-3 py-2 text-sm text-chart-3">
              {labels.ticket.importantNote}: {order.importantNote}
            </div>
          ) : null}

          {order.kitchenNotes ? (
            <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {labels.ticket.kitchenNote}: {order.kitchenNotes}
            </p>
          ) : null}
        </CardContent>
      ) : null}

      <CardFooter
        className={cn(
          "flex flex-wrap gap-2 border-t border-border/60 bg-muted/20",
          compact ? "p-2" : "p-3",
        )}
      >
        {order.status === "received" || order.status === "waiting" ? (
          <Button
            size={compact ? "sm" : "default"}
            className="min-h-10 flex-1 gap-1.5"
            onClick={() => onStart?.(order)}
          >
            <Play className="size-4" aria-hidden />
            {labels.actions.start}
          </Button>
        ) : null}

        {order.status === "in_preparation" || order.status === "delayed" ? (
          <Button
            size={compact ? "sm" : "default"}
            variant="secondary"
            className="min-h-10 flex-1 gap-1.5"
            onClick={() => onPause?.(order)}
          >
            <Pause className="size-4" aria-hidden />
            {order.isPaused ? labels.actions.resume : labels.actions.pause}
          </Button>
        ) : null}

        {order.status !== "ready" && order.status !== "delivered" ? (
          <Button
            size={compact ? "sm" : "default"}
            variant="default"
            className="min-h-10 flex-1 gap-1.5"
            onClick={() => onMarkReady?.(order)}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            {labels.actions.markReady}
          </Button>
        ) : null}

        <Button
          size={compact ? "sm" : "default"}
          variant="outline"
          className="min-h-10 gap-1.5"
          onClick={() => onSelect(order)}
        >
          <Eye className="size-4" aria-hidden />
          {labels.actions.viewDetail}
        </Button>
      </CardFooter>
    </Card>
  );
}
