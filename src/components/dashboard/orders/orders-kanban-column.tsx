"use client";

import { useDroppable } from "@dnd-kit/core";
import { OrderStatusBadge } from "./order-status-badge";
import { OrdersKanbanCard } from "./orders-kanban-card";
import type { DashboardOrder, OrderStatus, OrdersLabels } from "./types";
import { cn } from "@/lib/utils";

export function kanbanColumnId(status: OrderStatus) {
  return `column:${status}`;
}

type OrdersKanbanColumnProps = {
  status: OrderStatus;
  orders: DashboardOrder[];
  labels: OrdersLabels;
  onSelectOrder: (order: DashboardOrder) => void;
  isDisabled?: boolean;
  guideOrderId?: string | null;
};

export function OrdersKanbanColumn({
  status,
  orders,
  labels,
  onSelectOrder,
  isDisabled = false,
  guideOrderId = null,
}: OrdersKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: kanbanColumnId(status),
    data: { type: "column", status },
    disabled: isDisabled,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-48 min-w-0 flex-col rounded-3xl border bg-card/70 p-3 transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "border-border/70",
      )}
      aria-label={labels.statuses[status]}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <OrderStatusBadge status={status} labels={labels.statuses} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {orders.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {orders.map((order) => (
          <OrdersKanbanCard
            key={order.id}
            order={order}
            labels={labels}
            onSelectOrder={onSelectOrder}
            isDisabled={isDisabled}
            highlightDragHandle={order.id === guideOrderId}
          />
        ))}

        {orders.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground",
              isOver && "border-primary/40 bg-primary/5 text-primary/80",
            )}
          >
            {labels.kanban.dropHere}
          </div>
        ) : null}
      </div>
    </section>
  );
}
