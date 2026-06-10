"use client";

import type { IconType } from "react-icons";
import {
  TbAlertTriangle,
  TbBasket,
  TbCake,
  TbCircleCheck,
  TbClipboardCheck,
  TbCup,
  TbFish,
  TbFlame,
  TbPlayerPlay,
  TbPrinter,
  TbTrash,
  TbTruckDelivery,
} from "react-icons/tb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isKitchenOrderCompletedLate } from "@/lib/kitchen/filters";
import { printKitchenTicket } from "@/lib/kitchen/print-ticket";
import type { KitchenKanbanStatus, KitchenStation } from "@/lib/kitchen/types";
import { cn } from "@/lib/utils";
import { KitchenStatusBadge } from "./kitchen-status-badge";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenDetailActionsProps = {
  labels: KitchenLabels;
  order: KitchenOrder;
  onStatusChange?: (orderId: string, status: KitchenKanbanStatus) => void;
  onStationChange?: (orderId: string, station: KitchenStation) => void;
  onMarkDelayed?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCancelOrder?: (order: KitchenOrder) => void;
};

const statusOptions: KitchenKanbanStatus[] = [
  "received",
  "in_preparation",
  "waiting",
  "ready",
  "delivered",
];

const stationOptions: KitchenStation[] = [
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery_station",
];

const stationIcons: Record<KitchenStation, IconType> = {
  grill: TbFlame,
  fryer: TbBasket,
  sushi: TbFish,
  bar: TbCup,
  desserts: TbCake,
  delivery_station: TbTruckDelivery,
};

const statusPillActive: Record<KitchenKanbanStatus, string> = {
  received:
    "border-secondary/60 bg-secondary/70 text-secondary-foreground shadow-sm ring-2 ring-secondary/25",
  in_preparation:
    "border-chart-2/40 bg-chart-2/15 text-chart-2 shadow-sm ring-2 ring-chart-2/20",
  waiting:
    "border-border bg-muted text-foreground shadow-sm ring-2 ring-border/80",
  ready:
    "border-chart-1/40 bg-chart-1/15 text-chart-1 shadow-sm ring-2 ring-chart-1/20",
  delivered:
    "border-primary/40 bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20",
};

type QuickActionTone = "primary" | "success" | "warning";

type QuickAction = {
  key: string;
  label: string;
  icon: IconType;
  tone: QuickActionTone;
  onClick: () => void;
};

const quickActionToneClassName: Record<QuickActionTone, string> = {
  primary:
    "border-primary/25 bg-primary/8 text-primary hover:border-primary/40 hover:bg-primary/12",
  success:
    "border-chart-1/30 bg-chart-1/10 text-chart-1 hover:border-chart-1/45 hover:bg-chart-1/15",
  warning:
    "border-destructive/25 bg-destructive/8 text-destructive hover:border-destructive/40 hover:bg-destructive/12",
};

function resolveSelectedStatus(order: KitchenOrder): KitchenKanbanStatus {
  if (order.status === "delayed") {
    return "in_preparation";
  }

  return order.status;
}

function resolveQuickActions(
  order: KitchenOrder,
  labels: KitchenLabels,
  handlers: Pick<
    KitchenDetailActionsProps,
    "onStatusChange" | "onMarkDelayed" | "onMarkReady" | "onMarkDelivered"
  >,
): QuickAction[] {
  const actions: QuickAction[] = [];

  if (order.status === "received" || order.status === "waiting") {
    actions.push({
      key: "start",
      label: labels.actions.start,
      icon: TbPlayerPlay,
      tone: "primary",
      onClick: () => handlers.onStatusChange?.(order.id, "in_preparation"),
    });
  }

  if (order.status === "in_preparation" || order.status === "delayed") {
    actions.push({
      key: "ready",
      label: labels.actions.markReady,
      icon: TbCircleCheck,
      tone: "success",
      onClick: () => handlers.onMarkReady?.(order.id),
    });
    actions.push({
      key: "delayed",
      label: labels.actions.markDelayed,
      icon: TbAlertTriangle,
      tone: "warning",
      onClick: () => handlers.onMarkDelayed?.(order.id),
    });
  }

  if (order.status === "ready") {
    actions.push({
      key: "deliver",
      label: labels.actions.markDelivered,
      icon: TbClipboardCheck,
      tone: "success",
      onClick: () => handlers.onMarkDelivered?.(order.id),
    });
  }

  return actions;
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={cn(
        "group flex min-h-22 flex-col justify-between rounded-2xl border p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        quickActionToneClassName[action.tone],
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl bg-background/70 shadow-sm transition group-hover:scale-105",
          action.tone === "primary" && "text-primary",
          action.tone === "success" && "text-chart-1",
          action.tone === "warning" && "text-destructive",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-semibold leading-tight">
        {action.label}
      </span>
    </button>
  );
}

export function KitchenDetailActions({
  labels,
  order,
  onStatusChange,
  onStationChange,
  onMarkDelayed,
  onMarkReady,
  onMarkDelivered,
  onCancelOrder,
}: KitchenDetailActionsProps) {
  const selectedStatus = resolveSelectedStatus(order);
  const quickActions = resolveQuickActions(order, labels, {
    onStatusChange,
    onMarkDelayed,
    onMarkReady,
    onMarkDelivered,
  });

  const handlePrintTicket = () => {
    try {
      printKitchenTicket(order, labels);
    } catch {
      toast.error(labels.feedback.printError);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-muted/30 via-card to-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">
          {labels.drawer.actions}
        </h3>
        <KitchenStatusBadge
          status={order.status}
          labels={labels.statuses}
          completedLate={isKitchenOrderCompletedLate(order)}
        />
      </div>

      {quickActions.length > 0 ? (
        <div
          className={cn(
            "mt-4 grid gap-3",
            quickActions.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {quickActions.map((action) => (
            <QuickActionCard key={action.key} action={action} />
          ))}
        </div>
      ) : null}

      <div
        className={cn("space-y-4", quickActions.length > 0 ? "mt-6" : "mt-4")}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
            {labels.actions.changeStatus}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const isSelected = selectedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusChange?.(order.id, status)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition duration-150",
                    isSelected
                      ? statusPillActive[status]
                      : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/35 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isSelected ? "bg-current" : "bg-muted-foreground/40",
                    )}
                  />
                  {labels.statuses[status]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
            {labels.actions.reassignStation}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stationOptions.map((station) => {
              const Icon = stationIcons[station];
              const isSelected = order.station === station;

              return (
                <button
                  key={station}
                  type="button"
                  onClick={() => onStationChange?.(order.id, station)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition duration-150",
                    isSelected
                      ? "border-primary/40 bg-primary/10 text-primary shadow-sm ring-2 ring-primary/15"
                      : "border-border/50 bg-background/45 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="line-clamp-2 leading-snug">
                    {labels.stations[station]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="my-5 opacity-60" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-2 rounded-2xl"
          onClick={handlePrintTicket}
        >
          <TbPrinter className="size-4" aria-hidden />
          {labels.actions.printTicket}
        </Button>
        <Button
          variant="ghost"
          className="h-11 gap-2 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onCancelOrder?.(order)}
        >
          <TbTrash className="size-4" aria-hidden />
          {labels.actions.cancelOrder}
        </Button>
      </div>
    </section>
  );
}
