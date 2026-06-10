"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isKitchenOrderCompletedLate } from "@/lib/kitchen/filters";
import type { KitchenKanbanStatus, KitchenStation } from "@/lib/kitchen/types";
import { KitchenDetailActions } from "./kitchen-detail-actions";
import { KitchenPriorityBadge } from "./kitchen-priority-badge";
import { KitchenStatusBadge } from "./kitchen-status-badge";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenDetailDialogProps = {
  labels: KitchenLabels;
  order: KitchenOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, status: KitchenKanbanStatus) => void;
  onStationChange?: (orderId: string, station: KitchenStation) => void;
  onMarkDelayed?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCancelOrder?: (order: KitchenOrder) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function resolveDestination(order: KitchenOrder, labels: KitchenLabels) {
  if (order.tableNumber) {
    return `${labels.ticket.table} ${order.tableNumber}`;
  }

  return order.customerName ?? "—";
}

export function KitchenDetailDialog({
  labels,
  order,
  open,
  onOpenChange,
  onStatusChange,
  onStationChange,
  onMarkDelayed,
  onMarkReady,
  onMarkDelivered,
  onCancelOrder,
}: KitchenDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(92vh,860px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {order ? (
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
            <DialogTitle>
              {labels.drawer.title} {order.number}
            </DialogTitle>
            <DialogDescription>{labels.drawer.description}</DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>{labels.drawer.title}</DialogTitle>
            <DialogDescription>{labels.drawer.description}</DialogDescription>
          </DialogHeader>
        )}

        {order ? (
          <div className="min-h-0 overflow-y-auto">
            <div className="space-y-6 px-6 py-6">
              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {labels.drawer.order}
                </h3>
                <div className="mt-4 grid gap-3">
                  <DetailRow
                    label={labels.drawer.number}
                    value={order.number}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {labels.drawer.status}
                    </span>
                    <KitchenStatusBadge
                      status={order.status}
                      labels={labels.statuses}
                      completedLate={isKitchenOrderCompletedLate(order)}
                    />
                  </div>
                  <DetailRow
                    label={labels.drawer.channel}
                    value={labels.channels[order.channel]}
                  />
                  <DetailRow
                    label={labels.drawer.destination}
                    value={resolveDestination(order, labels)}
                  />
                  <DetailRow
                    label={labels.drawer.receivedAt}
                    value={order.receivedAt}
                  />
                  <DetailRow
                    label={labels.drawer.totalTime}
                    value={`${order.elapsedMinutes} ${labels.ticket.minutes}`}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {labels.drawer.items}
                </h3>
                <div className="mt-4 space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-background/60 p-3"
                    >
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                      {item.modifiers?.length ? (
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {item.modifiers.map((modifier) => (
                            <li key={modifier}>- {modifier}</li>
                          ))}
                        </ul>
                      ) : null}
                      {item.allergens?.length ? (
                        <p className="mt-2 text-xs text-chart-3">
                          {labels.drawer.allergens}: {item.allergens.join(", ")}
                        </p>
                      ) : null}
                      {item.notes ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {labels.drawer.notes}: {item.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {labels.drawer.operation}
                </h3>
                <div className="mt-4 grid gap-3">
                  <DetailRow
                    label={labels.drawer.station}
                    value={labels.stations[order.station]}
                  />
                  <DetailRow
                    label={labels.drawer.assignee}
                    value={order.assignedTo ?? "—"}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {labels.drawer.priority}
                    </span>
                    <KitchenPriorityBadge
                      priority={order.priority}
                      labels={labels.priorities}
                    />
                  </div>
                  <DetailRow
                    label={labels.drawer.sla}
                    value={`${order.slaMinutes} ${labels.ticket.minutes}`}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {labels.drawer.timeline}
                </h3>
                <ol className="relative mt-4 space-y-2 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-border">
                  {order.timeline.map((event, index) => (
                    <li
                      key={`${event.time}-${index}`}
                      className="relative pl-7 text-sm"
                    >
                      <span className="absolute top-1.5 left-0 size-2 rounded-full bg-primary" />
                      <p className="font-medium">
                        {event.time} · {labels.timeline[event.titleKey]}
                      </p>
                      {event.actor ? (
                        <p className="text-xs text-muted-foreground">
                          {event.actor}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>

              <KitchenDetailActions
                labels={labels}
                order={order}
                onStatusChange={onStatusChange}
                onStationChange={onStationChange}
                onMarkDelayed={onMarkDelayed}
                onMarkReady={onMarkReady}
                onMarkDelivered={onMarkDelivered}
                onCancelOrder={onCancelOrder}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
