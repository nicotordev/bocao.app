"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { OrderChannelBadge } from "./order-channel-badge";
import type { DashboardOrder, OrdersLabels } from "./types";
import { cn } from "@/lib/utils";

type OrdersKanbanCardProps = {
  order: DashboardOrder;
  labels: OrdersLabels;
  onSelectOrder: (order: DashboardOrder) => void;
  isDragOverlay?: boolean;
  isDisabled?: boolean;
};

export function OrdersKanbanCard({
  order,
  labels,
  onSelectOrder,
  isDragOverlay = false,
  isDisabled = false,
}: OrdersKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { type: "order", order },
      disabled: isDisabled || isDragOverlay,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <article
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "rounded-2xl border border-border bg-background/90 text-left shadow-sm transition-[box-shadow,opacity,transform]",
        isDragOverlay &&
          "rotate-1 scale-[1.02] border-primary/40 shadow-lg ring-2 ring-primary/20",
        isDragging && !isDragOverlay && "opacity-40",
        !isDragOverlay && !isDragging && "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          className={cn(
            "mt-0.5 shrink-0 touch-none rounded-lg p-1 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDisabled && "cursor-not-allowed opacity-50",
          )}
          aria-label={labels.kanban.dragHelp}
          disabled={isDisabled || isDragOverlay}
          {...listeners}
          {...attributes}
          onClick={(event) => event.stopPropagation()}
        >
          <IconGripVertical className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          onClick={() => onSelectOrder(order)}
          aria-label={`${labels.accessibility.openDetails} ${order.id}`}
          disabled={isDragOverlay}
        >
          <p className="font-medium leading-tight">{order.id}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {order.customerName}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <OrderChannelBadge
              channel={order.channel}
              labels={labels.channels}
              whatsappLabel={labels.accessibility.whatsappOrder}
            />
            <span className="text-sm font-semibold tabular-nums">{order.total}</span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {order.waitMinutes} {labels.table.minutes}
            {order.owner ? ` · ${order.owner}` : ""}
          </p>
        </button>
      </div>
    </article>
  );
}
